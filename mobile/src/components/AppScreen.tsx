import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { RefreshControlProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ElasticRefreshScrollView } from "../motion/ElasticRefreshScrollView";
import { colors, fonts, v3Colors } from "../theme/tokens";

type AppScreenProps = {
  backgroundColor?: string;
  children: ReactNode;
  extendUnderTopInset?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  showTopbar?: boolean;
  topbarAccessory?: ReactNode;
  variant?: "default" | "v3";
};

export function AppScreen({
  backgroundColor = colors.background,
  children,
  extendUnderTopInset = false,
  refreshControl,
  showTopbar = true,
  topbarAccessory,
  variant = "default",
}: AppScreenProps) {
  const isV3 = variant === "v3";

  return (
    <SafeAreaView
      edges={extendUnderTopInset ? [] : ["top"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      {showTopbar ? (
        <View style={[styles.topbar, isV3 && styles.v3Topbar]}>
          <Text
            accessibilityRole="header"
            style={[styles.wordmark, isV3 && styles.v3Wordmark]}
          >
            Tap<Text style={styles.wordmarkAccent}>It</Text>
          </Text>
          {topbarAccessory ? (
            <View style={styles.topbarAccessory}>{topbarAccessory}</View>
          ) : null}
        </View>
      ) : null}
      <ElasticRefreshScrollView
        contentContainerStyle={[
          styles.content,
          isV3 && styles.v3Content,
          extendUnderTopInset && styles.edgeToEdgeTopContent,
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ElasticRefreshScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginHorizontal: 16,
  },
  topbarAccessory: {
    marginLeft: 16,
  },
  v3Topbar: {
    minHeight: 64,
    borderBottomWidth: 0,
    marginHorizontal: 20,
    paddingTop: 8,
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
  v3Wordmark: {
    color: v3Colors.ink,
    fontSize: 23,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  v3Content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 64,
  },
  edgeToEdgeTopContent: {
    paddingTop: 0,
  },
});
