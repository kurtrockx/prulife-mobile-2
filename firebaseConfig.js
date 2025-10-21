// 🔥 Firebase core setup
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
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

// ✅ Prevent multiple Firebase instances
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Firebase Auth with persistent AsyncStorage
// (React Native requires manual setup)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Firestore initialization
const db = getFirestore(app);

// ✅ Export initialized services
export { app, auth, db };

/* =========================================================
   👤 AUTH UTILITIES
   ========================================================= */

// Listen for user authentication state changes (persistent)
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, (user) => callback(user));
}

/* =========================================================
   📢 ANNOUNCEMENT BACKEND FUNCTIONS
   ========================================================= */

// 🔔 Listen to Firestore announcements (real-time updates)
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
