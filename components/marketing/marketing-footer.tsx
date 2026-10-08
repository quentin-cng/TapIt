import Link from "next/link";
import styles from "@/app/page.module.css";

export function MarketingFooter() {
  return (
    <footer className={styles.marketingFooter}>
      <Link className={styles.footerWordmark} href="/" aria-label="TapIt home">
        Tap<span>It</span>
      </Link>
      <nav aria-label="Footer navigation">
        <Link href="/login">Sign in</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
