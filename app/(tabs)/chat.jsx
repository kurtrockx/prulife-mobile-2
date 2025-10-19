import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { router } from "expo-router";

// Message bubble component
const MessageBubble = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.adminBubble,
        { alignSelf: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <Text style={isUser ? styles.userText : styles.adminText}>
        {message.message}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
};

export default function ChatScreen() {
  const user = auth.currentUser;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null); // ✅ Store PDF link
  const flatListRef = useRef(null);

  const userRef = doc(db, "users", user.uid);

  useEffect(() => {
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMessages(data.messages || []);
        setPdfUrl(data.pdfUrl || null); // ✅ Get PDF link from Firestore
      }
    });
    return unsubscribe;
  }, [userRef]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // "YYYY-MM-DD"
  };

  const sendMessage = async () => {
    if (message.trim() === "") return;

    const today = getTodayDate();

    await updateDoc(userRef, {
      messages: arrayUnion({
        createdAt: Date.now(),
        message,
        sender: "user",
        date: today,
      }),
    });

    setMessage("");

    const snap = await getDoc(userRef);
    const messagesData = snap.exists() ? snap.data().messages || [] : [];

    const adminRepliedToday = messagesData.some(
      (msg) => msg.sender === "admin" && msg.date === today
    );

    if (!adminRepliedToday) {
      await updateDoc(userRef, {
        messages: arrayUnion({
          createdAt: Date.now(),
          message: "Hi! This is an automated admin reply.",
          sender: "admin",
          date: today,
        }),
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/signin");
  };

const handleOpenLink = async (url) => {
  if (!url || typeof url !== "string") {
    Alert.alert("No file found", "The PDF link is missing or invalid.");
    return;
  }

  try {
    // ✅ Ensure .pdf extension
    let finalUrl = url;
    if (!finalUrl.toLowerCase().endsWith(".pdf")) {
      finalUrl += ".pdf";
    }

    const supported = await Linking.canOpenURL(finalUrl);
    if (supported) {
      await Linking.openURL(finalUrl);
    } else {
      Alert.alert("Download File", "The app cannot open this link directly. We'll try to rename and open it.");
      // Open fallback — Cloudinary direct link for download
      await Linking.openURL(finalUrl + "?dl=1");
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong while opening the file.");
    console.error("Link error:", error);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Dynamic Download PDF Link */}
      <TouchableOpacity
        disabled={!pdfUrl}
        onPress={() => handleOpenLink(pdfUrl)}
        style={{ opacity: pdfUrl ? 1 : 0.5, marginVertical: 8 }}
      >
        <Text style={{ color: "blue", textDecorationLine: "underline" }}>
          {pdfUrl ? "Download PDF" : "No PDF Available"}
        </Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          contentContainerStyle={{ padding: 10, flexGrow: 1 }}
          data={messages.sort((a, b) => a.createdAt - b.createdAt)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <MessageBubble message={item} />}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            onChangeText={setMessage}
            value={message}
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  header: {
    height: 60,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  logoutBtn: { padding: 5, borderRadius: 6, backgroundColor: "#d19315" },
  logoutText: { color: "white", fontWeight: "600" },
  bubble: {
    maxWidth: "75%",
    padding: 10,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  userBubble: { backgroundColor: "#460809", borderTopRightRadius: 0 },
  adminBubble: { backgroundColor: "#dbdbdb", borderTopLeftRadius: 0 },
  userText: { color: "#ffffff" },
  adminText: { color: "#000000" },
  timestamp: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFF",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F1F1",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 5,
  },
  sendBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 5,
  },
  sendText: { color: "white", fontWeight: "600" },
  replyBtn: {
    backgroundColor: "#34C759",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
