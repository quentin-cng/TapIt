import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { colors, fonts } from "../../../theme/tokens";

const tabColors = {
  active: "#5b3df6",
  background: "#fffcf6",
  border: "#ebddcf",
  inactive: "#777386",
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: tabColors.active,
        tabBarInactiveTintColor: tabColors.inactive,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              color={color}
              name={focused ? "home" : "home-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              color={color}
              name={focused ? "account-multiple" : "account-multiple-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              color={color}
              name={focused ? "trophy" : "trophy-outline"}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              color={color}
              name={focused ? "gift" : "gift-outline"}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    minHeight: 62,
    borderTopColor: tabColors.border,
    backgroundColor: tabColors.background,
    elevation: 0,
    paddingTop: 5,
    shadowOpacity: 0,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },
});
