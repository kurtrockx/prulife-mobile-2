import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Import icon

const RoundedInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  toggleSecure,
  ...props
}) => (
  <TextInput
    label={label}
    value={value}
    onChangeText={onChangeText}
    mode="outlined"
    theme={{ roundness: 50 }}
    style={styles.input}
    secureTextEntry={secureTextEntry}
    right={
      toggleSecure ? (
        <TextInput.Icon
          icon={secureTextEntry ? "eye-off" : "eye"}
          onPress={toggleSecure}
        />
      ) : null
    }
    {...props}
  />
);

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // toggle state
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      return Alert.alert("Validation Error", "Email and Password are required");
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/chat");
    } catch (error) {
      Alert.alert("Login failed", error.message);
    }
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
          <Text style={styles.header}>Sign In</Text>
          <Text style={styles.subHeader}>Welcome back! Please login.</Text>

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
            secureTextEntry={!showPassword}
            toggleSecure={() => setShowPassword(!showPassword)}
          />

          <Button mode="contained" onPress={handleSignIn} style={styles.button}>
            Sign In
          </Button>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>
              Don't have an account? <Text style={styles.signup}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
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
  signup: {
    color: "blue",
  },
});
