"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

type DashboardNavProps = {
  title: string;
  subtitle: string;
  items: NavItem[];
};

export function DashboardNav({ title, subtitle, items }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar__brand">
        <span className="panel-kicker">SurVial Academia</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <nav className="dashboard-sidebar__nav">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              className={cn("dashboard-sidebar__link", isActive && "dashboard-sidebar__link--active")}
              href={item.href}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
