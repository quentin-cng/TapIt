import * as Haptics from "expo-haptics";

export type TapHaptic = "press" | "detected" | "success" | "goalComplete";

const successFamilyDeduplicationWindowMs = 1_200;
let lastSuccessFamilyFeedbackAt = 0;

export function triggerTapHaptic(feedback: TapHaptic) {
  const now = Date.now();

  if (feedback === "success" || feedback === "goalComplete") {
    if (
      now - lastSuccessFamilyFeedbackAt <
      successFamilyDeduplicationWindowMs
    ) {
      return;
    }

    lastSuccessFamilyFeedbackAt = now;
  }

  const request =
    feedback === "press"
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : feedback === "detected"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );

  void request.catch(() => undefined);
}
