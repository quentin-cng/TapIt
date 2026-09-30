import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { RefreshControlProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../theme/tokens";

type AppScreenProps = {
  children: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function AppScreen({ children, refreshControl }: AppScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topbar}>
        <Text accessibilityRole="header" style={styles.wordmark}>
          Tap<Text style={styles.wordmarkAccent}>It</Text>
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    minHeight: 68,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginHorizontal: 16,
  },
  wordmark: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -1.5,
  },
  wordmarkAccent: {
    color: colors.purple,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
});
