import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { examSubjects, excerptMarkdown, readExamDoc } from "@/lib/examReview";

const titles: Record<string, string> = {
  surgery: "外科學",
  "physical-modality": "物理因子治療學",
  "operation-therapy": "操作治療學",
  "rom-mmt": "ROM / MMT"
};

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: subjectId } = await params;
  const subject = examSubjects.find((item) => item.id === subjectId);
  if (!subject) notFound();
  return (
    <div className="grid exam-page">
      <header className="page-header">
        <div>
          <h1>{titles[subject.id]}</h1>
          <p>{subject.status}</p>
        </div>
        <div className="action-row">
          <Link className="button secondary compact" href="/exam-review">回期末考中心</Link>
          <Link className="button secondary compact" href="/assistant">問助理</Link>
        </div>
      </header>

      <section className="panel">
        <h2>完成度與資料狀態</h2>
        <div className="detail-grid">
          <div><strong>完成度</strong><p>{subject.completion}</p></div>
          <div><strong>已有檔案</strong><p>{subject.files.join("、") || "尚未找到"}</p></div>
          <div><strong>待補資料</strong><p>{subject.missing.join("、") || "目前無"}</p></div>
          <div><strong>安全規則</strong><p>原題需有來源頁碼；講義重點不可標成原題。</p></div>
        </div>
      </section>

      <section id="visual-summary" className="panel">
        <div className="item-header">
          <div>
            <h2>圖片式總整理</h2>
            <p>這張圖只根據已抽出的講義或題庫狀態整理，用來先看方向。</p>
          </div>
          <span className="badge review">visual</span>
        </div>
        <Image className="exam-visual-summary" src={subject.visual_href} alt={`${subject.title} 圖片式總整理`} width={1200} height={760} />
      </section>

      <section id="slide-summary" className="panel">
        <div className="item-header">
          <div>
            <h2>簡報式總整理</h2>
            <p>用投影片順序整理：先看可讀內容，再看考前要背與待確認。</p>
          </div>
          <span className="badge">slides</span>
        </div>
        <pre className="json-block markdown-preview slide-preview">{excerptMarkdown(readExamDoc(subject.slide_doc), 2600)}</pre>
      </section>

      <section className="panel">
        <h2>Mark 需要看或確認</h2>
        <div className="stack-list warning-list">
          {subject.needs_review.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="grid">
        {subject.docs.map((doc) => (
          <details className="panel exam-accordion" key={doc.path} open={doc.kind !== "待補"}>
            <summary>
              <strong>{doc.label}</strong>
              <span className="badge review">{doc.kind}</span>
            </summary>
            <pre className="json-block markdown-preview">{excerptMarkdown(readExamDoc(doc.path))}</pre>
          </details>
        ))}
      </section>

      <MobileBottomNav />
    </div>
  );
}
