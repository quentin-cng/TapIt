import Link from "next/link";
import styles from "@/app/page.module.css";

export function BetaCta() {
  return (
    <section className={styles.betaCta} id="beta" aria-labelledby="beta-title">
      <span className={styles.ctaRingOne} aria-hidden="true" />
      <span className={styles.ctaRingTwo} aria-hidden="true" />
      <span className={styles.ctaRingThree} aria-hidden="true" />

      <div className={styles.betaCtaInner}>
        <h2 id="beta-title">Ready to show up?</h2>
        <p>Join the TapIt beta.</p>
        <Link href="/signup">Join the beta</Link>
      </div>
    </section>
  );
}
