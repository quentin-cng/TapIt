import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { colors, fonts } from "../../../theme/tokens";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="home-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              color={color}
              name="account-multiple-outline"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={color} name="trophy-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          title: "Recap",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              color={color}
              name="calendar-week-outline"
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
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },
});
