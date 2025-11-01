// app/_layout.jsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  useEffect(() => {
    async function configureNavigationBar() {
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setBackgroundColorAsync("#000000"); // solid black navbar
          await NavigationBar.setButtonStyleAsync("light"); // white icons
        } catch (e) {
          console.warn("NavigationBar config failed:", e);
        }
      }
    }

    configureNavigationBar();
  }, []);

  return (
    <>
      {/* 🧭 Status Bar (top) */}
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      {/* 🧱 App Content */}
      <Slot />
    </>
  );
}
