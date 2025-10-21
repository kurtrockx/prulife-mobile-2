import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

const MessageBubble = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <View
      style={[styles.bubble, isUser ? styles.userBubble : styles.adminBubble]}
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
const insets = useSafeAreaInsets();
const isAndroid = Platform.OS === "android";
  const user = auth.currentUser;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [firstName, setFirstName] = useState("");
  const flatListRef = useRef(null);
  const userRef = doc(db, "users", user.uid);

  useEffect(() => {
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMessages(data.messages || []);
        if (data.fullname) setFirstName(data.fullname.split(" ")[0]);
      }
    });
    return unsubscribe;
  }, [userRef]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, []);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const sendMessage = async () => {
    if (!message.trim()) return;

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.header}>Hi, {firstName}</Text>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <FlatList
            ref={flatListRef}
            data={messages.sort((a, b) => a.createdAt - b.createdAt)}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: isAndroid ? 40 : insets.bottom + 6, // 👈 Add manual buffer for Android
            },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#888"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  header: {
    padding: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#b30f1c",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  messageList: {
    padding: 10,
    paddingBottom: 10,
    flexGrow: 1,
  },
  bubble: { maxWidth: "75%", padding: 12, marginVertical: 4, borderRadius: 24 },
  userBubble: {
    backgroundColor: "#b30f1c",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  adminBubble: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  userText: { color: "#fff", fontWeight: "500" },
  adminText: { color: "#000", fontWeight: "500" },
  timestamp: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#b30f1c",
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
