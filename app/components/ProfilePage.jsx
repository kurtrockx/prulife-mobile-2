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
import { auth } from "../../firebaseConfig"; // adjust path
import { router } from "expo-router"; // if using Expo Router

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
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        await Linking.openURL(pdfUrl + "?dl=1");
      }
    } catch (error) {
      console.error("Cannot open PDF:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/signin"); // adjust route as needed
    } catch (error) {
      console.error("Logout failed:", error);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={prulifeLogo}
          style={{
            width: 80,
            height: 80,
            alignSelf: "center",
            marginVertical: 10,
            resizeMode: "contain",
          }}
        />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{fullname || "-"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email || "-"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Birthdate</Text>
          <Text style={styles.value}>{formatDate(birthdate)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Contact Number</Text>
          <Text style={styles.value}>{contactNumber || "-"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Occupation</Text>
          <Text style={styles.value}>{occupation || "-"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Account Created</Text>
          <Text style={styles.value}>{formatDate(createdAt)}</Text>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text
            style={[
              styles.statusValue,
              status === "pending" && { color: "#b30f1c" },
              status === "approved" && { color: "green" },
            ]}
          >
            {status ? status.toUpperCase() : "-"}
          </Text>
        </View>

        {/* PDF */}
        <TouchableOpacity
          style={[styles.pdfButton, !pdfUrl && { opacity: 0.5 }]}
          onPress={handleOpenPDF}
          disabled={!pdfUrl}
        >
          <Text style={styles.pdfButtonText}>
            {pdfUrl ? "Download PDF" : "No PDF Available"}
          </Text>
        </TouchableOpacity>

        {/* Logout Button at the bottom */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#b30f1c",
    borderRadius: 10,
    marginBottom: 20,
  },
  headerTitle: { color: "white", fontSize: 24, fontWeight: "bold" },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 15 },
  label: { fontSize: 14, color: "#888", marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "600", color: "#000" },
  pdfButton: {
    backgroundColor: "#b30f1c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
    marginVertical: 20,
  },
  pdfButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  statusLabel: { fontSize: 16, fontWeight: "600", marginRight: 8 },
  statusValue: { fontSize: 18, fontWeight: "bold" },
  logoutBtn: {
    backgroundColor: "#f2a1a1",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  logoutText: { color: "white", fontWeight: "600", fontSize: 16 },
});
