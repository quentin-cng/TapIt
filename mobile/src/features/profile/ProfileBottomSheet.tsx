import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ProfileBottomSheetProps = {
  accessibilityLabel: string;
  children: ReactNode;
  closeDisabled?: boolean;
  onClose: () => void;
  visible: boolean;
};

export function ProfileBottomSheet({
  accessibilityLabel,
  children,
  closeDisabled = false,
  onClose,
  visible,
}: ProfileBottomSheetProps) {
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(80));
  const isClosing = useRef(false);

  useEffect(() => {
    if (!visible) return;

    isClosing.current = false;
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(80);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 150,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY, visible]);

  function close() {
    if (closeDisabled || isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 160,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration: 210,
        easing: Easing.in(Easing.cubic),
        toValue: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosing.current = false;
      onClose();
    });
  }

  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible
    >
      <View accessibilityLabel={accessibilityLabel} style={styles.container}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          disabled={closeDisabled}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
              <View style={styles.handle} />
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                disabled={closeDisabled}
                hitSlop={8}
                onPress={close}
                style={({ pressed }) => [
                  styles.closeButton,
                  closeDisabled && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  color="#1a1333"
                  name="close"
                  size={22}
                />
              </Pressable>
              {children}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(26, 19, 51, 0.44)",
  },
  sheetContainer: {
    maxHeight: "92%",
  },
  safeArea: {
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#fff8f1",
  },
  handle: {
    width: 42,
    height: 4,
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 2,
    backgroundColor: "#d9ccbf",
  },
  closeButton: {
    position: "absolute",
    zIndex: 1,
    top: 18,
    right: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#f2e9de",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
