import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import {
  listenToAnnouncements,
  listenToComments,
  addComment,
  likeAnnouncement,
  unlikeAnnouncement,
  listenToLikes,
  auth,
} from "../../firebaseConfig";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [likes, setLikes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [doubleTapHeart, setDoubleTapHeart] = useState({});
  const flatListRefs = useRef({});
  const lastTap = useRef({});
  const insets = useSafeAreaInsets();

  /* ==========================
      Fetch Announcements
  ========================== */
  const fetchAnnouncements = () => {
    const unsub = listenToAnnouncements((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return unsub;
  };

  useEffect(() => {
    const unsub = fetchAnnouncements();
    return () => unsub();
  }, []);

  /* ==========================
      Listen to Likes
  ========================== */
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

  /* ==========================
      Listen to Comments
  ========================== */
  useEffect(() => {
    if (!selected) return;
    const unsub = listenToComments(selected.id, (data) => {
      setComments(data);
    });
    return () => unsub();
  }, [selected]);

  /* ==========================
      Like / Unlike
  ========================== */
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

  /* ==========================
      Add Comment
  ========================== */
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
    setTimeout(() => {
      flatListRefs.current["comments"]?.scrollToEnd({ animated: true });
    }, 200);
  };

  const closeModal = () => setSelected(null);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchAnnouncements();
    setRefreshing(false);
  };

  /* ==========================
      Double Tap Heart
  ========================== */
  const handleDoubleTap = (item) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (
      lastTap.current[item.id] &&
      now - lastTap.current[item.id] < DOUBLE_PRESS_DELAY
    ) {
      setDoubleTapHeart({ [item.id]: true });
      toggleLike(item);
      setTimeout(() => setDoubleTapHeart({ [item.id]: false }), 800);
    }
    lastTap.current[item.id] = now;
  };

  /* ==========================
      Image Navigation Arrows
  ========================== */
  const scrollImage = (itemId, direction) => {
    const images = announcements.find((a) => a.id === itemId)?.images || [];
    const newIndex =
      ((currentImageIndex[itemId] || 0) + direction + images.length) %
      images.length;

    flatListRefs.current[itemId]?.scrollToIndex({ index: newIndex });
    setCurrentImageIndex((prev) => ({ ...prev, [itemId]: newIndex }));
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#b30f1c" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const likedByUser = likes[item.id]?.some(
            (l) => l.userId === auth.currentUser?.uid
          );

          return (
            <View style={styles.postCard}>
              {/* Header */}
              <View style={styles.postHeader}>
                <Ionicons name="person-circle" size={42} color="#b30f1c" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.postAuthor}>{item.author}</Text>
                  <Text style={styles.postDate}>Official Announcement</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={20} color="#555" />
              </View>

              {/* Images */}
              {item.images?.length > 0 && (
                <Pressable
                  onPress={() => handleDoubleTap(item)}
                  style={{ position: "relative" }}
                >
                  <FlatList
                    ref={(ref) => (flatListRefs.current[item.id] = ref)}
                    data={item.images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, index) => index.toString()}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(
                        e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                      );
                      setCurrentImageIndex((prev) => ({
                        ...prev,
                        [item.id]: index,
                      }));
                    }}
                    renderItem={({ item: img }) => (
                      <View
                        style={{ width: SCREEN_WIDTH, alignItems: "center" }}
                      >
                        <Image source={{ uri: img }} style={styles.postImage} />
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.25)"]}
                          style={styles.imageOverlay}
                        />
                        {doubleTapHeart[item.id] && (
                          <Animatable.View
                            animation="zoomIn"
                            duration={500}
                            style={styles.heartOverlay}
                          >
                            <Ionicons name="heart" size={80} color="#fff" />
                          </Animatable.View>
                        )}
                      </View>
                    )}
                  />
                  {item.images.length > 1 && (
                    <>
                      <TouchableOpacity
                        style={[styles.navButton, { left: 8 }]}
                        onPress={() => scrollImage(item.id, -1)}
                      >
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.navButton, { right: 8 }]}
                        onPress={() => scrollImage(item.id, 1)}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={28}
                          color="#fff"
                        />
                      </TouchableOpacity>
                      <View style={styles.dotContainer}>
                        {item.images.map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.dot,
                              i === (currentImageIndex[item.id] || 0) &&
                                styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </Pressable>
              )}

              {/* Content */}
              <View style={styles.postContent}>
                <Text style={styles.likesCount}>
                  {likes[item.id]?.length ?? 0} likes
                </Text>
                <Text style={styles.postText} numberOfLines={3}>
                  <Text style={styles.postTextBold}>{item.author} </Text>
                  <Text style={styles.postTextMuted}>{item.content}</Text>
                </Text>
                <Pressable onPress={() => setSelected(item)}>
                  {comments.length > 0 && (
                    <Text style={styles.viewComments}>
                      View all {comments.length} comments
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* Reactions */}
              <View style={styles.reactionRow}>
                <Pressable
                  onPress={() => toggleLike(item)}
                  style={({ pressed }) => [
                    styles.reactionButton,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons
                    name={likedByUser ? "heart" : "heart-outline"}
                    size={22}
                    color={likedByUser ? "#b30f1c" : "#555"}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setSelected(item)}
                  style={({ pressed }) => [
                    styles.reactionButton,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons name="chatbubble-outline" size={22} color="#555" />
                </Pressable>
                <Pressable style={styles.reactionButton}>
                  <Ionicons name="bookmark-outline" size={22} color="#555" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Comment Modal */}
      {selected && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Announcement</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ref={(ref) => (flatListRefs.current["comments"] = ref)}
              keyboardShouldPersistTaps="handled"
            >
              {selected.images?.length > 0 && (
                <FlatList
                  ref={(ref) => (flatListRefs.current[selected.id] = ref)}
                  data={selected.images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => index.toString()}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                    );
                    setCurrentImageIndex((prev) => ({
                      ...prev,
                      [selected.id]: index,
                    }));
                  }}
                  renderItem={({ item: img }) => (
                    <Image
                      source={{ uri: img }}
                      style={[styles.modalImage, { width: SCREEN_WIDTH - 40 }]}
                    />
                  )}
                />
              )}

              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.modalBody}>{selected.content}</Text>
              </View>

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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  postCard: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  postHeader: { flexDirection: "row", alignItems: "center", padding: 12 },
  postAuthor: { fontWeight: "800", fontSize: 16, color: "#222" },
  postDate: { fontSize: 12, color: "#888", marginTop: 2 },
  postContent: { paddingHorizontal: 12, paddingBottom: 12 },
  postText: { fontSize: 14, color: "#333", textAlign: "justify" },
  postTextBold: { fontWeight: "700", color: "#222" },
  postTextMuted: { color: "#555" },
  likesCount: { fontWeight: "700", marginBottom: 4, color: "#b30f1c" },
  viewComments: { color: "#888", marginTop: 4 },

  postImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, resizeMode: "cover" },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  heartOverlay: {
    position: "absolute",
    top: "40%",
    left: "40%",
    justifyContent: "center",
    alignItems: "center",
  },

  reactionRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  reactionButton: { marginRight: 16 },
  navButton: {
    position: "absolute",
    top: "40%",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    width: "100%",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#888",
    marginHorizontal: 3,
  },
  activeDot: { backgroundColor: "#fff" },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "85%",
    borderRadius: 12,
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
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#b30f1c" },
  modalTextContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    color: "#222",
  },
  modalBody: { fontSize: 14, textAlign: "justify", color: "#555" },
  modalImage: { height: 220, marginVertical: 10},

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
});
