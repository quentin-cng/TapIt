import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, v3Colors } from "../../theme/tokens";

type CreateAccountChoiceProps = {
  onBack?: () => void;
  onEmail: () => void;
  onSignIn: () => void;
  preview?: boolean;
};

export function CreateAccountChoice({
  onBack,
  onEmail,
  onSignIn,
  preview = false,
}: CreateAccountChoiceProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              color={v3Colors.ink}
              name="arrow-left"
              size={24}
            />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
        {preview ? <Text style={styles.previewLabel}>DEV PREVIEW</Text> : null}
      </View>

      <View style={styles.content}>
        <View>
          <Text accessibilityRole="header" style={styles.title}>
            Create your account<Text style={styles.period}>.</Text>
          </Text>
          <Text style={styles.copy}>
            Choose how you’ll join TapIt. Social sign-in options are coming in a
            later release.
          </Text>
        </View>

        <View style={styles.actions}>
          <ProviderButton disabled icon="apple" label="Continue with Apple" />
          <ProviderButton disabled icon="google" label="Continue with Google" />
          <ProviderButton
            icon="email-outline"
            label="Continue with Email"
            onPress={onEmail}
          />
        </View>

        <View style={styles.signInRow}>
          <Text style={styles.signInCopy}>Already have an account?</Text>
          <Pressable
            accessibilityRole="link"
            onPress={onSignIn}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.signInLink}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProviderButton({
  disabled = false,
  icon,
  label,
  onPress,
}: {
  disabled?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityHint={disabled ? "Coming soon" : undefined}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.providerButton,
        disabled && styles.providerDisabled,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons color={v3Colors.ink} name={icon} size={21} />
      <Text style={styles.providerLabel}>{label}</Text>
      {disabled ? <Text style={styles.comingSoon}>Coming soon</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8f1" },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  title: {
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 43,
    letterSpacing: -2.1,
    lineHeight: 47,
  },
  period: { color: v3Colors.purple },
  copy: {
    maxWidth: 350,
    marginTop: 13,
    color: "#746a78",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: { gap: 11, marginTop: 38 },
  providerButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#dfd1c2",
    borderRadius: 15,
    backgroundColor: "#fffcf6",
    paddingHorizontal: 17,
  },
  providerDisabled: { opacity: 0.58 },
  providerLabel: {
    minWidth: 0,
    flex: 1,
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  comingSoon: {
    color: "#928798",
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 28,
  },
  signInCopy: {
    color: "#746a78",
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  signInLink: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  pressed: { opacity: 0.7 },
});
