import Image from "next/image";
import styles from "@/app/page.module.css";

export function FitnessSpaces() {
  return (
    <section
      className={styles.fitnessSpaces}
      id="fitness-spaces"
      aria-labelledby="fitness-spaces-title"
    >
      <div className={styles.fitnessCopy}>
        <p className={styles.sectionLabel}>For fitness spaces</p>
        <h2 id="fitness-spaces-title">
          Built for
          <br />
          fitness spaces.
        </h2>
        <p>
          A simple NFC touchpoint that turns showing up
          <br />
          into a shared habit.
        </p>
      </div>

      <div className={styles.facilityWall}>
        <span className={styles.facilitySeam} aria-hidden="true" />
        <span className={styles.facilitySignalOne} aria-hidden="true" />
        <span className={styles.facilitySignalTwo} aria-hidden="true" />
        <span className={styles.facilitySignalThree} aria-hidden="true" />
        <Image
          className={styles.facilityPlaque}
          src="/marketing/nfc-plaque.png"
          alt="TapIt NFC plaque mounted on a fitness-space wall"
          width={1240}
          height={1240}
        />
      </div>
    </section>
  );
}
