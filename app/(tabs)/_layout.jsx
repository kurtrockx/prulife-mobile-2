import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  useEffect(() => {
    const hideNavBar = async () => {
      await NavigationBar.setVisibilityAsync("hidden"); // hides the Android navbar
      await NavigationBar.setBehaviorAsync("overlay-swipe"); // allows swipe up temporarily
    };

    hideNavBar();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#9c0012",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: {
            height: 70,
            paddingBottom: 10,
            paddingTop: 5,
            backgroundColor: "white",
            borderTopWidth: 0,
          },
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: "Announcements",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="bullhorn-outline" // megaphone style icon
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-circle-outline" size={26} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
