// app/_layout.jsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      const hideNavBar = async () => {
        try {
          // Hide navbar
          await NavigationBar.setVisibilityAsync("hidden");

          // Make gestures immersive
          await NavigationBar.setBehaviorAsync("immersive");
        } catch (e) {
          console.log("NavBar hide error:", e);
        }
      };

      hideNavBar();
    }
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" translucent={true} />
      <Slot />
    </>
  );
}
