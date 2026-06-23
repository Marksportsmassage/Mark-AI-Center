"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import type { DailyBrief } from "@/types/firestore";

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
          <h1>{brief.title}</h1>
          <p>{brief.date_key} · {brief.status} · {formatDateTime(brief.created_at)}</p>
        </div>
        <Link className="button secondary compact" href="/command-center">Back to Command Center</Link>
      </header>

      <section className="panel">
        <h2>Summary</h2>
        <p className="muted">{brief.summary}</p>
      </section>

      <section className="panel">
        <h2>Brief Detail</h2>
        <pre className="json-block">
          {safeJson({
            top_priorities: brief.top_priorities,
            waiting_review_tasks: brief.waiting_review_tasks,
            needs_more_info_tasks: brief.needs_more_info_tasks,
            recent_line_inputs: brief.recent_line_inputs,
            business_decision_tasks: brief.business_decision_tasks,
            suggested_focus: brief.suggested_focus,
            do_not_focus: brief.do_not_focus
          })}
        </pre>
      </section>
    </div>
  );
}

export function DailyBriefDetailClient({ briefId }: { briefId: string }) {
  return <ProtectedPage>{() => <DailyBriefData briefId={briefId} />}</ProtectedPage>;
}
