// app/index.jsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/chat"); // Already logged in
      } else {
        router.replace("/signin"); // Not logged in
      }
    });

    return unsubscribe; // Cleanup
  }, [router]);

  return null; // Nothing to render
}
