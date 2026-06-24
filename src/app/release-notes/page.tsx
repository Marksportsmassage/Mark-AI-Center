import Link from "next/link";
import { PRODUCTION_URL, RELEASE_NOTES, SAFETY_NOTES } from "@/lib/governance";

export default function Page() {
  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>版本紀錄</h1>
          <p>Phase 8-12 production notes. 主入口使用 hosted.app，不使用 mark-ai-center.web.app。</p>
        </div>
        <Link className="button secondary compact" href="/today">Today</Link>
      </header>
      <section className="panel">
        <h2>目前版本</h2>
        <div className="detail-grid">
          <div><strong>app version</strong><p>Phase 12 Production Governance</p></div>
          <div><strong>latest commit</strong><p>由 App Hosting 部署 main 最新 commit；實際 SHA 以 git log / deployment 回報為準。</p></div>
          <div><strong>production URL</strong><p>{PRODUCTION_URL}</p></div>
          <div><strong>deployment notes</strong><p>Firestore rules 依 collection 變更部署；前端只部署 App Hosting。</p></div>
        </div>
      </section>
      <section className="panel">
        <h2>Phase 8-12</h2>
        <ul>{RELEASE_NOTES.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="panel">
        <h2>安全注意事項</h2>
        <ul>{SAFETY_NOTES.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </div>
  );
}
