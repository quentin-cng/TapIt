import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  const supabase = await createClient();
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    error = result.error;
  } else {
    error = new Error("Missing confirmation parameters.");
  }

  if (!error) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "error",
    "Confirmation link is invalid or expired. Please try signing up again.",
  );
  return NextResponse.redirect(loginUrl);
}
