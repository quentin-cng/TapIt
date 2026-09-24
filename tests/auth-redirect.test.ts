import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getOnboardingPath,
  getSafeNextPath,
} from "../lib/auth/redirect";

describe("safe authentication redirects", () => {
  it("preserves an internal check-in destination through onboarding", () => {
    const checkinPath = `/checkin/${"a".repeat(64)}`;
    const onboardingPath = getOnboardingPath(checkinPath);
    const onboardingUrl = new URL(onboardingPath, "https://tapit.example");

    assert.equal(onboardingUrl.pathname, "/onboarding");
    assert.equal(onboardingUrl.searchParams.get("next"), checkinPath);
    assert.equal(
      getSafeNextPath(onboardingUrl.searchParams.get("next")),
      checkinPath,
    );
  });

  it("preserves valid internal paths with query strings", () => {
    assert.equal(
      getSafeNextPath("/leaderboard?view=mcgill"),
      "/leaderboard?view=mcgill",
    );
  });

  it("rejects external and protocol-relative destinations", () => {
    assert.equal(getSafeNextPath("https://evil.example"), "/dashboard");
    assert.equal(getSafeNextPath("//evil.example"), "/dashboard");
  });

  it("rejects backslash URL normalization tricks", () => {
    assert.equal(getSafeNextPath("/\\evil.example"), "/dashboard");
    assert.equal(getSafeNextPath("/\\\\evil.example"), "/dashboard");
  });

  it("uses the dashboard when onboarding receives an unsafe destination", () => {
    const onboardingUrl = new URL(
      getOnboardingPath("https://evil.example"),
      "https://tapit.example",
    );

    assert.equal(onboardingUrl.searchParams.get("next"), "/dashboard");
  });
});
