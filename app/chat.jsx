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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
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
  const flatListRef = useRef(null); // ✅ Ref for FlatList

  const userRef = doc(db, "users", user.uid);

  useEffect(() => {
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setMessages(snapshot.data().messages || []);
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

  const sendAdminReply = async () => {
    await updateDoc(userRef, {
      messages: arrayUnion({
        createdAt: Date.now(),
        message: "Hi! This is an automated admin reply.",
        sender: "admin",
      }),
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/signin");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef} // ✅ Attach ref here
          contentContainerStyle={{ paddingVertical: 10 }}
          data={messages.sort((a, b) => a.createdAt - b.createdAt)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <MessageBubble message={item} />}
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
          <TouchableOpacity style={styles.replyBtn} onPress={sendAdminReply}>
            <Text style={styles.replyText}>Auto Reply</Text>
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
  replyText: { color: "white", fontWeight: "600" },
});
