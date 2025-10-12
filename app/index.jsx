// app/index.jsx
import { useEffect } from "react";
import { auth } from "../firebaseConfig";
import { router } from "expo-router";

export default function Index() {
  useEffect(() => {
    // Redirect based on auth state
    if (auth.currentUser) {
      router.replace("/chat"); // Already logged in
    } else {
      router.replace("/signin"); // Not logged in
    }
  }, []);

  return null; // Nothing to render, just redirecting
}
