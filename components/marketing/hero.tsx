import Image from "next/image";
import Link from "next/link";
import styles from "@/app/page.module.css";

function Checkmark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path d="m13 24 7.2 7.2L35.5 16" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>
          Social fitness <span aria-hidden="true">•</span> Built around
          consistency
        </p>

        <h1 id="hero-title" className={styles.heroTitle}>
          Showing up
          <br />
          is the hardest part.
          <br />
          <span>TapIt makes it worth it.</span>
        </h1>

        <p className={styles.heroDescription}>
          Set a weekly goal. Tap in when you train.
          <br />
          Earn points, build your streak, and stay consistent
          <br />
          with your friends.
        </p>

        <div className={styles.heroActions}>
          <Link className={styles.primaryCta} href="#beta">
            Join the beta <span aria-hidden="true">→</span>
          </Link>
          <Link className={styles.secondaryCta} href="#how-it-works">
            See how it works
          </Link>
        </div>
      </div>

      <div className={styles.heroVisual} aria-label="TapIt NFC check-in">
        <div className={styles.wallTexture} aria-hidden="true" />
        <div className={styles.plaqueWrap}>
          <span className={styles.plaqueAccentOne} aria-hidden="true" />
          <span className={styles.plaqueAccentTwo} aria-hidden="true" />
          <span className={styles.plaqueAccentThree} aria-hidden="true" />
          <Image
            className={styles.plaque}
            src="/marketing/nfc-plaque.png"
            alt="TapIt NFC plaque with the TapIt penguin"
            width={1240}
            height={1240}
            priority
          />
        </div>

        <div className={styles.phone} aria-hidden="true">
          <div className={styles.phoneSpeaker} />
          <div className={styles.phoneScreen}>
            <span className={styles.phoneTime}>9:41</span>
            <span className={styles.phoneBrand}>
              Tap<b>It</b>
            </span>
            <span className={styles.successIcon}>
              <Checkmark />
            </span>
            <p className={styles.successTitle}>Check-in successful!</p>
            <p className={styles.successPoints}>+10 points</p>
            <span className={styles.phoneRings}>
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
