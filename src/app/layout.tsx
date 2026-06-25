import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mark AI Center",
  description: "Personal AI Command Center for Mark"
};

const navItems = [
  { href: "/assistant", label: "Assistant" },
  { href: "/today", label: "Today" },
  { href: "/intake", label: "Intake" },
  { href: "/review-queue", label: "Review" },
  { href: "/assistant-universe", label: "Universe" }
];

const secondaryItems = [
  { href: "/finance-baseline", label: "Finance" },
  { href: "/investment-decisions", label: "Investment" },
  { href: "/client-ops", label: "Client" },
  { href: "/exam-review", label: "Content / Exams" },
  { href: "/business-lab", label: "Business" },
  { href: "/product-roadmap", label: "Product" },
  { href: "/safety-center", label: "System" }
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
                <small>Personal Command</small>
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
              <summary>More branches</summary>
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
