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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listenToAnnouncements } from "../../firebaseConfig";

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToAnnouncements((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
            onPress={() => setSelected(item)}
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
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🔍 Modal for full view */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selected?.image ? (
                <Image
                  source={{ uri: selected.image }}
                  style={styles.modalImage}
                />
              ) : null}
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <Text style={styles.modalSubtitle}>{selected?.subtitle}</Text>
              <Text style={styles.modalBody}>{selected?.content}</Text>
              <Text style={styles.modalAuthor}>— {selected?.author}</Text>

              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
  },

  /* 🔴 PRULIFE Header */
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
    boxShadow: "0px 8px 6px rgba(0, 0, 0, 0.2)",
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  brandTextContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#fff9",
    marginTop: -2,
  },
  /* 📜 Announcement Cards */
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  thumbnail: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  textContainer: {
    padding: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  content: {
    marginTop: 6,
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  author: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
    textAlign: "right",
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
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: 220,
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
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  modalAuthor: {
    fontSize: 13,
    color: "#777",
    textAlign: "right",
    marginTop: 14,
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: "#b30f1c",
    alignSelf: "center",
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
  },
  closeText: {
    color: "white",
    fontWeight: "600",
  },
});
