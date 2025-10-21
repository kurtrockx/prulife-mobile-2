// 🔥 Firebase core setup
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB-oNYCzUQZot26XC9YO5ohoE6pwd0eYA",
  authDomain: "capstone2-prulifeuk.firebaseapp.com",
  projectId: "capstone2-prulifeuk",
  storageBucket: "capstone2-prulifeuk.firebasestorage.app",
  messagingSenderId: "732043751595",
  appId: "1:732043751595:web:7618c1d7ac4bb7d77307ee",
  measurementId: "G-4Q4HMEDE57",
};

// ✅ Prevent multiple Firebase instances (important for Expo / hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Prevent re-initialization of Auth
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
// 🔥 Firestore initialization
export const db = getFirestore(app);
export { auth };

/* =========================================================
   📢 ANNOUNCEMENT BACKEND FUNCTIONS
   ========================================================= */

export function listenToAnnouncements(callback) {
  const announcementsRef = collection(db, "announcements");
  const q = query(announcementsRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });

  return unsubscribe;
}
