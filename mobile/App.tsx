import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CheckinScreen } from "./src/checkin/CheckinScreen";
import { supabase } from "./src/lib/supabase";

type MyProfile = {
  display_name: string | null;
  username: string;
  total_points: number;
  created_at: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showDevelopmentCheckin, setShowDevelopmentCheckin] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;

      if (error) {
        setAuthError("Your saved session could not be restored. Please log in again.");
        setSession(null);
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    if (!session) {
      setShowDevelopmentCheckin(false);
      setProfile(null);
      setProfileError("");
      setIsLoadingProfile(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoadingProfile(true);
    setProfileError("");

    void supabase
      .rpc("get_my_profile")
      .single()
      .then(({ data, error }) => {
        if (!isCurrent) return;

        if (error || !data) {
          setProfile(null);
          setProfileError("Your profile could not be loaded. Please try again.");
        } else {
          setProfile(data as MyProfile);
        }

        setIsLoadingProfile(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [profileRefreshKey, session]);

  async function signIn() {
    setAuthError("");
    setIsSigningIn(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setAuthError(
        error.message.toLowerCase().includes("invalid login credentials")
          ? "Email or password is incorrect."
          : "We could not log you in. Please try again.",
      );
    } else {
      setPassword("");
      setSession(data.session);
    }

    setIsSigningIn(false);
  }

  async function signOut() {
    setAuthError("");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError("We could not log you out. Please try again.");
    }
  }

  if (session === undefined) {
    return (
      <View style={styles.centered}>
        <StatusBar style="auto" />
        <ActivityIndicator accessibilityLabel="Restoring session" size="large" />
        <Text style={styles.loadingText}>Opening TapIt…</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <StatusBar style="auto" />
        <View style={styles.card}>
          <Text style={styles.brand}>TapIt</Text>
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>Use your existing TapIt account.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!isSigningIn}
            inputMode="email"
            onChangeText={setEmail}
            placeholder="example@email.com"
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="current-password"
            editable={!isSigningIn}
            onChangeText={setPassword}
            onSubmitEditing={() => void signIn()}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {authError ? <Text style={styles.error}>{authError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn || !email.trim() || !password}
            onPress={() => void signIn()}
            style={({ pressed }) => [
              styles.primaryButton,
              (isSigningIn || !email.trim() || !password) && styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Log in</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (__DEV__ && showDevelopmentCheckin) {
    return (
      <CheckinScreen
        onBack={() => setShowDevelopmentCheckin(false)}
        onSuccessfulCheckin={() => {
          setProfileRefreshKey((current) => current + 1);
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="auto" />
      <View style={styles.card}>
        <Text style={styles.brand}>TapIt</Text>
        <Text style={styles.title}>Your profile</Text>

        {isLoadingProfile ? (
          <View style={styles.profileLoading}>
            <ActivityIndicator accessibilityLabel="Loading profile" size="large" />
            <Text style={styles.loadingText}>Loading your profile…</Text>
          </View>
        ) : profile ? (
          <View style={styles.profile}>
            {profile.display_name ? (
              <Text style={styles.displayName}>{profile.display_name}</Text>
            ) : null}
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.points}>{profile.total_points}</Text>
            <Text style={styles.pointsLabel}>total points</Text>
          </View>
        ) : (
          <Text style={styles.error}>{profileError}</Text>
        )}

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDevelopmentCheckin(true)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>Test check-in</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
        >
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f4f4f0",
    padding: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f4f4f0",
  },
  card: {
    gap: 12,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 24,
  },
  brand: {
    color: "#155e3b",
    fontSize: 20,
    fontWeight: "800",
  },
  title: {
    color: "#171717",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    marginBottom: 12,
    color: "#5f6360",
    fontSize: 16,
  },
  label: {
    color: "#272a28",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#c9ceca",
    borderRadius: 10,
    paddingHorizontal: 14,
    color: "#171717",
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#155e3b",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#155e3b",
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#155e3b",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressedButton: {
    opacity: 0.75,
  },
  error: {
    color: "#a32121",
    fontSize: 14,
  },
  loadingText: {
    color: "#5f6360",
    fontSize: 15,
  },
  profileLoading: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
  },
  profile: {
    alignItems: "center",
    paddingVertical: 24,
  },
  displayName: {
    color: "#171717",
    fontSize: 24,
    fontWeight: "700",
  },
  username: {
    marginTop: 4,
    color: "#5f6360",
    fontSize: 17,
  },
  points: {
    marginTop: 24,
    color: "#155e3b",
    fontSize: 48,
    fontWeight: "800",
  },
  pointsLabel: {
    color: "#5f6360",
    fontSize: 15,
  },
});
