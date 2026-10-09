import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import {
  PROFILE_AVATAR_IDS,
  type ProfileAvatarId,
} from "../../domain/profile-avatar";
import { fonts, v3Colors } from "../../theme/tokens";
import { CreateAccountChoice } from "./CreateAccountChoice";
import { IntroPager } from "./IntroPager";

type PreviewStep =
  | "intro"
  | "create-account"
  | "avatar"
  | "identity"
  | "weekly-goal"
  | "complete";

type OnboardingPreviewFlowProps = {
  onExit: () => void;
};

const avatarLabels: Record<ProfileAvatarId, string> = {
  default: "Default",
  forest: "Forest",
  moon: "Moon",
  mountain: "Mountain",
  sunset: "Sunset",
};

export function OnboardingPreviewFlow({ onExit }: OnboardingPreviewFlowProps) {
  const [step, setStep] = useState<PreviewStep>("intro");
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>("default");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(4);

  if (step === "intro") {
    return (
      <IntroPager
        onComplete={() => setStep("create-account")}
        onExit={onExit}
        onSignIn={() => setStep("create-account")}
        preview
      />
    );
  }

  if (step === "create-account") {
    return (
      <CreateAccountChoice
        onBack={() => setStep("intro")}
        onSignIn={() => setStep("avatar")}
        onSubmit={async () => {
          setStep("avatar");
          return { status: "complete" };
        }}
        preview
      />
    );
  }

  if (step === "avatar") {
    return (
      <PreviewStepFrame
        copy="Choose a TapIt profile picture. This preview selection stays on this device screen only."
        onBack={() => setStep("create-account")}
        onContinue={() => setStep("identity")}
        onExit={onExit}
        title="Choose your look"
      >
        <View style={styles.avatarGrid}>
          {PROFILE_AVATAR_IDS.map((optionId) => {
            const selected = avatarId === optionId;

            return (
              <Pressable
                accessibilityLabel={`${avatarLabels[optionId]} avatar`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={optionId}
                onPress={() => setAvatarId(optionId)}
                style={({ pressed }) => [
                  styles.avatarOption,
                  selected && styles.avatarOptionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <TapItAvatar avatarId={optionId} size={62} />
                <Text
                  style={[
                    styles.avatarLabel,
                    selected && styles.avatarLabelSelected,
                  ]}
                >
                  {avatarLabels[optionId]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PreviewStepFrame>
    );
  }

  if (step === "identity") {
    return (
      <PreviewStepFrame
        copy="Pick the name friends will see and a unique username."
        onBack={() => setStep("avatar")}
        onContinue={() => setStep("weekly-goal")}
        onExit={onExit}
        title="Make it yours"
      >
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#9d919f"
              style={styles.input}
              value={displayName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor="#9d919f"
              style={styles.input}
              value={username}
            />
          </View>
        </View>
      </PreviewStepFrame>
    );
  }

  if (step === "weekly-goal") {
    return (
      <PreviewStepFrame
        copy="How many times do you want to show up each week?"
        onBack={() => setStep("identity")}
        onContinue={() => setStep("complete")}
        onExit={onExit}
        title="Set your weekly goal"
      >
        <View accessibilityRole="radiogroup" style={styles.goalOptions}>
          {Array.from({ length: 7 }, (_, index) => index + 1).map((goal) => {
            const selected = weeklyGoal === goal;

            return (
              <Pressable
                accessibilityLabel={`${goal} sessions per week`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={goal}
                onPress={() => setWeeklyGoal(goal)}
                style={({ pressed }) => [
                  styles.goalOption,
                  selected && styles.goalOptionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.goalOptionText,
                    selected && styles.goalOptionTextSelected,
                  ]}
                >
                  {goal}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.goalSelectionSummary}>
          <Text style={styles.goalSelectionNumber}>{weeklyGoal}</Text>
          <Text style={styles.goalSelectionLabel}>
            {weeklyGoal === 1 ? "session" : "sessions"} each week
          </Text>
        </View>
      </PreviewStepFrame>
    );
  }

  return (
    <SafeAreaView style={styles.completeScreen}>
      <Pressable
        accessibilityLabel="Close onboarding preview"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onExit}
        style={({ pressed }) => [
          styles.completeClose,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons color={v3Colors.ink} name="close" size={24} />
      </Pressable>
      <View style={styles.completeBody}>
        <View style={styles.completeMark}>
          <MaterialCommunityIcons color="#fffaf1" name="check" size={38} />
        </View>
        <Text accessibilityRole="header" style={styles.completeTitle}>
          You’re in<Text style={styles.period}>.</Text>
        </Text>
        <Text style={styles.completeCopy}>
          Your TapIt account is ready to move. In preview mode, your real
          account has not changed.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onExit}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Go to Home</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function PreviewStepFrame({
  children,
  copy,
  onBack,
  onContinue,
  onExit,
  title,
}: {
  children: React.ReactNode;
  copy: string;
  onBack: () => void;
  onContinue: () => void;
  onExit: () => void;
  title: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.previewHeader}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              color={v3Colors.ink}
              name="arrow-left"
              size={24}
            />
          </Pressable>
          <Text style={styles.previewHeaderLabel}>DEV PREVIEW</Text>
          <Pressable
            accessibilityLabel="Close onboarding preview"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onExit}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={v3Colors.ink} name="close" size={24} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.stepContent}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text accessibilityRole="header" style={styles.stepTitle}>
              {title}<Text style={styles.period}>.</Text>
            </Text>
            <Text style={styles.stepCopy}>{copy}</Text>
          </View>
          <View style={styles.stepBody}>{children}</View>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <MaterialCommunityIcons
              color="#fffaf1"
              name="arrow-right"
              size={20}
            />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8ed" },
  keyboardView: { flex: 1 },
  previewHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  previewHeaderLabel: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  stepContent: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 30,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  stepTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -1.8,
    lineHeight: 44,
  },
  period: { color: v3Colors.purple },
  stepCopy: {
    maxWidth: 350,
    marginTop: 10,
    color: "#706474",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  stepBody: { minHeight: 230, justifyContent: "center" },
  primaryButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: v3Colors.ink,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 11,
  },
  avatarOption: {
    width: 104,
    minHeight: 106,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 18,
    backgroundColor: "#f8eee3",
  },
  avatarOptionSelected: {
    borderColor: v3Colors.purple,
    backgroundColor: "#eee8fb",
  },
  avatarLabel: {
    color: "#706474",
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  avatarLabelSelected: { color: v3Colors.purple, fontFamily: fonts.bold },
  form: { gap: 18 },
  field: { gap: 7 },
  label: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#ddcfc0",
    borderRadius: 14,
    backgroundColor: "#fffcf6",
    color: v3Colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingHorizontal: 15,
  },
  goalOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  goalOption: {
    minWidth: 40,
    height: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 15,
    backgroundColor: "#f4eadd",
  },
  goalOptionSelected: {
    borderColor: v3Colors.purpleDark,
    backgroundColor: v3Colors.purpleDark,
  },
  goalOptionText: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  goalOptionTextSelected: { color: "#fffaf1" },
  goalSelectionSummary: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: "#f8eee3",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  goalSelectionNumber: {
    color: v3Colors.purpleDark,
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -1.5,
  },
  goalSelectionLabel: {
    color: v3Colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  completeScreen: {
    flex: 1,
    backgroundColor: "#fff8ed",
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  completeClose: {
    width: 44,
    height: 54,
    alignSelf: "flex-end",
    alignItems: "center",
    justifyContent: "center",
  },
  completeBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  completeMark: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: v3Colors.purple,
  },
  completeTitle: {
    marginTop: 24,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -2.2,
  },
  completeCopy: {
    maxWidth: 320,
    marginTop: 10,
    color: "#706474",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  pressed: { opacity: 0.67 },
});
