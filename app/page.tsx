import type { Metadata } from "next";
import { DM_Serif_Display } from "next/font/google";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import styles from "./page.module.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
});

export const metadata: Metadata = {
  title: "TapIt — Showing up is worth it",
  description:
    "Set a weekly training goal, tap in when you train, and build consistency with your friends.",
};

type HomePageProps = {
  searchParams: Promise<{ accountDeleted?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const { accountDeleted } = await searchParams;

  return (
    <main className={`${styles.page} ${dmSerif.variable}`}>
      <MarketingHeader />

      {accountDeleted === "1" ? (
        <div className={styles.noticeWrap}>
          <p className={styles.accountDeletedNotice} role="status">
            Your TapIt account has been permanently deleted.
          </p>
        </div>
      ) : null}

      <Hero />
      <HowItWorks />
    </main>
  );
}
