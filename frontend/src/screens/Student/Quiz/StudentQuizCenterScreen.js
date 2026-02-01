import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  Dimensions,
  UIManager,
  FlatList,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../services/api";

/* ---------------- ANDROID ANIM ENABLE ---------------- */
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

/* ===================================================== */

export default function StudentQuizCenterScreen({ navigation }) {
  /* ---------------- SIDEBAR ---------------- */
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ---------------- STUDENT INFO ---------------- */
  const [studentName] = useState("Arjun");
  const [className] = useState("Class 9-A");

  /* ---------------- QUIZ STATE ---------------- */
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active");

  /* ---------------- FETCH QUIZZES ---------------- */
  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student/quizzes");
      console.log("Raw Data from Server:", res.data); // <--- Add this
  
      const formatted = res.data.map(q => {
        // FIX: Ensure status is never undefined and defaults to LIVE if it's an active quiz
        // Also check if your backend uses 'status' or 'releaseType'
        const rawStatus = q.status || (q.isTaken ? "COMPLETED" : "LIVE");
        
        return {
          id: q.id || q._id, // Support both id and _id
          title: q.title,
          subject: q.subject || "General",
          topic: q.topic || q.subject || "Quiz",
          duration: q.duration || "30 Mins",
          status: rawStatus.toUpperCase(), 
          totalQuestions: q.totalQuestions || 0,
          score: q.score,
          totalMarks: q.totalMarks,
          // ... rest of your code
        };
      });
  
      setQuizzes(formatted);
    } catch (err) {
      console.error("Quiz fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeQuizzes = quizzes.filter(q => q.status === "LIVE");
  const completedQuizzes = quizzes.filter(q => q.status === "COMPLETED");

  /* ---------------- BACK BUTTON ---------------- */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.navigate("StudentDash");
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    setIsSidebarOpen(!isOpen);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? -SIDEBAR_WIDTH : 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 0 : 0.5,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role"]);
  };

  /* ---------------- RENDER ITEMS ---------------- */
  const renderActiveItem = ({ item }) => {
    const isLive = item.status === "LIVE";
    const isUpcoming = item.status === "UPCOMING";
    const isExpired = item.status === "EXPIRED";
    const isCompleted = item.status === "COMPLETED";

    // Format Start Time for Upcoming quizzes
    const startTimeStr = item.startTime 
      ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : "";

    return (
      <View style={[
        styles.card, 
        isLive && styles.cardLive,
        isUpcoming && styles.cardUpcoming,
        isExpired && styles.cardExpired
      ]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={[styles.iconBox, { backgroundColor: item.bg || '#f1f5f9' }]}>
              <Text style={[styles.iconText, { color: item.color || '#64748b' }]}>
                {item.initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardSub}>
                {item.topic} • {item.duration}
              </Text>
            </View>
          </View>

          {/* DYNAMIC STATUS BADGE */}
          <View style={[
            styles.statusBadge,
            isLive && styles.liveBadge,
            isUpcoming && styles.upcomingBadge,
            isExpired && styles.expiredBadge
          ]}>
            <Text style={[
              styles.statusBadgeText,
              isLive && styles.liveText,
              isUpcoming && styles.upcomingText,
              isExpired && styles.expiredText
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FontAwesome5 
              name={isUpcoming ? "lock" : isExpired ? "calendar-times" : "clock"} 
              size={12} 
              color="#94a3b8" 
            />
            <Text style={styles.timerText}>
              {isUpcoming ? `Starts at ${startTimeStr}` : 
               isExpired ? "Deadline passed" : 
               `${item.totalQuestions} Questions`}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.startBtn, 
              (isUpcoming || isExpired) && styles.disabledBtn
            ]}
            onPress={() => {
              if (isLive) {
                navigation.navigate("QuizInstruction", { quizId: item.id });
              } else if (isUpcoming) {
                Alert.alert("Locked", "This quiz hasn't started yet.");
              } else {
                Alert.alert("Expired", "You missed the deadline for this quiz.");
              }
            }}
            disabled={isUpcoming || isExpired}
          >
            <Text style={styles.startBtnText}>
              {isUpcoming ? "Locked" : isExpired ? "Closed" : "Start Quiz"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCompletedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyCard}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate("StudentQuizResult", { quizId: item.id })
      }
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View style={[styles.iconBox, { backgroundColor: "#f1f5f9" }]}>
          <Text style={[styles.iconText, { color: "#64748b" }]}>
            {item.initials}
          </Text>
        </View>
        <View>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historySub}>{item.subject}</Text>
        </View>
      </View>
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>
          {item.score}/{item.totalMarks}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  /* ===================================================== */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* OVERLAY */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
            transform: [{ translateX: isSidebarOpen ? 0 : -width }]
          }
        ]}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={toggleSidebar} />
      </Animated.View>

      {/* SIDEBAR */}
      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
      >
        <SafeAreaView style={styles.sidebarSafeArea}>
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>AK</Text>
            </View>
            <View>
              <Text style={styles.sidebarName}>{studentName}</Text>
              <Text style={styles.sidebarClass}>{className}</Text>
            </View>
          </View>

          <ScrollView>
            <SidebarItem icon="home" label="Home" onPress={() => navigation.navigate("StudentDash")} />
            <SidebarItem icon="list-ol" label="Quiz Center" active />
          </ScrollView>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* MAIN */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar}>
            <FontAwesome5 name="bars" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Center</Text>
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "Active" && styles.tabBtnActive]}
            onPress={() => setActiveTab("Active")}
          >
            <Text style={styles.tabText}>
              Active ({activeQuizzes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "Completed" && styles.tabBtnActive]}
            onPress={() => setActiveTab("Completed")}
          >
            <Text style={styles.tabText}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <FlatList
          data={activeTab === "Active" ? activeQuizzes : completedQuizzes}
          renderItem={activeTab === "Active" ? renderActiveItem : renderCompletedItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No quizzes found</Text>
          }
        />
      </SafeAreaView>
    </View>
  );
}

/* ---------------- SIDEBAR ITEM ---------------- */
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
    <FontAwesome5
      name={icon}
      size={16}
      color={active ? "#4f46e5" : "#64748b"}
    />
    <Text style={styles.sidebarItemText}>{label}</Text>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#94a3b8", fontWeight: "bold" },

  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 11 },

  sidebarSafeArea: { flex: 1, padding: 20 },
  sidebarHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  avatarTextLarge: { fontWeight: "bold", color: "#4f46e5" },
  sidebarName: { fontWeight: "bold" },
  sidebarClass: { fontSize: 12, color: "#64748b" },

  sidebarItem: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  sidebarItemActive: { backgroundColor: "#eef2ff", borderRadius: 8 },
  sidebarItemText: { fontWeight: "600" },

  logoutBtn: { marginTop: 20, flexDirection: "row", gap: 10 },

  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },

  tabContainer: { flexDirection: "row", margin: 16, backgroundColor: "#f1f5f9", borderRadius: 12 },
  tabBtn: { flex: 1, padding: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff", borderRadius: 10 },
  tabText: { fontWeight: "bold" },

  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, margin: 16 },
  cardLive: { borderLeftWidth: 4, borderLeftColor: "#22c55e" },
  cardUpcoming: { borderLeftWidth: 4, borderLeftColor: "#4f46e5" },
  cardExpired: { borderLeftWidth: 4, borderLeftColor: "#ef4444", opacity: 0.8 },

  cardHeader: { flexDirection: "row", justifyContent: "space-between" },

  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  iconText: { fontWeight: "bold" },

  cardTitle: { fontWeight: "bold" },
  cardSub: { fontSize: 12, color: "#64748b" },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusBadgeText: { fontSize: 9, fontWeight: "bold" },

  liveBadge: { backgroundColor: "#f0fdf4", borderColor: "#dcfce7" },
  liveText: { color: "#16a34a" },

  upcomingBadge: { backgroundColor: "#eef2ff", borderColor: "#e0e7ff" },
  upcomingText: { color: "#4f46e5" },

  expiredBadge: { backgroundColor: "#fef2f2", borderColor: "#fee2e2" },
  expiredText: { color: "#ef4444" },

  footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  timerText: { fontSize: 10, color: "#94a3b8" },

  startBtn: { backgroundColor: "#4f46e5", padding: 8, borderRadius: 8 },
  startBtnText: { color: "#fff", fontWeight: "bold", fontSize: 10 },
  disabledBtn: { backgroundColor: "#e2e8f0", elevation: 0 },

  historyCard: { backgroundColor: "#fff", margin: 16, padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between" },
  historyTitle: { fontWeight: "bold" },
  historySub: { fontSize: 10, color: "#94a3b8" },

  scoreBadge: { backgroundColor: "#dcfce7", padding: 6, borderRadius: 6 },
  scoreText: { fontWeight: "bold", color: "#16a34a" }
});
