import Link from "next/link";
import { TapItWordmark } from "@/components/tapit-wordmark";

type HomePageProps = {
  searchParams: Promise<{ accountDeleted?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const { accountDeleted } = await searchParams;

  return (
    <main className="page-shell">
      <nav className="nav" aria-label="Primary navigation">
        <TapItWordmark href="/" />
        <div className="nav-actions">
          <Link className="nav-login" href="/login">
            Log in
          </Link>
          <Link className="nav-signup" href="/signup">
            Sign up
          </Link>
        </div>
      </nav>

      <section className="hero" id="top">
        {accountDeleted === "1" ? (
          <p className="account-deleted-notice" role="status">
            Your TapIt account has been permanently deleted.
          </p>
        ) : null}
        <div className="eyebrow">
          <span aria-hidden="true" />
          Built for fitness communities
        </div>

        <h1>
          Show up.
          <br />
          <em>Together.</em>
        </h1>

        <p className="intro">
          Commit to your week, tap in at supported fitness locations, and stay
          consistent with your friends.
        </p>

        <div className="preview" aria-label="How TapIt works">
          <div className="preview-icon" aria-hidden="true">
            <span className="signal signal-one" />
            <span className="signal signal-two" />
            <span className="signal signal-three" />
            <span className="tap-dot" />
          </div>
          <div>
            <p className="preview-label">The TapIt loop</p>
            <p>Tap. Check in. Earn points.</p>
          </div>
        </div>
      </section>

      <footer>
        <p>Launching soon at McGill.</p>
        <nav aria-label="Legal information">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  );
}
