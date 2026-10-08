import Image from "next/image";
import styles from "@/app/page.module.css";

function TapMotif() {
  return (
    <div className={styles.stepMotif} aria-hidden="true">
      <span className={styles.miniPlaque}>
        <Image src="/marketing/nfc-plaque.png" alt="" width={1240} height={1240} />
      </span>
      <span className={styles.miniPhone}>
        <i />
      </span>
    </div>
  );
}

function ProgressMotif() {
  return (
    <div className={styles.stepMotif} aria-hidden="true">
      <div className={styles.progressCard}>
        <strong>3/4</strong>
        <span>this week</span>
        <div className={styles.progressDots}>
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function SocialMotif() {
  return (
    <div className={styles.stepMotif} aria-hidden="true">
      <span className={`${styles.person} ${styles.personOne}`}><i /></span>
      <span className={`${styles.person} ${styles.personTwo}`}><i /></span>
      <span className={styles.miniLeaderboard}>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Tap in",
    description: <>Tap your NFC plaque<br />at the gym or facility.</>,
    motif: <TapMotif />,
  },
  {
    number: "02",
    title: "Build consistency",
    description: <>Set a weekly goal,<br />earn points, and<br />build your streak.</>,
    motif: <ProgressMotif />,
  },
  {
    number: "03",
    title: "Better together",
    description: <>Stay motivated with<br />friends through<br />leaderboards and recaps.</>,
    motif: <SocialMotif />,
  },
];

export function HowItWorks() {
  return (
    <section className={styles.howItWorks} id="how-it-works" aria-labelledby="how-it-works-title">
      <h2 className="sr-only" id="how-it-works-title">How TapIt works</h2>
      <div className={styles.steps}>
        {steps.map((step) => (
          <article className={styles.step} key={step.number}>
            {step.motif}
            <div className={styles.stepCopy}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
