"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { createProductFeatureDraft, createRoadmapItemDraft } from "@/lib/nonFinanceOps";
import type { ProductFeature, RoadmapItem } from "@/types/firestore";

function ProductRoadmapData({ uid }: { uid: string }) {
  const features = useFirestoreCollection<ProductFeature>("product_features", recent20, true);
  const roadmap = useFirestoreCollection<RoadmapItem>("roadmap_items", recent20, true);
  const [created, setCreated] = useState<string | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = String(form.get("kind") ?? "feature");
    const input = { title: String(form.get("title") ?? ""), value: String(form.get("expected_value") ?? ""), priority: (String(form.get("priority") ?? "medium") as ProductFeature["priority"]), risk: String(form.get("risk") ?? ""), codexJobId: String(form.get("linked_codex_job_id") ?? "") || null, area: String(form.get("area") ?? "") };
    const result = kind === "roadmap" ? await createRoadmapItemDraft(getClientDb(), uid, input) : await createProductFeatureDraft(getClientDb(), uid, input);
    setCreated(`${result.collection}/${result.id}`); event.currentTarget.reset();
  }
  return <div className="grid"><header className="page-header"><div><h1>產品與 App Roadmap</h1><p>管理 Mark AI Center、身境 App、功能開發與 Codex jobs。只建立草稿，不自動 PR/deploy。</p></div><div className="action-row"><Link className="button secondary compact" href="/codex-jobs">Codex Jobs</Link><Link className="button secondary compact" href="/review-queue">Review Queue</Link></div></header>{created ? <section className="panel"><p>Created draft: <span className="mono">{created}</span></p></section> : null}<section className="panel"><h2>Create Feature / Roadmap Draft</h2><form className="grid" onSubmit={create}><div className="detail-grid"><label>kind<select name="kind"><option value="feature">feature draft</option><option value="roadmap">roadmap item</option></select></label><label>title<input name="title" required /></label><label>priority<input name="priority" placeholder="low / medium / high / urgent" /></label><label>expected_value<input name="expected_value" /></label><label>area<input name="area" /></label><label>linked_codex_job_id<input name="linked_codex_job_id" /></label><label>risk<input name="risk" /></label></div><button className="button compact">建立產品草稿</button></form></section><section className="panel"><h2>Features / Roadmap</h2><div className="list">{features.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{item.expected_value}</p><p className="muted">{item.priority} / {item.risk}</p></article>)}{roadmap.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{item.expected_value}</p><p className="muted">{item.area} / {item.priority}</p></article>)}</div></section></div>;
}

export default function Page() { return <ProtectedPage>{(uid) => <ProductRoadmapData uid={uid} />}</ProtectedPage>; }
