// app/index.jsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { auth } from "../../firebaseConfig";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/announcements"); // Must match exact tabs route
      } else {
        router.replace("/signin"); // Must match auth route
      }
    });

    return unsubscribe;
  }, [router]);
  
  return null; // Nothing to render
}
