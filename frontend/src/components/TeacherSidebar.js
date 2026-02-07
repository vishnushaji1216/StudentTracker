import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const SIDEBAR_WIDTH = 280;
const { height } = Dimensions.get("window");

export default function TeacherSidebar({ isOpen, onClose, navigation, activeItem }) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [profile, setProfile] = useState({
    name: "Teacher",
    teacherCode: "...",
    classTeachership: ""
  });

  /* ---------------- Animations ---------------- */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  /* ---------------- Load Profile ---------------- */
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      const response = await api.get("/teacher/profile");
      setProfile(response.data);
      await AsyncStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setProfile(JSON.parse(storedUser));
      }
    }
  };

  const handleNav = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role"]);
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayAnim, transform: [{ translateX: isOpen ? 0 : -1000 }] },
        ]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.profileRow}>
                <Image
                  source={{
                    uri:
                      "https://ui-avatars.com/api/?background=eef2ff&color=4f46e5&name=" +
                      profile.name,
                  }}
                  style={styles.profilePic}
                />
                <View>
                  <Text style={styles.teacherName} numberOfLines={1}>
                    {profile.name}
                  </Text>
                  <Text style={styles.teacherCode}>{profile.teacherCode}</Text>
                </View>
              </View>

              {profile.classTeachership ? (
                <View style={styles.classTag}>
                  <Text style={styles.classTagText}>
                    Class Teacher: {profile.classTeachership}
                  </Text>
                </View>
              ) : (
                <View style={[styles.classTag, { backgroundColor: "#f1f5f9" }]}>
                  <Text style={[styles.classTagText, { color: "#64748b" }]}>
                    Subject Teacher
                  </Text>
                </View>
              )}
            </View>

            {/* Menu */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem
                icon="chart-pie"
                label="Dashboard"
                onPress={() => handleNav("TeacherDash")}
                active={activeItem === "TeacherDash"}
              />

              {/* 🔥 CONDITIONAL: ONLY FOR CLASS TEACHERS */}
              {profile.classTeachership ? (
                <SidebarItem
                  icon="money-check-alt"
                  label="Fee Status"
                  onPress={() => handleNav("TeacherFeeStatus")}
                  active={activeItem === "TeacherFeeStatus"}
                />
              ) : null}

              <SidebarItem
                icon="calendar-check"
                label="Daily Tasks"
                onPress={() => handleNav("DailyTask")}
                active={activeItem === "DailyTask"}
              />
              <SidebarItem
                icon="chalkboard-teacher"
                label="My Classes"
                onPress={() => handleNav("MyClasses")}
                active={activeItem === "MyClasses"}
              />
              <SidebarItem
                icon="users"
                label="Student Directory"
                onPress={() => handleNav("StudentDirectory")}
                active={activeItem === "StudentDirectory"}
              />

              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>CONTENT & GRADING</Text>

              <SidebarItem
                icon="clipboard-list"
                label="Gradebook"
                onPress={() => handleNav("TeacherGradebook")}
                active={activeItem === "TeacherGradebook"}
              />
              <SidebarItem
                icon="list-ul"
                label="Quiz Manager"
                onPress={() => handleNav("QuizDashboard")}
                active={activeItem === "QuizDashboard"}
              />
              <SidebarItem
                icon="pen-fancy"
                label="Handwriting Review"
                onPress={() => handleNav("HandwritingReview")}
                active={activeItem === "HandwritingReview"}
              />
              <SidebarItem
                icon="headphones"
                label="Audio Review"
                onPress={() => handleNav("AudioReview")}
                active={activeItem === "AudioReview"}
              />
              <SidebarItem
                icon="bullhorn"
                label="Notice Board"
                onPress={() => handleNav("NoticeBoard")}
                active={activeItem === "NoticeBoard"}
              />
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => handleNav("TeacherSetting")}
            >
              <FontAwesome5 name="cog" size={16} color="#64748b" />
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

/* ---------------- Sidebar Item ---------------- */
const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
    <FontAwesome5
      name={icon}
      size={16}
      color={active ? "#4f46e5" : "#64748b"}
      style={{ width: 24, textAlign: "center", marginRight: 10 }}
    />
    <Text
      style={[
        styles.sidebarItemText,
        active && { color: "#4f46e5", fontWeight: "700" },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 50,
    height,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    zIndex: 51,
    elevation: 20,
    height,
  },
  sidebarContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  sidebarHeader: {
    marginBottom: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
  },
  teacherName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  teacherCode: { fontSize: 12, color: "#64748b" },
  classTag: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 62,
  },
  classTagText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4f46e5",
    textTransform: "uppercase",
  },
  menuScroll: { marginTop: 10, flex: 1 },
  menuDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 10 },
  menuSectionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 8,
    marginLeft: 12,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  sidebarItemActive: { backgroundColor: "#eef2ff" },
  sidebarItemText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  sidebarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  settingsBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  logoutBtn: { padding: 8, backgroundColor: "#fef2f2", borderRadius: 8 },
});
