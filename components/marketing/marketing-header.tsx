import Link from "next/link";
import styles from "@/app/page.module.css";

export function MarketingHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.headerInner} aria-label="Primary navigation">
        <Link className={styles.wordmark} href="/" aria-label="TapIt home">
          Tap<span>It</span>
        </Link>

        <div className={styles.desktopLinks}>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#fitness-spaces">For fitness spaces</Link>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.signInLink} href="/login">
            Sign in
          </Link>
          <Link className={styles.betaLink} href="#beta">
            Join the beta
          </Link>
        </div>
      </nav>
    </header>
  );
}
