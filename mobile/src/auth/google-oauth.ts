import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  GOOGLE_OAUTH_CALLBACK_URI,
  GOOGLE_OAUTH_SCHEME,
} from "./google-oauth-contract";
import { createGoogleOAuthCoordinator } from "./google-oauth-core";

export type { GoogleOAuthResult } from "./google-oauth-core";

WebBrowser.maybeCompleteAuthSession();

const coordinator = createGoogleOAuthCoordinator({
  auth: supabase.auth,
  browser: WebBrowser,
  getRedirectUri: getGoogleOAuthRedirectUri,
});

export function getGoogleOAuthRedirectUri() {
  const generatedUri = makeRedirectUri({
    isTripleSlashed: true,
    native: GOOGLE_OAUTH_CALLBACK_URI,
    path: GOOGLE_OAUTH_CALLBACK_PATH.slice(1),
    scheme: GOOGLE_OAUTH_SCHEME,
  });

  // Native builds must use the exact allow-listed callback. Keeping this
  // assertion close to the OAuth boundary prevents an Expo host URI from
  // accidentally being sent to Supabase.
  if (generatedUri !== GOOGLE_OAUTH_CALLBACK_URI) {
    throw new Error("TapIt’s Google callback is not configured correctly.");
  }

  return generatedUri;
}

export function completeGoogleOAuthCallback(callbackUrl: string) {
  return coordinator.completeCallback(callbackUrl);
}

export function startGoogleOAuth() {
  return coordinator.start();
}
