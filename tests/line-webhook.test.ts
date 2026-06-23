import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  hashValue,
  processLineWebhook,
  type LineReplyClient,
  type LineStore,
  type LineUserRecord
} from "../functions/src/lineWebhookCore";

const secret = "test-line-secret";
const lineUserId = "U1234567890abcdef";

class MemoryLineStore implements LineStore {
  lineUsers = new Map<string, LineUserRecord>();
  lineEvents: Record<string, unknown>[] = [];
  inbox: Record<string, unknown>[] = [];
  tasks: Record<string, unknown>[] = [];
  routeLogs: Record<string, unknown>[] = [];
  auditLogs: Record<string, unknown>[] = [];

  async getLineEvent(id: string) {
    return this.lineEvents.find((event) => event.id === id) ?? null;
  }

  async getLineUser(hash: string) {
    return this.lineUsers.get(hash) ?? null;
  }

  async upsertLineUser(hash: string, data: Partial<LineUserRecord>) {
    this.lineUsers.set(hash, { ...(this.lineUsers.get(hash) as LineUserRecord | undefined), ...data } as LineUserRecord);
  }

  async createLineEvent(data: Record<string, unknown>, id?: string) {
    const eventId = id ?? `line-event-${this.lineEvents.length + 1}`;
    this.lineEvents.push({ id: eventId, ...data });
    return eventId;
  }

  async updateLineEvent(id: string, data: Record<string, unknown>) {
    const index = this.lineEvents.findIndex((event) => event.id === id);
    if (index >= 0) {
      this.lineEvents[index] = { ...this.lineEvents[index], ...data };
    }
  }

  async createInbox(data: Record<string, unknown>) {
    const id = `inbox-${this.inbox.length + 1}`;
    this.inbox.push({ id, ...data });
    return id;
  }

  async updateInbox(id: string, data: Record<string, unknown>) {
    const index = this.inbox.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.inbox[index] = { ...this.inbox[index], ...data };
    }
  }

  async createTaskDispatch(data: Record<string, unknown>) {
    const id = `task-${this.tasks.length + 1}`;
    this.tasks.push({ id, ...data });
    return id;
  }

  async createRouteLog(data: Record<string, unknown>) {
    const id = `route-${this.routeLogs.length + 1}`;
    this.routeLogs.push({ id, ...data });
    return id;
  }

  async createAuditLog(data: Record<string, unknown>) {
    const id = `audit-${this.auditLogs.length + 1}`;
    this.auditLogs.push({ id, ...data });
    return id;
  }
}

class MockReplyClient implements LineReplyClient {
  replies: Array<{ replyToken: string; accessToken: string; message: string }> = [];

  async reply(input: { replyToken: string; accessToken: string; message: string }) {
    this.replies.push(input);
  }
}

function lineBody(message: Record<string, unknown>, options?: { eventId?: string; replyToken?: string }) {
  return Buffer.from(
    JSON.stringify({
      events: [
        {
          type: "message",
          webhookEventId: options?.eventId ?? "event-1",
          replyToken: options?.replyToken ?? "reply-token-1",
          source: { type: "user", userId: lineUserId },
          message
        }
      ]
    })
  );
}

function bodyWithEvents(events?: Array<Record<string, unknown>>) {
  return Buffer.from(JSON.stringify(events === undefined ? {} : { events }));
}

function signature(rawBody: Buffer) {
  return createHmac("sha256", secret).update(rawBody).digest("base64");
}

describe("LINE webhook Phase 4A", () => {
  let store: MemoryLineStore;
  let replyClient: MockReplyClient;

  beforeEach(() => {
    store = new MemoryLineStore();
    replyClient = new MockReplyClient();
  });

  it("valid signature + empty events returns 200 and does not write inbox/task", async () => {
    const rawBody = bodyWithEvents([]);
    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, webhookMode: "capture_only" },
      store
    });

    expect(result.status).toBe(200);
    expect(result.body.reply_sent).toBe(false);
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });

  it("valid signature + body without events returns 200 and does not write inbox/task", async () => {
    const rawBody = bodyWithEvents(undefined);
    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, webhookMode: "capture_only" },
      store
    });

    expect(result.status).toBe(200);
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });

  it("valid signature + event without source.userId returns 200 and does not write inbox/task", async () => {
    const rawBody = bodyWithEvents([
      {
        type: "message",
        webhookEventId: "event-no-user",
        source: { type: "user" },
        message: { type: "text", text: "hello" }
      }
    ]);
    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, webhookMode: "capture_only" },
      store
    });

    expect(result.status).toBe(200);
    expect(store.lineEvents[0].status).toBe("waiting_owner_link");
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });

  it("valid signature + event without message returns 200 and does not write inbox/task", async () => {
    const rawBody = bodyWithEvents([
      {
        type: "message",
        webhookEventId: "event-no-message",
        source: { type: "user", userId: lineUserId }
      }
    ]);
    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, webhookMode: "capture_only" },
      store
    });

    expect(result.status).toBe(200);
    expect(store.lineEvents[0].status).toBe("waiting_owner_link");
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });

  it("valid signature + unauthorized user creates pending candidate and no inbox/task", async () => {
    const rawBody = lineBody({ type: "text", text: "請用 Codex 開發身境 App 的任務管理功能" });
    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: {
        lineChannelSecret: secret,
        lineChannelAccessToken: "test-access-token",
        lineReplyEnabled: true,
        webhookMode: "capture_only"
      },
      store,
      replyClient,
      now: "2026-06-23T00:00:00.000Z"
    });

    expect(result.status).toBe(200);
    expect(store.lineUsers.get(hashValue(lineUserId))?.status).toBe("pending");
    expect(store.lineEvents[0].status).toBe("waiting_owner_link");
    expect(store.lineEvents[0].reply_status).toBe("skipped_unauthorized");
    expect(replyClient.replies).toHaveLength(0);
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });

  it("invalid signature returns 401 and does not write inbox/task", async () => {
    const rawBody = lineBody({ type: "text", text: "hello" });
    const result = await processLineWebhook({
      rawBody,
      signature: "bad-signature",
      env: { lineChannelSecret: secret, webhookMode: "capture_only" },
      store
    });

    expect(result.status).toBe(401);
    expect(store.lineEvents[0].status).toBe("rejected_invalid_signature");
    expect(replyClient.replies).toHaveLength(0);
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });

  it("LINE_REPLY_ENABLED=false + allowed user + text writes line event, inbox, route log, task, and no reply", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody({ type: "text", text: "請用 Codex 開發身境 App 的任務管理功能" });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, lineReplyEnabled: false, webhookMode: "active_private" },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(result.body.reply_sent).toBe(false);
    expect(store.lineEvents[0].status).toBe("processed");
    expect(store.lineEvents[0].reply_status).toBe("not_enabled");
    expect(store.inbox[0].source).toBe("line");
    expect(store.inbox[0].project_id).toBe("body_state_app");
    expect(store.tasks[0].need_mark_review).toBe(true);
    expect(store.tasks[0].external_action_allowed).toBe(false);
    expect(store.routeLogs[0].source).toBe("line");
    expect(replyClient.replies).toHaveLength(0);
    expect(store.auditLogs[0].action).toBe("line_reply_skipped");
  });

  it("LINE_REPLY_ENABLED=true + token exists + allowed user replies ack only", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody({ type: "text", text: "請用 Codex 開發身境 App 的任務管理功能" });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: {
        lineChannelSecret: secret,
        lineChannelAccessToken: "test-access-token",
        lineReplyEnabled: true,
        webhookMode: "active_private"
      },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(result.body.reply_sent).toBe(true);
    expect(store.inbox).toHaveLength(1);
    expect(store.tasks).toHaveLength(1);
    expect(replyClient.replies).toHaveLength(1);
    expect(replyClient.replies[0].message).toBe("已收到，已整理到 Mark AI Command Center，請到後台確認。");
    expect(replyClient.replies[0].message).not.toContain("投資建議");
    expect(replyClient.replies[0].message).not.toContain("創業結論");
    expect(store.lineEvents[0].reply_status).toBe("sent");
    expect(store.auditLogs[0].action).toBe("line_reply_sent");
  });

  it("LINE_REPLY_ENABLED=true + needs_clarification replies clarification receipt only", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody({ type: "text", text: "這個之後可以做" });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: {
        lineChannelSecret: secret,
        lineChannelAccessToken: "test-access-token",
        lineReplyEnabled: true,
        webhookMode: "active_private"
      },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(result.body.reply_sent).toBe(true);
    expect(store.inbox[0].needs_clarification).toBe(true);
    expect(store.tasks).toHaveLength(0);
    expect(replyClient.replies[0].message).toBe("已收到，但我需要 Mark 補充分類。請到 Mark AI Command Center 查看需要確認的項目。");
  });

  it("LINE_REPLY_ENABLED=true + token missing does not crash and records skipped_missing_token", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody({ type: "text", text: "請用 Codex 開發身境 App 的任務管理功能" });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, lineReplyEnabled: true, webhookMode: "active_private" },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(result.body.reply_sent).toBe(false);
    expect(store.inbox).toHaveLength(1);
    expect(store.tasks).toHaveLength(1);
    expect(replyClient.replies).toHaveLength(0);
    expect(store.lineEvents[0].reply_status).toBe("skipped_missing_token");
    expect(store.auditLogs[0].action).toBe("line_reply_skipped_missing_token");
  });

  it.each([
    ["請幫我評估服飾選品，初期測試資金要抓多少", "apparel_business"],
    ["我想評估一番賞直播抽獎創業成本", "ichiban_kuji_business"],
    ["我想評估飲料店初期成本和損益平衡", "beverage_business"],
    ["我想知道資金要放股票還是創業測試", "capital_compounding"]
  ])("valid signature + allowed user creates startup/capital task for: %s", async (text, projectId) => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody({ type: "text", text });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, webhookMode: "active_private" },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(result.body.reply_sent).toBe(false);
    expect(store.inbox[0].needs_clarification).toBe(false);
    expect(store.tasks).toHaveLength(1);
    expect(store.tasks[0].project_id).toBe(projectId);
    expect(store.tasks[0].need_mark_review).toBe(true);
    expect(store.tasks[0].decision_status).toBe("pending");
    expect(store.tasks[0].status).toBe("waiting_review");
    expect(store.tasks[0].external_action_allowed).toBe(false);
    expect(replyClient.replies).toHaveLength(0);
  });

  it("valid signature + allowed apparel text writes detailed task fields", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody({ type: "text", text: "請幫我評估服飾選品，初期測試資金要抓多少" });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { lineChannelSecret: secret, webhookMode: "active_private" },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(store.tasks[0].title).toBe("評估服飾選品創業初期測試資金");
    expect(store.tasks[0].task_type).toBe("startup_capital_analysis");
    expect(store.tasks[0].owner_type).toBe("ai_agent");
    expect(store.tasks[0].risk_level).toBe("medium");
    expect(store.tasks[0].safety_forbidden_reasons).toContain("不得自動進貨");
  });

  it("duplicate event does not create duplicate inbox/task or reply", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed",
      approved: true
    });
    const rawBody = lineBody(
      { type: "text", text: "請用 Codex 開發身境 App 的任務管理功能" },
      { eventId: "event-duplicate", replyToken: "reply-token-duplicate" }
    );
    const request = {
      rawBody,
      signature: signature(rawBody),
      env: {
        lineChannelSecret: secret,
        lineChannelAccessToken: "test-access-token",
        lineReplyEnabled: true,
        webhookMode: "active_private" as const
      },
      store,
      replyClient
    };

    const first = await processLineWebhook(request);
    const second = await processLineWebhook(request);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(store.inbox).toHaveLength(1);
    expect(store.tasks).toHaveLength(1);
    expect(replyClient.replies).toHaveLength(1);
    expect(store.lineEvents[0].status).toBe("duplicate_ignored");
    expect(store.lineEvents[0].duplicate_ignored).toBe(true);
  });

  it("valid signature + allowed user + non-text writes unsupported event and no inbox", async () => {
    await store.upsertLineUser(hashValue(lineUserId), {
      line_user_id_hash: hashValue(lineUserId),
      line_user_id_last4: lineUserId.slice(-4),
      status: "allowed"
    });
    const rawBody = lineBody({ type: "image", id: "image-1" });

    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: {
        lineChannelSecret: secret,
        lineChannelAccessToken: "test-access-token",
        lineReplyEnabled: true,
        webhookMode: "active_private"
      },
      store,
      replyClient
    });

    expect(result.status).toBe(200);
    expect(store.lineEvents[0].status).toBe("unsupported_message_type");
    expect(store.lineEvents[0].reply_status).toBe("skipped_non_text");
    expect(store.inbox).toHaveLength(0);
    expect(replyClient.replies).toHaveLength(0);
  });

  it("missing LINE_CHANNEL_SECRET returns clear error and does not process events", async () => {
    const rawBody = lineBody({ type: "text", text: "hello" });
    const result = await processLineWebhook({
      rawBody,
      signature: signature(rawBody),
      env: { webhookMode: "capture_only" },
      store
    });

    expect(result.status).toBe(500);
    expect(store.lineEvents).toHaveLength(0);
    expect(store.inbox).toHaveLength(0);
    expect(store.tasks).toHaveLength(0);
  });
});
