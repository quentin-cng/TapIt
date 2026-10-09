import { Stack } from "expo-router";
import { colors } from "../../theme/tokens";

export default function OnboardingLayout() {
  return (
    <Stack
      initialRouteName="avatar"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}
