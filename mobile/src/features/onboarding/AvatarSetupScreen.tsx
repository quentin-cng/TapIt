import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import {
  isProfileAvatarId,
  PROFILE_AVATAR_IDS,
  type ProfileAvatarId,
} from "../../domain/profile-avatar";
import { supabase } from "../../lib/supabase";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { colors, fonts, v3Colors } from "../../theme/tokens";

const avatarLabels: Record<ProfileAvatarId, string> = {
  default: "Default",
  forest: "Forest",
  moon: "Moon",
  mountain: "Mountain",
  sunset: "Sunset",
};

export function AvatarSetupScreen() {
  const { refresh } = useOnboarding();
  const [selectedAvatar, setSelectedAvatar] =
    useState<ProfileAvatarId | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  async function saveAvatar() {
    if (submissionInFlight.current || !selectedAvatar) return;

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc("set_my_avatar", {
        p_avatar_id: selectedAvatar,
      });

      if (rpcError || !isProfileAvatarId(data) || data !== selectedAvatar) {
        if (__DEV__) {
          console.error("[mobile onboarding] avatar setup failed", {
            code: rpcError?.code,
            message: rpcError?.message,
          });
        }
        setError("We couldn’t save your avatar. Please try again.");
        return;
      }

      await refresh();
    } catch (failure) {
      if (__DEV__) {
        console.error("[mobile onboarding] avatar setup failed", failure);
      }
      setError("We couldn’t save your avatar. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isContinueDisabled = isSubmitting || selectedAvatar === null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.kicker}>ACCOUNT SETUP</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Choose your avatar<Text style={styles.period}>.</Text>
          </Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.avatarGrid}>
          {PROFILE_AVATAR_IDS.map((avatarId) => {
            const isSelected = selectedAvatar === avatarId;

            return (
              <Pressable
                accessibilityLabel={`${avatarLabels[avatarId]} avatar`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                disabled={isSubmitting}
                key={avatarId}
                onPress={() => {
                  setSelectedAvatar(avatarId);
                  setError("");
                }}
                style={({ pressed }) => [
                  styles.avatarOption,
                  isSelected && styles.avatarOptionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View>
                  <TapItAvatar avatarId={avatarId} size={76} />
                  {isSelected ? (
                    <View style={styles.selectedMark}>
                      <MaterialCommunityIcons
                        color="#fffaf1"
                        name="check"
                        size={16}
                      />
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.avatarLabel,
                    isSelected && styles.avatarLabelSelected,
                  ]}
                >
                  {avatarLabels[avatarId]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isContinueDisabled }}
            disabled={isContinueDisabled}
            onPress={() => void saveAvatar()}
            style={({ pressed }) => [
              styles.continueButton,
              isContinueDisabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fffaf1" />
            ) : (
              <>
                <Text style={styles.continueLabel}>Continue</Text>
                <MaterialCommunityIcons
                  color="#fffaf1"
                  name="arrow-right"
                  size={20}
                />
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void signOut()}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.signOut}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8ed" },
  content: {
    minHeight: "100%",
    flexGrow: 1,
    justifyContent: "center",
    gap: 34,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  heading: { gap: 10 },
  kicker: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.25,
  },
  title: {
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -1.8,
    lineHeight: 44,
  },
  period: { color: v3Colors.purple },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  avatarOption: {
    width: 104,
    minHeight: 124,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 19,
    backgroundColor: "#f8eee3",
  },
  avatarOptionSelected: {
    borderColor: v3Colors.purple,
    backgroundColor: "#eee8fb",
  },
  selectedMark: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff8ed",
    borderRadius: 13,
    backgroundColor: v3Colors.purple,
  },
  avatarLabel: {
    color: "#706474",
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  avatarLabelSelected: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  actions: { gap: 14 },
  continueButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: v3Colors.ink,
    paddingHorizontal: 20,
  },
  continueLabel: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  signOut: {
    color: "#706474",
    fontFamily: fonts.semibold,
    fontSize: 13,
    paddingVertical: 8,
    textAlign: "center",
  },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.42 },
});
