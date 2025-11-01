import prulifeLogo from "../../assets/images/prulifeLogo.png";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../firebaseConfig";
import { router } from "expo-router";

export default function ProfilePage({ userData }) {
  const {
    fullname = "",
    email = "",
    birthdate = "",
    contactNumber = "",
    occupation = "",
    createdAt = "",
    pdfUrl = "",
    status = "",
  } = userData || {};

  const handleOpenPDF = async () => {
    if (!pdfUrl) return;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) await Linking.openURL(pdfUrl);
      else await Linking.openURL(pdfUrl + "?dl=1");
    } catch (err) {
      console.error("Cannot open PDF:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/signin");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const CardSection = ({ label, value }) => (
    <View style={styles.cardSection}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value || "-"}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image source={prulifeLogo} style={styles.avatar} />
          <Text style={styles.name}>{fullname || "Anonymous"}</Text>
          <Text style={styles.email}>{email || ""}</Text>
          {status ? (
            <View
              style={[
                styles.statusBadge,
                status === "approved" && { backgroundColor: "#d4edda" },
                status === "pending" && { backgroundColor: "#ffe3e3" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status === "approved" && { color: "green" },
                  status === "pending" && { color: "#b30f1c" },
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* User Info Cards */}
        <View style={styles.cardsContainer}>
          <CardSection label="Birthdate" value={formatDate(birthdate)} />
          <CardSection label="Contact Number" value={contactNumber} />
          <CardSection label="Occupation" value={occupation} />
          <CardSection label="Account Created" value={formatDate(createdAt)} />
        </View>

        {/* PDF Download */}
        <TouchableOpacity
          style={[styles.pdfButton, !pdfUrl && { opacity: 0.6 }]}
          onPress={handleOpenPDF}
          disabled={!pdfUrl}
        >
          <Text style={styles.pdfButtonText}>
            {pdfUrl ? "Download PDF" : "No PDF Available"}
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f6fa" },
  container: { padding: 16, paddingBottom: 40 },

  /* Header */
  header: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: "relative",
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 2 },
  email: { fontSize: 14, color: "#555", marginBottom: 8 },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusText: { fontWeight: "700", fontSize: 10 },

  /* Cards */
  cardsContainer: { marginBottom: 20 },
  cardSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardLabel: { fontSize: 12, color: "#888", marginBottom: 2 },
  cardValue: { fontSize: 15, fontWeight: "600", color: "#222" },

  /* Buttons */
  pdfButton: {
    backgroundColor: "#b30f1c",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#b30f1c",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pdfButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  logoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: { color: "#b30f1c", fontWeight: "700", fontSize: 15 },
});
