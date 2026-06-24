"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { createContentDraft, createContentIdeaDraft, createStudyNoteDraft } from "@/lib/nonFinanceOps";
import { safeJoin } from "@/lib/ui/safe";
import type { ContentDraft, ContentIdea, StudyNote } from "@/types/firestore";

function ContentStudioData({ uid }: { uid: string }) {
  const ideas = useFirestoreCollection<ContentIdea>("content_ideas", recent20, true);
  const drafts = useFirestoreCollection<ContentDraft>("content_drafts", recent20, true);
  const notes = useFirestoreCollection<StudyNote>("study_notes", recent20, true);
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("create");
    try {
      const form = new FormData(event.currentTarget);
      const kind = String(form.get("kind") ?? "draft");
      const title = String(form.get("title") ?? "");
      const topic = String(form.get("topic") ?? "other");
      const material = String(form.get("material") ?? "");
      const result = kind === "idea" ? await createContentIdeaDraft(getClientDb(), uid, { title, topic: topic as never, summary: material }) : kind === "study" ? await createStudyNoteDraft(getClientDb(), uid, { title, topic, source: material, points: material }) : await createContentDraft(getClientDb(), uid, { title, topic, material, channel: "ig" });
      setCreated(`${result.collection}/${result.id}`); event.currentTarget.reset();
    } finally { setBusy(null); }
  }
  return <div className="grid"><header className="page-header"><div><h1>內容與國考資料中心</h1><p>IG 內容、國考筆記、PDF 商品、學習文章。只建立草稿，不自動發布。</p></div><div className="action-row"><Link className="button secondary compact" href="/advisor-chat">Advisor</Link><Link className="button secondary compact" href="/review-queue">Review Queue</Link></div></header>{created ? <section className="panel"><p>Created draft: <span className="mono">{created}</span></p></section> : null}<section className="panel"><h2>Create Content / Study Draft</h2><form className="grid" onSubmit={create}><div className="detail-grid"><label>kind<select name="kind" defaultValue="draft"><option value="draft">IG post draft</option><option value="idea">content idea</option><option value="study">national exam note</option></select></label><label>title<input name="title" required /></label><label>topic<input name="topic" placeholder="musculoskeletal / physical modality / surgery / ROM / MMT / marketing / business" /></label></div><label>material<textarea name="material" rows={5} /></label><button className="button compact" disabled={Boolean(busy)}>建立內容草稿</button></form></section><section className="panel"><h2>Content Drafts</h2><div className="list">{drafts.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{safeJoin(item.outline)}</p><p className="muted">no_auto_post={String(item.no_auto_post)}</p></article>)}{!drafts.items.length ? <p className="muted">No content drafts.</p> : null}</div></section><section className="panel"><h2>Ideas / Study Notes</h2><div className="list">{[...ideas.items.map((item) => ({ id: item.id, title: item.title, body: item.summary })), ...notes.items.map((item) => ({ id: item.id, title: item.title, body: safeJoin(item.key_points) }))].map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section></div>;
}

export default function Page() { return <ProtectedPage>{(uid) => <ContentStudioData uid={uid} />}</ProtectedPage>; }
