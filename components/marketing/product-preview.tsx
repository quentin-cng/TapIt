import Image from "next/image";
import styles from "@/app/page.module.css";

const screens = [
  {
    key: "friends",
    label: "TapIt Friends screen",
    position: "secondaryLeft",
    src: "/marketing/app-friends.jpg",
    width: 1080,
    height: 2242,
  },
  {
    key: "home",
    label: "TapIt Home screen",
    position: "primary",
    src: "/marketing/app-home.jpg",
    width: 1079,
    height: 2404,
  },
  {
    key: "leaderboard",
    label: "TapIt Leaderboard screen",
    position: "secondaryRight",
    src: "/marketing/app-leaderboard.jpg",
    width: 1080,
    height: 2556,
  },
] as const;

export function ProductPreview() {
  return (
    <section className={styles.productPreview} aria-labelledby="product-title">
      <span className={styles.productRingOne} aria-hidden="true" />
      <span className={styles.productRingTwo} aria-hidden="true" />

      <div className={styles.productHeading}>
        <h2 id="product-title">
          Consistency,
          <br />
          made social.
        </h2>
      </div>

      <div className={styles.screenComposition}>
        {screens.map((screen) => (
          <figure
            className={`${styles.screenFigure} ${styles[screen.position]}`}
            key={screen.key}
          >
            <div className={styles.screenSlot}>
              <Image
                className={styles.screenImage}
                src={screen.src}
                alt={screen.label}
                width={screen.width}
                height={screen.height}
                sizes="(max-width: 760px) 44vw, 280px"
              />
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
