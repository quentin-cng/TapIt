import Link from "next/link";
import type { ReactNode } from "react";
import { TapItWordmark } from "./tapit-wordmark";

export function LegalPage({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <main className="legal-shell">
      <nav className="legal-nav" aria-label="Legal page navigation">
        <TapItWordmark href="/" />
        <Link href="/">Back to TapIt</Link>
      </nav>
      <article className="legal-document">
        <header>
          <p className="kicker">TapIt legal</p>
          <h1>{title}</h1>
          <p className="legal-effective-date">
            Effective date: September 23, 2026
          </p>
        </header>
        {children}
      </article>
      <footer className="legal-footer">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
      </footer>
    </main>
  );
}
