"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { reviewDecisionReport, type DecisionReportAction } from "@/lib/review/reviewDecisionReport";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import type { DecisionReport } from "@/types/firestore";

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <strong>{label}</strong>
      <p>{value ? String(value) : "None"}</p>
    </div>
  );
}

function ReportData({ reportId, uid }: { reportId: string; uid: string }) {
  const [report, setReport] = useState<DecisionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const snap = await getDoc(doc(getClientDb(), "decision_reports", reportId));
      if (!snap.exists()) {
        setError("Decision report not found.");
        setReport(null);
        return;
      }
      setReport({ id: snap.id, ...snap.data() } as DecisionReport);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load decision report.");
    }
  }

  useEffect(() => {
    void load();
  }, [reportId]);

  async function runAction(action: DecisionReportAction) {
    setBusy(action);
    try {
      await reviewDecisionReport(getClientDb(), reportId, action, uid);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <section className="panel">
        <h2>Decision report error</h2>
        <p className="muted">{error}</p>
        <button className="button compact" onClick={load}>Retry</button>
      </section>
    );
  }

  if (!report) {
    return <p className="muted">Loading decision report...</p>;
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>{report.title}</h1>
          <p>Business Decision Report</p>
        </div>
        <div className="action-row">
          <Link className="button secondary compact" href="/command-center">Back to Command Center</Link>
          {report.source_task_dispatch_id ? (
            <Link className="button secondary compact" href={`/task-dispatches/${report.source_task_dispatch_id}`}>Back to Task</Link>
          ) : null}
        </div>
      </header>

      <section className="panel">
        <h2>Report Summary</h2>
        <div className="detail-grid">
          <Field label="project_id" value={report.project_id} />
          <Field label="decision_type" value={report.decision_type} />
          <Field label="status" value={report.status} />
          <Field label="recommendation" value={report.recommendation} />
          <Field label="need_mark_review" value={report.need_mark_review} />
          <Field label="created_at" value={formatDateTime(report.created_at)} />
          <Field label="updated_at" value={formatDateTime(report.updated_at)} />
          <Field label="summary" value={report.summary} />
        </div>
      </section>

      <section className="panel">
        <h2>Capital / Cashflow</h2>
        <div className="detail-grid">
          <Field label="capital_required_min" value={report.capital_required_min} />
          <Field label="capital_required_max" value={report.capital_required_max} />
          <Field label="expected_roi_summary" value={report.expected_roi_summary} />
          <Field label="payback_period_summary" value={report.payback_period_summary} />
          <Field label="risk_level" value={report.risk_level} />
          <Field label="cashflow_impact" value={report.cashflow_impact} />
          <Field label="stage" value={report.stage} />
        </div>
      </section>

      <section className="panel">
        <h2>Cost / Allocation Items</h2>
        <pre className="json-block">{safeJson(report.allocation_items?.length ? report.allocation_items : report.cost_items)}</pre>
      </section>

      <section className="panel">
        <h2>Risk Items</h2>
        <pre className="json-block">{safeJson(report.risk_items)}</pre>
      </section>

      <section className="panel">
        <h2>Next Steps</h2>
        <pre className="json-block">{safeJson({ assumptions: report.assumptions, next_steps: report.next_steps, stop_loss_conditions: report.stop_loss_conditions })}</pre>
      </section>

      <section className="panel">
        <h2>Review Report</h2>
        <div className="action-row">
          <button className="button compact" disabled={Boolean(busy)} onClick={() => runAction("approve")}>Approve Report</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runAction("archive")}>Archive Report</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runAction("more_info")}>Need More Info</button>
        </div>
      </section>
    </div>
  );
}

export function DecisionReportDetailClient({ reportId }: { reportId: string }) {
  return <ProtectedPage>{(uid) => <ReportData reportId={reportId} uid={uid} />}</ProtectedPage>;
}
