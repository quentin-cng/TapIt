import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "./AppScreen";
import { colors, fonts } from "../theme/tokens";

type PlaceholderScreenProps = {
  description: string;
  title: string;
};

export function PlaceholderScreen({ description, title }: PlaceholderScreenProps) {
  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TapIt</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.description}>{description}</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 36,
  },
  eyebrow: {
    marginBottom: 8,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 42,
    letterSpacing: -2,
    lineHeight: 44,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  description: {
    maxWidth: 420,
    paddingTop: 24,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
});
