import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts } from "../../theme/tokens";

const readerArtwork = require("../../../assets/illustrations/ready-to-tap-background.png");

const displayFont = Platform.select({
  android: "serif",
  default: "Georgia",
  ios: "Georgia",
});

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}

export function ReadyToTapScreen() {
  return (
    <ImageBackground
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      source={readerArtwork}
      style={styles.background}
    >
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to Home"
            accessibilityRole="button"
            hitSlop={10}
            onPress={goBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              color="#fff8f1"
              name="chevron-left"
              size={29}
            />
          </Pressable>
        </View>

        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.title}>
            Ready to tap
          </Text>
          <Text style={styles.subtitle}>
            Hold your phone near{"\n"}the TapIt tag.
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.statusArea}>
          <View style={styles.statusSurface}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons
                color="#1a1333"
                name="map-marker-outline"
                size={27}
              />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Checking for tag...</Text>
              <Text style={styles.statusMessage}>Keep your phone close</Text>
            </View>
            <View style={styles.nfcIndicator}>
              <MaterialCommunityIcons
                color="#5b3df6"
                name="contactless-payment"
                size={27}
              />
            </View>
          </View>
          <Text accessibilityRole="alert" style={styles.previewNotice}>
            Reader preview · Active NFC scanning is not connected yet.
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#1a1333",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    minHeight: 48,
    justifyContent: "center",
  },
  backButton: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(26, 19, 51, 0.72)",
  },
  copy: {
    marginTop: 14,
    alignItems: "center",
  },
  title: {
    color: "#fff2df",
    fontFamily: displayFont,
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.5,
    lineHeight: 48,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "#fff8f1",
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
  spacer: {
    flex: 1,
  },
  statusArea: {
    marginBottom: 10,
  },
  statusSurface: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.48)",
    borderRadius: 22,
    backgroundColor: "rgba(255, 248, 241, 0.94)",
    paddingHorizontal: 15,
  },
  statusIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#f5f0ff",
  },
  statusCopy: {
    minWidth: 0,
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    color: "#1a1333",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  statusMessage: {
    marginTop: 3,
    color: "#5f5868",
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  nfcIndicator: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d8c9fa",
    borderRadius: 20,
  },
  previewNotice: {
    marginTop: 8,
    color: "#fff8f1",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
