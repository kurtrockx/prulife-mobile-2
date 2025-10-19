import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// Reusable rounded TextInput
const RoundedInput = ({ label, value, onChangeText, ...props }) => (
  <TextInput
    label={label}
    value={value}
    onChangeText={onChangeText}
    mode="outlined"
    theme={{ roundness: 50 }}
    style={styles.input}
    {...props}
  />
);

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

  const validateForm = () => {
    if (!fullname.trim()) return "Full Name is required";
    if (!birthdate) return "Birthdate is required";
    if (!contactNumber.trim()) return "Contact Number is required";
    if (!occupation.trim()) return "Occupation is required";
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSignUp = async () => {
    const error = validateForm();
    if (error) return Alert.alert("Validation Error", error);

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
        createdAt: new Date().toISOString(),
        messages: [],
        status: "pending",
      });

      Alert.alert("Success", "Account created!");
      router.replace("/signin");
    } catch (err) {
      Alert.alert("Registration Failed", err.message);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || birthdate;
    setShowDatePicker(Platform.OS === "ios");
    setBirthdate(currentDate);
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: "white" }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === "ios" ? 0 : 80}
      keyboardShouldPersistTaps="handled"
      keyboardOpeningTime={0}
    >
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <View style={{ width: "100%", maxWidth: 400, alignSelf: "center" }}>
          <Text style={styles.header}>Register</Text>
          <Text style={styles.subHeader}>Create your account</Text>

          <RoundedInput
            label="Full Name"
            value={fullname}
            onChangeText={setFullname}
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <RoundedInput
              label="Birthdate"
              value={birthdate.toDateString()}
              editable={false}
              pointerEvents="none"
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

          <RoundedInput
            label="Contact Number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />

          <RoundedInput
            label="Occupation"
            value={occupation}
            onChangeText={setOccupation}
          />

          <RoundedInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <RoundedInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <RoundedInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button mode="contained" onPress={handleSignUp} style={styles.button}>
            Sign Up
          </Button>

          <TouchableOpacity
            onPress={() => router.push("/signin")}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>
              Already have an account?{" "}
              <Text style={styles.signin}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "500",
    marginBottom: 8,
  },
  subHeader: {
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 10,
    alignSelf: "center",
    width: "60%",
    borderRadius: 24,
    backgroundColor: "#b30f1c",
    paddingVertical: 10,
  },
  linkButton: {
    marginTop: 12,
  },
  linkButtonText: {
    color: "black",
    textAlign: "center",
  },
  signin: {
    color: "blue",
  },
});
