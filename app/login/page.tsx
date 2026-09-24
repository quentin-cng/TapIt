import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { TapItWordmark } from "@/components/tapit-wordmark";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next: requestedNext } = await searchParams;
  const next = getSafeNextPath(requestedNext);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) {
    redirect(next);
  }

  return (
    <main className="auth-shell">
      <TapItWordmark className="auth-brand" href="/" />
      <section className="auth-card">
        <div className="auth-heading">
          <p className="kicker">Welcome back</p>
          <h1>Log in</h1>
          <p>Show up together.</p>
        </div>
        <AuthForm mode="login" initialError={error} next={next} />
        <p className="auth-switch">
          New to TapIt?{" "}
          <Link href={{ pathname: "/signup", query: { next } }}>
            Create an account
          </Link>
        </p>
        <nav className="auth-legal-links" aria-label="Legal information">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </section>
    </main>
  );
}
