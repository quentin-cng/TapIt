import type { ReactNode } from "react";
import { TapItMascot } from "./tapit-mascot";
import styles from "./tapit-mascot-speech.module.css";

type TapItMascotSpeechProps = {
  children: ReactNode;
  className?: string;
  detail?: ReactNode;
};

export function TapItMascotSpeech({
  children,
  className = "",
  detail,
}: TapItMascotSpeechProps) {
  return (
    <aside className={`${styles.speech} ${className}`.trim()}>
      <TapItMascot size="speech" variant="talking" />
      <div className={styles.bubble}>
        <p className={styles.message}>{children}</p>
        {detail ? <p className={styles.detail}>{detail}</p> : null}
      </div>
    </aside>
  );
}
