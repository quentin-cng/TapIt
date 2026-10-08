import styles from "@/app/page.module.css";

export function Credibility() {
  return (
    <section className={styles.credibility} aria-labelledby="credibility-title">
      <div className={styles.credibilityIntro}>
        <p className={styles.sectionLabel}>Built at McGill</p>
        <h2 id="credibility-title">
          From an idea
          <br />
          to something real.
        </h2>
      </div>

      <div className={styles.recognition} aria-label="Dobson Hacks recognition">
        <div>
          <strong>Best Pitch</strong>
          <span>Dobson Hacks</span>
        </div>
        <div>
          <strong>Top 3 Overall</strong>
          <span>Dobson Hacks</span>
        </div>
      </div>
    </section>
  );
}
