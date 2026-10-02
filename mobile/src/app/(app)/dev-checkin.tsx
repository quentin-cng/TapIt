import { Redirect, router } from "expo-router";
import { CheckinScreen } from "../../checkin/CheckinScreen";

export default function DevelopmentCheckinRoute() {
  if (!__DEV__) {
    return <Redirect href="/profile" />;
  }

  return (
    <CheckinScreen
      mode="development"
      onBack={() => router.back()}
      onDone={() => router.dismissTo("/")}
    />
  );
}
