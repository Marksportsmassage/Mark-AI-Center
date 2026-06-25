import Link from "next/link";
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

