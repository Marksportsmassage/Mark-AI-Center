import Link from "next/link";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { examSubjects, readExamDoc } from "@/lib/examReview";

export default function Page() {
  const inventory = readExamDoc("docs/exam-review/materials-inventory.md");
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

      <section className="cards-grid">
        {examSubjects.map((subject) => (
          <Link className="card exam-subject-card" key={subject.id} href={subject.href}>
            <div className="item-header">
              <h2>{subject.title}</h2>
              <span className="badge review">{subject.completion}</span>
            </div>
            <p>{subject.status}</p>
            <div className="badge-row">
              <span className="badge">已找到 {subject.files.length}</span>
              <span className="badge">待補 {subject.missing.length}</span>
            </div>
          </Link>
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
