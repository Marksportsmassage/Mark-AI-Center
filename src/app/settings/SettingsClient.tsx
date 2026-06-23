"use client";

import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { safetyRules } from "@/lib/safety";
import { collectionNames, type LineEvent, type LineUser } from "@/types/firestore";

function LineStatusSection({ uid }: { uid: string }) {
  const lineEvents = useFirestoreCollection<LineEvent>("line_events", recent20, true);
  const lineUsers = useFirestoreCollection<LineUser>("line_users", recent20, true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pendingUsers = lineUsers.items.filter((user) => user.status === "pending");
  const allowedUsers = lineUsers.items.filter((user) => user.status === "allowed");
  const webhookMode = process.env.NEXT_PUBLIC_LINE_WEBHOOK_MODE ?? "capture_only";
  const lineReplyEnabled = process.env.NEXT_PUBLIC_LINE_REPLY_ENABLED === "true";
  const lineReplyMode = lineReplyEnabled ? "enabled_ack_only" : "disabled";
  const readError = lineEvents.error ?? lineUsers.error;

  async function approveUser(user: LineUser) {
    setBusyId(user.id);
    const db = getClientDb();

    try {
      await updateDoc(doc(db, "line_users", user.id), {
        status: "allowed",
        approved: true,
        label: "Mark",
        updated_at: serverTimestamp()
      });
      await addDoc(collection(db, "audit_logs"), {
        user_id: uid,
        action: "line_user.approve_as_mark",
        target_collection: "line_users",
        target_id: user.id,
        before: { status: user.status, line_user_id_hash: user.line_user_id_hash, line_user_id_last4: user.line_user_id_last4 },
        after: { status: "allowed", approved: true, label: "Mark" },
        reason: "Approved pending LINE candidate as Mark. No LINE reply or push sent.",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel">
      <h2>LINE 使用者綁定</h2>
      <div className="list">
        {readError ? (
          <div className="item">
            <h3>LINE Firestore read error</h3>
            <p className="muted">{readError}</p>
          </div>
        ) : null}

        <div className="item">
          <h3>Webhook mode</h3>
          <p>{webhookMode}</p>
          <p className="muted">Webhook URL 會是部署後的 Cloud Functions HTTPS URL。</p>
        </div>

        <div className="item">
          <h3>LINE reply mode</h3>
          <div className="badge-row">
            <span className={lineReplyEnabled ? "badge review" : "badge"}>LINE_REPLY_ENABLED={String(lineReplyEnabled)}</span>
            <span className="badge">{lineReplyMode}</span>
          </div>
          <p className="muted">Phase 4B 只允許 Mark 已授權 LINE user 的固定收件確認，不 push，不顯示 token。</p>
        </div>

        <div className="item">
          <h3>Pending candidates</h3>
          {pendingUsers.length === 0 ? <p className="muted">目前沒有 pending LINE candidates。</p> : null}
          <div className="list">
            {pendingUsers.map((user) => (
              <article className="item" key={user.id}>
                <div className="item-header">
                  <h3>Candidate ...{user.line_user_id_last4}</h3>
                  <span className="badge review">{user.status}</span>
                </div>
                <p className="mono">{user.line_user_id_hash}</p>
                <div className="badge-row">
                  <span className="badge">first {user.first_seen_at?.slice(0, 10) ?? "unknown"}</span>
                  <span className="badge">last {user.last_seen_at?.slice(0, 10) ?? "unknown"}</span>
                  <span className="badge">events {user.event_count ?? 0}</span>
                </div>
                <button className="button compact" type="button" disabled={busyId === user.id} onClick={() => approveUser(user)}>
                  Approve as Mark
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="item">
          <h3>Allowed LINE users</h3>
          {allowedUsers.length === 0 ? <p className="muted">尚未綁定 allowed LINE user。</p> : null}
          <div className="badge-row">
            {allowedUsers.map((user) => (
              <span className="badge" key={user.id}>
                {user.label ?? "Mark"} ...{user.line_user_id_last4}
              </span>
            ))}
          </div>
        </div>

        <div className="item">
          <h3>Recent line_events</h3>
          <div className="list">
            {lineEvents.items.slice(0, 10).map((event) => (
              <article className="item" key={event.id}>
                <div className="item-header">
                  <h3>{event.status ?? "received"}</h3>
                  <span className="badge">{event.message_type ?? event.event_type ?? "unknown"}</span>
                </div>
                <p>User ...{event.line_user_id_last4 ?? "unknown"}</p>
                <div className="badge-row">
                  <span className="badge">verified {String(Boolean(event.signature_verified))}</span>
                  <span className="badge">allowed {String(Boolean(event.allowed_user))}</span>
                  <span className="badge">inbox {String(Boolean(event.processed_to_inbox))}</span>
                  <span className="badge">reply {String(Boolean(event.reply_sent))}</span>
                  <span className="badge">{event.reply_status ?? "not_enabled"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsData({ uid }: { uid: string }) {
  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Firebase 專案、資料集合與安全限制。</p>
        </div>
      </header>

      <section className="panel">
        <h2>Firebase</h2>
        <div className="list">
          <div className="item">
            <h3>Project ID</h3>
            <p>mark-ai-center</p>
          </div>
          <div className="item">
            <h3>Project Number</h3>
            <p>514309671076</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Firestore Collections</h2>
        <div className="badge-row">
          {collectionNames.map((name) => (
            <span className="badge" key={name}>
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Audit Logs</h2>
        <p className="muted">查看最近後台操作紀錄，before / after 會遮蔽敏感欄位。</p>
        <div className="action-row">
          <Link className="button secondary compact" href="/audit-logs">Open Audit Logs</Link>
        </div>
      </section>

      <LineStatusSection uid={uid} />

      <section className="panel">
        <h2>Safety Rules</h2>
        <ul className="settings-list">
          {safetyRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SettingsClient() {
  return <ProtectedPage>{(uid) => <SettingsData uid={uid} />}</ProtectedPage>;
}
