import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { TapItWordmark } from "@/components/tapit-wordmark";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next: requestedNext } = await searchParams;
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
          <p className="kicker">Join TapIt</p>
          <h1>Create account</h1>
          <p>Show up together.</p>
        </div>
        <AuthForm mode="signup" next={next} />
        <p className="auth-switch">
          Already have an account?{" "}
          <Link href={{ pathname: "/login", query: { next } }}>Log in</Link>
        </p>
        <nav className="auth-legal-links" aria-label="Legal information">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </section>
    </main>
  );
}
