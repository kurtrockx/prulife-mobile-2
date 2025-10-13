import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SignUpScreen() {
  const [fullname, setFullname] = useState("");
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contactNumber, setContactNumber] = useState("");
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullname,
        birthdate: birthdate.toISOString(),
        contactNumber,
        occupation,
        email: user.email,
        messages: [],
      });

      Alert.alert("Success", "Account created!");
      router.replace("/signin");
    } catch (error) {
      Alert.alert("Registration failed", error.message);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || birthdate;
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS
    setBirthdate(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register</Text>
      <Text style={styles.subHeader}>Create your account</Text>

      {/* Full Name */}
      <TextInput
        label="Full Name"
        value={fullname}
        onChangeText={setFullname}
        mode="outlined"
        theme={{ roundness: 50 }}
        activeOutlineColor="black"
        style={styles.input}
      />

      {/* Birthdate */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          label="Birthdate"
          value={birthdate.toDateString()}
          editable={false}
          pointerEvents="none"
          theme={{ roundness: 50 }}
          mode="outlined"
          activeOutlineColor="black"
          style={styles.input}
        />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthdate}
          mode="date"
          display="calendar"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}

      {/* Contact Number */}
      <TextInput
        label="Contact Number"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
        theme={{ roundness: 50 }}
        mode="outlined"
        activeOutlineColor="black"
        style={styles.input}
      />

      {/* Occupation */}
      <TextInput
        label="Occupation"
        value={occupation}
        onChangeText={setOccupation}
        mode="outlined"
        theme={{ roundness: 50 }}
        activeOutlineColor="black"
        style={styles.input}
      />

      {/* Email */}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitaliz
        theme={{ roundness: 50 }}
        e="none"
        keyboardType="email-address"
        mode="outlined"
        activeOutlineColor="black"
        style={styles.input}
      />

      {/* Password */}
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        theme={{ roundness: 50 }}
        mode="outlined"
        activeOutlineColor="black"
        style={styles.input}
      />

      {/* Confirm Password */}
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        theme={{ roundness: 50 }}
        mode="outlined"
        activeOutlineColor="black"
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSignUp} style={styles.button}>
        Sign Up
      </Button>
      <Button onPress={() => router.push("/signin")} style={styles.linkButton}>
        <Text style={styles.linkButtonText}>
          Already have an account? <Text style={styles.signin}>Sign In</Text>
        </Text>
      </Button>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 6,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "white",
  },
  header: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "500",
  },
  subHeader: {},
  input: {
    borderRadius: 50, // makes it fully rounded
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  button: {
    marginTop: 10,
    marginHorizontal: "auto",
    width: "60%",
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#450509",
  },
  linkButtonText: {
    color: "black",
  },
  signin: {
    color: "blue",
  },
});
