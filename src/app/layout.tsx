import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mark AI Center",
  description: "Personal AI Command Center for Mark"
};

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/advisor-chat", label: "Advisor Chat" },
  { href: "/command-brain", label: "Command Brain" },
  { href: "/command-center", label: "Command Center" },
  { href: "/client-ops", label: "Client Ops" },
  { href: "/content-studio", label: "Content Studio" },
  { href: "/business-lab", label: "Business Lab" },
  { href: "/product-roadmap", label: "Product Roadmap" },
  { href: "/intake", label: "Intake" },
  { href: "/review-queue", label: "Review Queue" },
  { href: "/finance-decisions", label: "Finance Decisions" },
  { href: "/finance-baseline", label: "Baseline" },
  { href: "/decision-lab", label: "Decision Lab" },
  { href: "/weekly-review", label: "Weekly" },
  { href: "/data-quality", label: "Data Quality" },
  { href: "/system-status", label: "System Status" },
  { href: "/investment-decisions", label: "Investments" },
  { href: "/projects", label: "Projects" },
  { href: "/agents", label: "Agents" },
  { href: "/audit-logs", label: "Audit Logs" },
  { href: "/release-notes", label: "Release Notes" },
  { href: "/settings", label: "Settings" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/command-center">
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
          </aside>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
