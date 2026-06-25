import Link from "next/link";
import Image from "next/image";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { examSubjects, readExamDoc } from "@/lib/examReview";
import { getExamProductionSummary } from "@/lib/examSummary";

export default function Page() {
  const inventory = readExamDoc("docs/exam-review/materials-inventory.md");
  const summary = getExamProductionSummary();
  return (
    <div className="grid exam-page">
      <header className="page-header">
        <div>
          <h1>期末考整理中心</h1>
          <p>只顯示已找到或明確待補的教材；沒有來源就不編題、不補答案。</p>
        </div>
        <Link className="button secondary compact" href="/assistant">回助理</Link>
      </header>

      <section className="panel">
        <h2>快速前往科目</h2>
        <div className="action-row">
          {examSubjects.map((subject) => <Link className="button secondary compact" key={subject.href} href={subject.href}>{subject.title}</Link>)}
        </div>
      </section>

      <section className="panel exam-production-summary">
        <div className="item-header">
          <div>
            <h2>系統已製作與待確認</h2>
            <p>這裡只列來源檔案已支持的內容；掃描或缺檔不補答案。</p>
          </div>
          <span className="badge review">{summary.readyCount} 科可讀</span>
        </div>
        <div className="assistant-summary-columns">
          <div>
            <h3>已製作完成</h3>
            <div className="stack-list">{summary.readyItems.slice(0, 12).map((item) => <span key={item}>{item}</span>)}</div>
          </div>
          <div>
            <h3>需要 Mark 確認</h3>
            <div className="stack-list warning-list">{summary.reviewItems.slice(0, 12).map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="cards-grid">
        {examSubjects.map((subject) => (
          <article className="card exam-subject-card" key={subject.id}>
            <div className="item-header">
              <h2>{subject.title}</h2>
              <span className="badge review">{subject.completion}</span>
            </div>
            <p>{subject.status}</p>
            <div className="badge-row">
              <span className="badge">已找到 {subject.files.length}</span>
              <span className="badge">待補 {subject.missing.length}</span>
            </div>
            <Image className="exam-card-visual" src={subject.visual_href} alt={`${subject.title} 圖像總整理`} width={520} height={320} />
            <div className="action-row exam-card-actions">
              <Link className="button compact" href={subject.href}>進入科目</Link>
              <Link className="button secondary compact" href={`/assistant?prompt=${encodeURIComponent(subject.ask_prompt)}`}>問助理讀這科</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>目前材料狀態</h2>
        <pre className="json-block markdown-preview">{inventory}</pre>
      </section>
      <MobileBottomNav />
    </div>
  );
}
