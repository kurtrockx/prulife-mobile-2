import { Tabs } from "expo-router";
import { Text, useColorScheme } from "react-native";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide Android navigation bar
    NavigationBar.setVisibilityAsync("hidden");
    // Optional: make navbar transparent
    NavigationBar.setBackgroundColorAsync("transparent");
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#450509",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: { height: 60, paddingBottom: 5, paddingTop: 5 },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => <Text style={{ color }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
