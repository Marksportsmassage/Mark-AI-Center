import Link from "next/link";

const primary = [
  { href: "/assistant", title: "我要問 AI 助理", body: "從對話、建議卡與分支入口開始。" },
  { href: "/intake", title: "我要貼資料", body: "財務、考試、客戶、產品想法先進 review-gated draft。" },
  { href: "/today", title: "我要看今天要做什麼", body: "看今天最重要三件事、風險與不能做事項。" }
];

const secondary = [
  { href: "/review-queue", title: "我要審核" },
  { href: "/assistant-universe", title: "我要看宇宙圖" },
  { href: "/income-lab", title: "我要提高收入" },
  { href: "/agent-lab", title: "我要建立我的 AI Agent" },
  { href: "/exam-review", title: "我要準備期末考" },
  { href: "/safety-center", title: "我要看系統安全" }
];

export default function Page() {
  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>從這裡開始</h1>
          <p>先選你現在要做的事，不需要理解整個後台架構。</p>
        </div>
      </header>
      <section className="cards-grid">
        {primary.map((item) => (
          <Link className="card start-card" key={item.href} href={item.href}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </Link>
        ))}
      </section>
      <section className="panel">
        <h2>其他入口</h2>
        <div className="action-row">
          {secondary.map((item) => <Link className="button secondary compact" key={item.href} href={item.href}>{item.title}</Link>)}
        </div>
      </section>
    </div>
  );
}
