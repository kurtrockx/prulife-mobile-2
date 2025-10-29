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
  addDoc,
  deleteDoc,
  getDoc,
  setDoc,
  doc,
  serverTimestamp,
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
  const q = collection(db, "announcements");
  return onSnapshot(q, (snapshot) => {
    const announcements = snapshot.docs.map((doc) => ({
      id: doc.id, // ✅ include this
      ...doc.data(),
    }));
    callback(announcements);
  });
}

export async function addComment(announcementId, commentData) {
  try {
    const commentsRef = collection(
      db,
      "announcements",
      announcementId,
      "comments"
    );
    await addDoc(commentsRef, {
      text: commentData.text,
      author: commentData.author || "Anonymous",
      authorId: commentData.authorId || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding comment:", error);
  }
}

// 👂 Listen to comments of a specific announcement (real-time)
export function listenToComments(announcementId, callback) {
  const commentsRef = collection(
    db,
    "announcements",
    announcementId,
    "comments"
  );
  const q = query(commentsRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(comments);
  });

  return unsubscribe;
}

// ➕ Like an announcement (creates a like document)
export async function likeAnnouncement(announcementId, user) {
  if (!user) return;
  const likeRef = doc(db, "announcements", announcementId, "likes", user.uid);
  await setDoc(likeRef, {
    userId: user.uid,
    userEmail: user.email || "Anonymous",
    likedAt: serverTimestamp(),
  });
}

// ❌ Unlike (remove) a like
export const unlikeAnnouncement = async (announcementId, userId) => {
  console.log("unlikeAnnouncement called with:", announcementId, userId);

  if (!announcementId) {
    console.error("❌ announcementId is undefined");
    return false;
  }

  if (!userId) {
    console.error("❌ userId is undefined");
    return false;
  }

  try {
    const likeRef = doc(db, "announcements", announcementId, "likes", userId);
    await deleteDoc(likeRef);
    console.log("✅ Like removed successfully");
    return true;
  } catch (error) {
    console.error("Error unliking announcement:", error);
    return false;
  }
};


// 👂 Listen for all likes on a specific announcement
export function listenToLikes(announcementId, callback) {
  const likesRef = collection(db, "announcements", announcementId, "likes");

  const unsubscribe = onSnapshot(
    likesRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback([]); // no likes yet
        return;
      }
      const likes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(likes);
    },
    (error) => {
      console.error("Error listening to likes:", error);
      callback([]); // fail-safe
    }
  );

  return unsubscribe;
}

// ✅ Check if a specific user has liked a post
export async function hasUserLiked(announcementId, userId) {
  if (!announcementId || !userId) return false;

  try {
    const likeRef = doc(db, "announcements", announcementId, "likes", userId);
    const snap = await getDoc(likeRef);
    return snap.exists();
  } catch (error) {
    console.error("Error checking like status (hasUserLiked):", error);
    return false;
  }
}
