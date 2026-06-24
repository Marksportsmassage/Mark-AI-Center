"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useOwnerAuth, type OwnerAuthDebugInfo } from "@/hooks/useOwnerAuth";

const showDevelopmentDebug = process.env.NODE_ENV !== "production";

function BootstrapCommand({ debugInfo }: { debugInfo: OwnerAuthDebugInfo }) {
  const command =
    debugInfo.uid && debugInfo.email
      ? `MARK_OWNER_UID="${debugInfo.uid}" MARK_OWNER_EMAIL="${debugInfo.email}" npm run bootstrap-owner`
      : "";

  if (!command || !showDevelopmentDebug) {
    return null;
  }

  return (
    <div className="item">
      <h3>Bootstrap command</h3>
      <pre className="json-block">{command}</pre>
      <button className="button secondary compact" type="button" onClick={() => navigator.clipboard?.writeText(command)}>
        複製 bootstrap 指令
      </button>
    </div>
  );
}

function DebugPanel({ debugInfo }: { debugInfo: OwnerAuthDebugInfo }) {
  if (!showDevelopmentDebug) {
    return null;
  }

  return (
    <div className="item" style={{ marginTop: 16 }}>
      <h2>Development auth debug</h2>
      <div className="detail-grid">
        <div>
          <strong>auth status</strong>
          <p>{debugInfo.auth_status}</p>
        </div>
        <div>
          <strong>currentUser.uid</strong>
          <p className="mono">{debugInfo.uid ?? "null"}</p>
        </div>
        <div>
          <strong>currentUser.email</strong>
          <p className="mono">{debugInfo.email ?? "null"}</p>
        </div>
        <div>
          <strong>auth loaded</strong>
          <p>{String(debugInfo.auth_loaded)}</p>
        </div>
        <div>
          <strong>auth timeout</strong>
          <p>{String(debugInfo.auth_timeout)}</p>
        </div>
        <div>
          <strong>owner doc path</strong>
          <p className="mono">{debugInfo.owner_doc_path ?? "null"}</p>
        </div>
        <div>
          <strong>owner doc read success</strong>
          <p>{String(debugInfo.owner_doc_read_success)}</p>
        </div>
        <div>
          <strong>owner doc exists</strong>
          <p>{String(debugInfo.owner_doc_exists)}</p>
        </div>
        <div>
          <strong>owner role</strong>
          <p>{String(debugInfo.owner_role ?? "null")}</p>
        </div>
        <div>
          <strong>owner status</strong>
          <p>{String(debugInfo.owner_status ?? "null")}</p>
        </div>
        <div>
          <strong>Firebase config</strong>
          <pre className="json-block">{JSON.stringify(debugInfo.firebase_config_status, null, 2)}</pre>
        </div>
        <div>
          <strong>current hostname / port</strong>
          <p className="mono">
            {debugInfo.hostname ?? "unknown"}:{debugInfo.port ?? ""}
          </p>
        </div>
        {debugInfo.firestore_read_error_redacted ? (
          <div>
            <strong>Firestore read error redacted</strong>
            <p>{debugInfo.firestore_read_error_redacted}</p>
          </div>
        ) : null}
      </div>
      <BootstrapCommand debugInfo={debugInfo} />
    </div>
  );
}

export function ProtectedPage({ children }: { children: (uid: string) => ReactNode }) {
  const authState = useOwnerAuth();

  if (authState.status === "allowed" && authState.user) {
    return <>{children(authState.user.uid)}</>;
  }

  if (authState.status === "loading" || authState.status === "checkingOwner") {
    return (
      <section className="panel">
        <h1>Checking access</h1>
        <p className="muted">{authState.message}</p>
        <DebugPanel debugInfo={authState.debugInfo} />
      </section>
    );
  }

  if (authState.status === "unauthenticated") {
    return (
      <section className="panel">
        <h1>未登入</h1>
        <p className="muted">請先登入 Google 帳號。</p>
        <div className="action-row">
          <Link className="button" href="/login">
            回 /login
          </Link>
          <button className="button secondary compact" type="button" onClick={authState.refreshOwnerCheck}>
            Refresh owner check
          </button>
        </div>
        <DebugPanel debugInfo={authState.debugInfo} />
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>{authState.status === "restricted" ? "Access restricted" : "Owner check error"}</h1>
      <p className="muted">{authState.message}</p>
      <div className="action-row">
        <button className="button" type="button" onClick={authState.refreshOwnerCheck}>
          Refresh owner check
        </button>
        <button className="button secondary compact" type="button" onClick={authState.signOutUser}>
          登出
        </button>
        <Link className="button secondary compact" href="/login">
          回 /login
        </Link>
      </div>
      <DebugPanel debugInfo={authState.debugInfo} />
    </section>
  );
}
