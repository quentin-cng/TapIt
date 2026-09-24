"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TapItWordmark } from "./tapit-wordmark";

type IconName = "home" | "friends" | "leaderboard" | "recap" | "profile";

const navigationItems: Array<{
  href: string;
  label: string;
  icon: IconName;
}> = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/friends", label: "Friends", icon: "friends" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { href: "/recap", label: "Recap", icon: "recap" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

function NavigationIcon({ name }: { name: IconName }) {
  if (name === "home") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.8v-6.5H9.3V21H3.5a.5.5 0 0 1-.5-.5v-9.7Z" />
      </svg>
    );
  }

  if (name === "friends") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8.4 11.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM15.9 10.3a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20c.3-4.1 2.2-6.2 5.9-6.2s5.7 2.1 5.9 6.2H2.5Zm11.7-6.1c.6-.4 1.4-.6 2.4-.6 3.1 0 4.7 2.2 4.9 5.7h-5.4c-.2-2.1-.8-3.8-1.9-5.1Z" />
      </svg>
    );
  }

  if (name === "leaderboard") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 13h4v8H4v-8Zm6-10h4v18h-4V3Zm6 6h4v12h-4V9Z" />
      </svg>
    );
  }

  if (name === "recap") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 2h2v2h8V2h2v2h2.5a.5.5 0 0 1 .5.5v16a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-16a.5.5 0 0 1 .5-.5H6V2Zm13 8H5v9h14v-9ZM5 6v2h14V6H5Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-7.5 9c.3-4.6 2.8-7 7.5-7s7.2 2.4 7.5 7h-15Z" />
    </svg>
  );
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return navigationItems.map((item) => {
    const active = pathname === item.href;

    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={active ? "active" : undefined}
        href={item.href}
        key={item.href}
      >
        <NavigationIcon name={item.icon} />
        <span>{item.label}</span>
        {!mobile ? <b aria-hidden="true">›</b> : null}
      </Link>
    );
  });
}

export function AppShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <TapItWordmark />
        <nav aria-label="Primary navigation">
          <NavigationLinks />
        </nav>
        <div className="sidebar-manifesto" aria-hidden="true">
          <strong>Show up together.</strong>
          <span>Commit. Tap. Earn. Repeat.</span>
        </div>
      </aside>

      <main className={`app-main ${className}`.trim()}>
        <div className="mobile-topbar">
          <TapItWordmark />
        </div>
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        <NavigationLinks mobile />
      </nav>
    </div>
  );
}
