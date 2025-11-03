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
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

const QuickTexts = [
  "Hello!",
  "Thank you!",
  "I need help.",
  "Can we talk?",
  "Please call me",
  "Good morning!",
  "Good night!",
];

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
  const user = auth.currentUser;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showQuickTexts, setShowQuickTexts] = useState(false);
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
    const keyboardShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () =>
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        )
    );
    return () => keyboardShow.remove();
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
    setShowQuickTexts(false);

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

  const openModal = (msg) => {
    setSelectedMessage(msg);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setSelectedMessage(null));
  };

  const insertQuickText = (text) => {
    setMessage(text);
    setShowQuickTexts(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.header}>Hi, {firstName}</Text>

          <FlatList
            ref={flatListRef}
            data={messages.sort((a, b) => a.createdAt - b.createdAt)}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openModal(item)}>
                <MessageBubble message={item} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* Quick Text Panel */}
          {showQuickTexts && (
            <Animated.View style={styles.quickTextOverlay}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickTextScroll}
              >
                {QuickTexts.map((qt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickTextButton}
                    onPress={() => insertQuickText(qt)}
                  >
                    <Text style={styles.quickTextLabel}>{qt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Input Row */}
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: insets.bottom || 10 },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowQuickTexts((prev) => !prev)}
              style={styles.quickBtn}
            >
              <Ionicons
                name="ellipsis-horizontal-circle"
                size={28}
                color="#b30f1c"
              />
            </TouchableOpacity>
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
              style={[
                styles.sendBtn,
                !message.trim() && styles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Modal Overlay */}
      {selectedMessage && (
        <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.modalMessage}>{selectedMessage.message}</Text>
              <Text style={styles.modalTimestamp}>
                {new Date(selectedMessage.createdAt).toLocaleString()}
              </Text>
              <Text style={{ marginTop: 10 }}>
                Sender: {selectedMessage.sender === "user" ? "You" : "Admin"}
              </Text>
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#b30f1c",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  messageList: { padding: 10, flexGrow: 1 },
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
    paddingHorizontal: 10,
    paddingTop: 10,
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
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: "#b30f1c",
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  quickBtn: { marginRight: 6 },

  /* Quick Text Overlay */
  quickTextOverlay: {
    position: "absolute",
    bottom: 70,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 999,
  },

  quickTextScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // For spacing between buttons (RN >= 0.70) or use marginRight on buttons
  },

  quickTextButton: {
    backgroundColor: "#b30f1c",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  quickTextLabel: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  /* Modal */
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#b30f1c" },
  modalClose: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },
  modalMessage: { fontSize: 16, marginBottom: 10 },
  modalTimestamp: { fontSize: 12, color: "#666" },
});
