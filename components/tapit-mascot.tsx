import Image from "next/image";
import classicPenguin from "@/brand/tapit-penguin-clean.png";
import talkingPenguin from "@/brand/tapit-penguin-talking.png";
import styles from "./tapit-mascot.module.css";

type TapItMascotProps = {
  variant?: "classic" | "talking";
  size?: "brand" | "small" | "speech" | "medium" | "large";
  className?: string;
  priority?: boolean;
};

export function TapItMascot({
  variant = "classic",
  size = "small",
  className = "",
  priority = false,
}: TapItMascotProps) {
  const image = variant === "talking" ? talkingPenguin : classicPenguin;
  const responsiveSize = {
    brand: "54px",
    small: "68px",
    speech: "80px",
    medium: "116px",
    large: "166px",
  }[size];

  return (
    <span
      aria-hidden="true"
      className={`${styles.mascot} ${styles[size]} ${className}`.trim()}
    >
      <Image
        alt=""
        className={styles.image}
        fill
        priority={priority}
        sizes={responsiveSize}
        src={image}
      />
    </span>
  );
}
