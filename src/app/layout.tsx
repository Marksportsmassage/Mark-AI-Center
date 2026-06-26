import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "@/styles/assistant-theme.css";

export const metadata: Metadata = {
  title: "Mark AI 公司助理",
  description: "Mark 的公司型 AI 助理系統"
};

const navItems = [
  { href: "/assistant", label: "助理" },
  { href: "/today", label: "今天" },
  { href: "/intake", label: "輸入" },
  { href: "/review-queue", label: "審核" },
  { href: "/assistant-universe", label: "宇宙" }
];

const secondaryItems = [
  { href: "/finance-baseline", label: "財務長助理" },
  { href: "/investment-decisions", label: "投資風控" },
  { href: "/client-ops", label: "客戶課表" },
  { href: "/exam-review", label: "學習內容" },
  { href: "/income-lab", label: "收入成長" },
  { href: "/agent-lab", label: "Agent Lab" },
  { href: "/business-lab", label: "商業實驗" },
  { href: "/product-roadmap", label: "產品開發" },
  { href: "/safety-center", label: "安全稽核" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/assistant">
              <span className="brand-mark">M</span>
              <span>
                <strong>Mark AI Center</strong>
                <small>公司助理系統</small>
              </span>
            </Link>
            <nav className="nav-list">
              {navItems.map((item) => (
                <Link className="nav-link" key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <details className="secondary-nav">
              <summary>公司員工</summary>
              <nav className="nav-list secondary">
                {secondaryItems.map((item) => (
                  <Link className="nav-link" key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>
          </aside>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
