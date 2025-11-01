import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  listenToAnnouncements,
  listenToComments,
  addComment,
  likeAnnouncement,
  unlikeAnnouncement,
  listenToLikes,
  auth,
} from "../../firebaseConfig";

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [likes, setLikes] = useState({});

  useEffect(() => {
    if (!selected) return;

    // Subscribe to comments for selected announcement
    const unsub = listenToComments(selected.id, (data) => {
      setComments(data);
    });

    return () => unsub();
  }, [selected]);

  useEffect(() => {
    const unsub = listenToAnnouncements((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (announcements.length === 0) return;
    const unsubscribers = [];
    announcements.forEach((item) => {
      const unsub = listenToLikes(item.id, (data) => {
        setLikes((prev) => ({ ...prev, [item.id]: data }));
      });
      unsubscribers.push(unsub);
    });
    return () => unsubscribers.forEach((u) => u());
  }, [announcements]);

  const toggleLike = async (item) => {
    const user = auth.currentUser;
    if (!user || !item?.id) return;

    const currentLikes = likes[item.id] || [];
    const hasLiked = currentLikes.some((l) => l.userId === user.uid);

    setLikes((prev) => ({
      ...prev,
      [item.id]: hasLiked
        ? prev[item.id].filter((l) => l.userId !== user.uid)
        : [
            ...(prev[item.id] || []),
            { userId: user.uid, userEmail: user.email },
          ],
    }));

    try {
      if (hasLiked) await unlikeAnnouncement(item.id, user.uid);
      else await likeAnnouncement(item.id, user);
    } catch (e) {
      console.error("Error toggling like:", e);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selected) return;
    const user = auth.currentUser;
    const authorName = user?.displayName || user?.email || "Anonymous";
    await addComment(selected.id, {
      text: commentInput.trim(),
      author: authorName,
      authorId: user?.uid || null,
    });
    setCommentInput("");
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#b30f1c" />
      </View>
    );

  return (
    <View style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://i.ibb.co/KZX7R8C/pru-square.png" }}
          style={styles.headerLogo}
        />
        <Text style={styles.headerTitle}>Welcome to PruLife UK!</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Ionicons name="person-circle" size={42} color="#b30f1c" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.postAuthor}>{item.author}</Text>
                <Text style={styles.postDate}>Official Announcement</Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color="#555" />
            </View>

            {/* Post Image */}
            {item.thumb && (
              <Image source={{ uri: item.thumb }} style={styles.postImage} />
            )}

            {/* Post Content */}
            <View style={styles.postContent}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postText} numberOfLines={3}>
                {item.content}
              </Text>
            </View>

            {/* Reactions Row */}
            <View style={styles.reactionRow}>
              <Pressable
                onPress={() => toggleLike(item)}
                style={({ pressed }) => [
                  styles.reactionButton,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Ionicons
                  name={
                    likes[item.id]?.some(
                      (l) => l.userId === auth.currentUser?.uid
                    )
                      ? "heart"
                      : "heart-outline"
                  }
                  size={22}
                  color={
                    likes[item.id]?.some(
                      (l) => l.userId === auth.currentUser?.uid
                    )
                      ? "#b30f1c"
                      : "#555"
                  }
                />
                <Text
                  style={[
                    styles.reactionText,
                    likes[item.id]?.some(
                      (l) => l.userId === auth.currentUser?.uid
                    ) && { color: "#b30f1c" },
                  ]}
                >
                  {likes[item.id]?.length ?? 0}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelected(item)}
                style={({ pressed }) => [
                  styles.reactionButton,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={21} color="#555" />
                <Text style={styles.reactionText}>Comment</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Post Modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Fixed Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Announcement</Text>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Announcement Image */}
              {selected?.image && (
                <Image
                  source={{ uri: selected.image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

              {/* Announcement Content */}
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>{selected?.title}</Text>
                <Text style={styles.modalBody}>{selected?.content}</Text>
              </View>

              {/* Comments */}
              <View style={styles.commentSection}>
                <Text style={styles.commentHeader}>Comments</Text>

                {comments.length === 0 ? (
                  <Text style={styles.noComments}>
                    No comments yet. Be the first!
                  </Text>
                ) : (
                  comments.map((c) => (
                    <View key={c.id} style={styles.commentItem}>
                      <Ionicons
                        name="person-circle-outline"
                        size={28}
                        color="#b30f1c"
                      />
                      <View style={styles.commentCard}>
                        <Text style={styles.commentAuthor}>
                          {c.author || "Anonymous"}
                        </Text>
                        <Text style={styles.commentText}>{c.text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {/* Input Row */}
            <View style={styles.commentInputContainer}>
              <TextInput
                placeholder="Write a comment..."
                value={commentInput}
                onChangeText={setCommentInput}
                style={styles.commentInput}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                style={[
                  styles.commentPostBtn,
                  !commentInput.trim() && { opacity: 0.5 },
                ]}
                disabled={!commentInput.trim()}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    elevation: 3,
  },
  headerLogo: { width: 40, height: 40, borderRadius: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#b30f1c" },

  /* Post Card */
  postCard: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  postContent: { padding: 12 },
  postAuthor: { fontWeight: "600", fontSize: 15, color: "#222" },
  postDate: { fontSize: 12, color: "#888" },
  postImage: { width: "100%", height: 220 },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111",
  },
  postText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    textAlign: "justify",
  },

  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopColor: "#eee",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: "flex-start",
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  reactionText: { fontSize: 14, marginLeft: 4, color: "#555" },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalClose: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: "700", color: "#b30f1c" },
  modalTextContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  modalImage: {
    width: "90%",
    height: 220,
    alignSelf: "center",
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: "#f0f2f5",
    padding: 8,
    borderRadius: 12,
    marginLeft: 10,
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  commentPostBtn: {
    backgroundColor: "#b30f1c",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Comments */
  commentSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  commentHeader: {
    fontWeight: "700",
    fontSize: 16,
    color: "#b30f1c",
    marginBottom: 10,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 14,
  },
  commentPostBtn: {
    backgroundColor: "#b30f1c",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 6,
  },
  noComments: { color: "#777", fontStyle: "italic", fontSize: 13 },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  commentAuthor: { fontWeight: "700", color: "#b30f1c", fontSize: 14 },
  commentText: {
    fontSize: 13,
    color: "#333",
    backgroundColor: "#f0f2f5",
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
  },
});
