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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import {
  listenToAnnouncements,
  listenToComments,
  addComment,
  likeAnnouncement,
  unlikeAnnouncement,
  listenToLikes,
  hasUserLiked,
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
    const unsubscribe = listenToAnnouncements((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until announcements are loaded
    if (announcements.length === 0) return;

    // Keep track of unsubscribe functions
    const unsubscribers = [];

    announcements.forEach((item) => {
      const unsub = listenToLikes(item.id, (data) => {
        setLikes((prev) => ({
          ...prev,
          [item.id]: data,
        }));
      });
      unsubscribers.push(unsub);
    });

    // Cleanup all listeners when announcements change/unmount
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [announcements]);

  const toggleLike = async (item) => {
    const user = auth.currentUser;
    if (!user || !item?.id) return;

    const currentLikes = likes[item.id] || [];
    const hasLiked = currentLikes.some((l) => l.userId === user.uid);

    // Optimistic UI update
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
      if (hasLiked) {
        await unlikeAnnouncement(item.id, user.uid);
      } else {
        await likeAnnouncement(item.id, user);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#b30f1c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔴 PRULIFE HEADER */}
      <View style={styles.brandHeader}>
        <Image
          source={{ uri: "https://i.ibb.co/KZX7R8C/pru-square.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle}>PRULIFE UK</Text>
          <Text style={styles.brandSubtitle}>Official Announcements</Text>
        </View>
      </View>

      {/* 📜 Announcements List */}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setSelected(item);
              setComments([]);
              setLikes((prev) => ({
                ...prev,
                [item.id]: prev[item.id] || [],
              }));

              // start listening to comments
              const unsubComments = listenToComments(item.id, setComments);

              // start listening to likes
              const unsubLikes = listenToLikes(item.id, (data) => {
                setLikes((prev) => ({
                  ...prev,
                  [item.id]: data,
                }));
              });

              // clean up listeners when modal closes
              return () => {
                unsubComments();
                unsubLikes();
              };
            }}
            activeOpacity={0.8}
          >
            {item.thumb ? (
              <Image source={{ uri: item.thumb }} style={styles.thumbnail} />
            ) : null}

            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text
                style={styles.content}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {item.content}
              </Text>
              <Text style={styles.author}>By {item.author}</Text>

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
                    {likes[item.id]?.length ?? 0} Likes
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelected(item)} // you can open comment modal here later
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
          </TouchableOpacity>
        )}
      />

      {/* 🔍 Modal for full view + comments */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* ❌ Top Close Button */}
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.closeCircle}
            >
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selected?.image ? (
                <Image
                  source={{ uri: selected.image }}
                  style={styles.modalImage}
                />
              ) : null}
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <Text style={styles.modalSubtitle}>
                {'"' + selected?.subtitle + '"'}
              </Text>
              <Text style={styles.modalBody}>{selected?.content}</Text>

              {/* 💬 Comment Section */}
              <View style={styles.commentSection}>
                <Text style={styles.commentHeader}>Comments</Text>

                {/* 📝 Input stays at top */}
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChangeText={setCommentInput}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.postButton}
                    onPress={handleAddComment}
                  >
                    <Text style={styles.postText}>Post</Text>
                  </TouchableOpacity>
                </View>

                {/* 💬 Comment List */}
                {comments.length === 0 ? (
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to comment!
                  </Text>
                ) : (
                  comments.map((c) => (
                    <View key={c.id} style={styles.commentItem}>
                      <Ionicons
                        name="person-circle-outline"
                        size={26}
                        color="#b30f1c"
                      />
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text style={{ fontWeight: "700", color: "#b30f1c" }}>
                            {c.author || "Anonymous"}
                          </Text>
                          {c.createdAt?.toDate && (
                            <Text style={{ fontSize: 10, color: "#999" }}>
                              {c.createdAt.toDate().toLocaleString()}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.commentText}>{c.text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", paddingHorizontal: 16 },

  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#b30f1c",
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 16,
    gap: 14,
  },
  logo: { width: 80, height: 80, marginRight: 12 },
  brandTextContainer: { flexDirection: "column", alignItems: "flex-start" },
  brandTitle: { fontSize: 24, fontWeight: "800", color: "white" },
  brandSubtitle: { fontSize: 14, color: "#fff9", marginTop: -2 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: "hidden",
  },
  thumbnail: { width: "100%", height: 180, resizeMode: "cover" },
  textContainer: { padding: 14 },
  title: { fontSize: 20, fontWeight: "600", color: "#222" },
  subtitle: { fontSize: 14, color: "#777", marginTop: 2 },
  content: { marginTop: 6, fontSize: 14, color: "#444", lineHeight: 20 },
  author: { fontSize: 12, color: "#888", marginTop: 10, textAlign: "right" },

  /* ❤️💬 Reaction Buttons */
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
    gap: 20,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reactionText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  /* 🪟 Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxHeight: "80%",
    padding: 0,
    paddingBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#b30f1c",
    textAlign: "center",
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
  },
  modalBody: {
    fontSize: 12,
    color: "#333",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginTop: 4,
    textAlign: "justify",
  },
  closeCircle: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: "white",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  /* 💬 Comments */
  commentSection: {
    borderTopColor: "#cad5e2",
    borderTopWidth: 1,
    paddingTop: 15,
    marginTop: 25,
    paddingHorizontal: 20,
  },
  commentHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#b30f1c",
    marginBottom: 10,
  },
  noCommentsText: {
    color: "#777",
    fontSize: 14,
    marginBottom: 10,
    fontStyle: "italic",
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 6,
  },
  commentText: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    padding: 8,
    borderRadius: 10,
    fontSize: 14,
    color: "#333",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // Now above the comment list
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
  },
  postButton: {
    backgroundColor: "#b30f1c",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  postText: {
    color: "white",
    fontWeight: "600",
  },
});
