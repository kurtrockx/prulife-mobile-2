import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

// ⚙️ Create Material Top Tabs compatible with Expo Router
const TopTabs = withLayoutContext(createMaterialTopTabNavigator().Navigator);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // 🔹 Ensure Android system navbar is always visible
  useEffect(() => {
    const setSystemNavBar = async () => {
      try {
        // Wait briefly to ensure layout is rendered
        await new Promise((resolve) => setTimeout(resolve, 100));

        await NavigationBar.setVisibilityAsync("visible"); // navbar visible
        await NavigationBar.setBackgroundColorAsync("#000000"); // black background
        await NavigationBar.setButtonStyleAsync("light"); // white icons
        await NavigationBar.setBehaviorAsync("inset-swipe"); // normal behavior
      } catch (e) {
        console.log("Navigation bar setup error:", e);
      }
    };

    setSystemNavBar();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "black",
        paddingTop: insets.top,
      }}
      edges={["left", "right", "bottom"]} // ✅ keep bottom safe area
    >
      {/* 🔴 Header Bar — PruLife UK */}
      <View style={styles.header}>
        <Text style={styles.brand}>PRULIFE UK</Text>
      </View>

      {/* 🧭 Top Tabs under header */}
      <View style={{ flex: 1 }}>
        <TopTabs
          screenOptions={{
            tabBarActiveTintColor: "#9c0012",
            tabBarInactiveTintColor: "#888",
            tabBarStyle: {
              backgroundColor: "#fff",
              elevation: 2,
              shadowOpacity: 0.1,
            },
            tabBarIndicatorStyle: {
              backgroundColor: "#9c0012",
              height: 3,
            },
            tabBarShowLabel: false,
          }}
        >
          <TopTabs.Screen
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
          <TopTabs.Screen
            name="announcements"
            options={{
              title: "Announcements",
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="bullhorn-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />
          <TopTabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name="person-circle-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />
        </TopTabs>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#9c0012", // red
  },
  brand: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
  },
});
