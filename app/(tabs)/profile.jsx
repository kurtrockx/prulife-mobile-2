import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // adjust path
import ProfilePage from "../components/ProfilePage";
import { Text } from "react-native";

export default function ProfileContainer() {
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!userData) return <Text>Loading profile...</Text>;

  return <ProfilePage userData={userData} />;
}
