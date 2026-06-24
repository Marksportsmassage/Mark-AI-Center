import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mark AI Center",
  description: "Personal AI Command Center for Mark"
};

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/command-center", label: "Command Center" },
  { href: "/intake", label: "Intake" },
  { href: "/review-queue", label: "Review Queue" },
  { href: "/finance-decisions", label: "Finance Decisions" },
  { href: "/finance-baseline", label: "Baseline" },
  { href: "/investment-decisions", label: "Investments" },
  { href: "/projects", label: "Projects" },
  { href: "/agents", label: "Agents" },
  { href: "/audit-logs", label: "Audit Logs" },
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
