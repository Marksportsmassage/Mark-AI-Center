"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { limit, orderBy } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import type { AuditLog } from "@/types/firestore";

function AuditLogsData() {
  const logs = useFirestoreCollection<AuditLog>("audit_logs", [orderBy("created_at", "desc"), limit(100)], true);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const filteredLogs = useMemo(() => logs.items.filter((log) =>
    (!actionFilter || log.action.includes(actionFilter)) &&
    (!collectionFilter || log.target_collection === collectionFilter)
  ), [logs.items, actionFilter, collectionFilter]);

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>最近 100 筆後台操作紀錄，敏感欄位已遮蔽。</p>
        </div>
        <Link className="button secondary compact" href="/command-center">Back to Command Center</Link>
      </header>

      {logs.error ? (
        <section className="panel">
          <h2>Audit log error</h2>
          <p className="muted">{logs.error}</p>
        </section>
      ) : null}

      <section className="panel">
        <h2>Filters</h2>
        <div className="detail-grid">
          <label>action<input value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} placeholder="finance_review" /></label>
          <label>target_collection<input value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)} placeholder="audit_logs" /></label>
        </div>
      </section>

      <section className="panel">
        <h2>Recent Audit Logs</h2>
        <div className="list">
          {filteredLogs.length === 0 ? <p className="muted">目前沒有符合條件的 audit logs。</p> : null}
          {filteredLogs.map((log) => (
            <article className="item" key={log.id}>
              <div className="item-header">
                <h3>{log.action}</h3>
                <span className="badge">{formatDateTime(log.created_at)}</span>
              </div>
              <p>{log.reason}</p>
              <div className="badge-row">
                <span className="badge">{log.user_id}</span>
                <span className="badge">{log.target_collection}</span>
                <span className="badge">{log.target_id}</span>
              </div>
              <button className="button secondary compact" type="button" onClick={() => setSelected(log)}>View JSON</button>
            </article>
          ))}
        </div>
      </section>

      {selected ? (
        <div className="drawer-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Audit log detail" onClick={(event) => event.stopPropagation()}>
            <div className="item-header">
              <h2>{selected.action}</h2>
              <button className="button secondary compact" onClick={() => setSelected(null)}>Close</button>
            </div>
            <pre className="json-block">{safeJson(selected)}</pre>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export function AuditLogsClient() {
  return <ProtectedPage>{() => <AuditLogsData />}</ProtectedPage>;
}
