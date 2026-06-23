"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineWebhook = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
const lineWebhookCore_1 = require("./lineWebhookCore");
const LINE_CHANNEL_SECRET = (0, params_1.defineSecret)("LINE_CHANNEL_SECRET");
const LINE_CHANNEL_ACCESS_TOKEN = (0, params_1.defineSecret)("LINE_CHANNEL_ACCESS_TOKEN");
const OPENAI_API_KEY = (0, params_1.defineSecret)("OPENAI_API_KEY");
class FirestoreLineStore {
    db = (0, firestore_1.getFirestore)();
    async getLineEvent(id) {
        const snap = await this.db.collection("line_events").doc(id).get();
        return snap.exists ? (snap.data() ?? null) : null;
    }
    async getLineUser(hash) {
        const snap = await this.db.collection("line_users").doc(hash).get();
        return snap.exists ? snap.data() : null;
    }
    async upsertLineUser(hash, data) {
        await this.db.collection("line_users").doc(hash).set({ id: hash, ...data }, { merge: true });
    }
    async createLineEvent(data, id) {
        const ref = id ? this.db.collection("line_events").doc(id) : this.db.collection("line_events").doc();
        await ref.set({ id: ref.id, ...data }, { merge: true });
        return ref.id;
    }
    async updateLineEvent(id, data) {
        await this.db.collection("line_events").doc(id).set(data, { merge: true });
    }
    async createInbox(data) {
        const ref = this.db.collection("ai_inbox").doc();
        await ref.set({ id: ref.id, ...data });
        return ref.id;
    }
    async updateInbox(id, data) {
        await this.db.collection("ai_inbox").doc(id).set(data, { merge: true });
    }
    async createTaskDispatch(data) {
        const ref = this.db.collection("task_dispatches").doc();
        await ref.set({ id: ref.id, ...data });
        return ref.id;
    }
    async createRouteLog(data) {
        const ref = this.db.collection("ai_route_logs").doc();
        await ref.set({ id: ref.id, ...data });
        return ref.id;
    }
    async createAuditLog(data) {
        const ref = this.db.collection("audit_logs").doc();
        await ref.set({ id: ref.id, ...data });
        return ref.id;
    }
}
class LineMessagingReplyClient {
    async reply(input) {
        const result = await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${input.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                replyToken: input.replyToken,
                messages: [{ type: "text", text: input.message }]
            })
        });
        if (!result.ok) {
            throw new Error(`LINE reply failed with status ${result.status}`);
        }
    }
}
function safeSecretValue(secret) {
    try {
        return secret.value();
    }
    catch {
        return "";
    }
}
exports.lineWebhook = (0, https_1.onRequest)({
    region: "asia-east1",
    secrets: [LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, OPENAI_API_KEY]
}, async (request, response) => {
    if (request.method !== "POST") {
        response.status(405).send("Method not allowed");
        return;
    }
    const lineChannelSecret = safeSecretValue(LINE_CHANNEL_SECRET);
    const lineChannelAccessToken = safeSecretValue(LINE_CHANNEL_ACCESS_TOKEN);
    const openaiApiKey = safeSecretValue(OPENAI_API_KEY);
    const lineReplyEnabled = process.env.LINE_REPLY_ENABLED === "true";
    const result = await (0, lineWebhookCore_1.processLineWebhook)({
        rawBody: request.rawBody,
        signature: request.header("x-line-signature") ?? undefined,
        env: {
            lineChannelSecret,
            lineChannelAccessToken,
            lineReplyEnabled,
            webhookMode: process.env.LINE_WEBHOOK_MODE ?? "capture_only"
        },
        store: new FirestoreLineStore(),
        replyClient: new LineMessagingReplyClient()
    });
    firebase_functions_1.logger.info("LINE webhook processed", {
        status: result.status,
        ok: result.body.ok,
        reply_sent: result.body.reply_sent,
        reply_mode: result.body.reply_mode,
        line_reply_enabled: lineReplyEnabled,
        line_reply_token_configured: Boolean(lineChannelAccessToken),
        openai_mode: openaiApiKey ? "secret_available_unused_phase_4b" : "fallback_mock_no_openai_secret",
        error_code: result.log.error_code,
        error_message_redacted: result.log.error_message_redacted,
        event_shape_summary: result.log.event_shape_summary,
        has_events: result.log.has_events,
        event_count: result.log.event_count,
        has_user_id: result.log.has_user_id,
        message_type: result.log.message_type
    });
    response.status(result.status).json(result.body);
});
//# sourceMappingURL=lineWebhook.js.map