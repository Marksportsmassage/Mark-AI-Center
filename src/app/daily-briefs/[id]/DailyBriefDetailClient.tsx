"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/ui/format";
import { asArray, displayText } from "@/lib/ui/safe";
import type { DailyBrief } from "@/types/firestore";

function ListSection({ title, items }: { title: string; items?: string[] }) {
  const safeItems = asArray<string>(items);
  return <section className="panel"><h2>{title}</h2>{safeItems.length ? <ul>{safeItems.map((item, index) => <li key={`${title}-${index}`}>{displayText(item, "None")}</li>)}</ul> : <p className="muted">No items.</p>}</section>;
}

function DailyBriefData({ briefId }: { briefId: string }) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const snap = await getDoc(doc(getClientDb(), "daily_briefs", briefId));
      if (!snap.exists()) {
        setError("Daily brief not found.");
        setBrief(null);
        return;
      }
      setBrief({ id: snap.id, ...snap.data() } as DailyBrief);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load daily brief.");
    }
  }

  useEffect(() => {
    void load();
  }, [briefId]);

  if (error) {
    return (
      <section className="panel">
        <h2>Daily brief error</h2>
        <p className="muted">{error}</p>
        <button className="button compact" onClick={load}>Retry</button>
      </section>
    );
  }

  if (!brief) {
    return <p className="muted">Loading daily brief...</p>;
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>{displayText(brief.title, "Daily Brief")}</h1>
          <p>{displayText(brief.date_key)} · {displayText(brief.status)} · {formatDateTime(brief.created_at)}</p>
        </div>
        <Link className="button secondary compact" href="/command-center">Back to Command Center</Link>
      </header>

      <section className="panel">
        <h2>Summary</h2>
        <p className="muted">{displayText(brief.summary, "尚無摘要")}</p>
      </section>

      <ListSection title="Top priorities" items={brief.top_priorities} />
      <ListSection title="Waiting review tasks" items={brief.waiting_review_tasks} />
      <ListSection title="Needs more info tasks" items={brief.needs_more_info_tasks} />
      <ListSection title="Recent LINE inputs" items={brief.recent_line_inputs} />
      <ListSection title="Business decision tasks" items={brief.business_decision_tasks} />
      <ListSection title="Finance reminders" items={brief.finance_reminders} />
      <ListSection title="Suggested focus" items={brief.suggested_focus} />
      <ListSection title="Do not focus" items={brief.do_not_focus} />
      <ListSection title="Recommended SOP updates" items={brief.recommended_sop_updates} />
    </div>
  );
}

export function DailyBriefDetailClient({ briefId }: { briefId: string }) {
  return <ProtectedPage>{() => <DailyBriefData briefId={briefId} />}</ProtectedPage>;
}
