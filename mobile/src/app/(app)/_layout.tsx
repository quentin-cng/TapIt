import { Stack } from "expo-router";
import { colors } from "../../theme/tokens";

export default function AuthenticatedLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="recap" />
      <Stack.Screen name="dev-checkin" />
    </Stack>
  );
}
