import Link from "next/link";

const items = [
  { href: "/assistant", label: "助理" },
  { href: "/today", label: "今天" },
  { href: "/intake", label: "輸入" },
  { href: "/review-queue", label: "審核" },
  { href: "/assistant-universe", label: "宇宙圖" }
];

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>{item.label}</Link>
      ))}
    </nav>
  );
}

