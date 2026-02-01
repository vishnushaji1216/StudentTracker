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
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../services/api";

const SIDEBAR_WIDTH = 280;

export default function StudentQuizResultScreen({ route, navigation }) {
  const { quizId } = route.params || {}; // Received from QuizPlayer or QuizCenter
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: "Student", class: "" });

  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // 1. Get Student Info
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setStudentInfo({ name: user.name, class: user.className });
      }

      // 2. Fetch specific submission for this quiz
      // We call the quiz list which already includes the score logic
      const res = await api.get("/student/quizzes");
      const quizData = res.data.find(q => q.id === quizId || q._id === quizId);

      if (quizData && quizData.status === "Completed") {
        // Calculate Accuracy & Correct/Wrong count
        // Note: For advanced breakdown (Correct/Wrong), you might need a dedicated submission detail endpoint
        const accuracy = Math.round((quizData.score / quizData.totalMarks) * 100);
        
        setResult({
          title: quizData.title,
          score: quizData.score,        // The Marks (e.g. 18)
          total: quizData.totalMarks,   // Total Marks (e.g. 20)
          accuracy: quizData.accuracy,
          correct: quizData.correctCount, // The Number of Questions (e.g. 9)
          wrong: quizData.totalQuestions - quizData.correctCount, // (e.g. 1)
        });
      } else {
        Alert.alert("Notice", "Result details not found.");
        navigation.navigate("StudentQuizCenter");
      }
    } catch (err) {
      console.error("Result fetch error:", err);
      Alert.alert("Error", "Could not load results.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (isSidebarOpen) {
      toggleSidebar();
      return true;
    }
    navigation.navigate('StudentQuizCenter');
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackNavigation);
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isOpen ? -SIDEBAR_WIDTH : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 0 : 0.5, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsSidebarOpen(!isOpen);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents={isSidebarOpen ? "auto" : "none"}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
         <View style={styles.sidebarContainer}>
            <View>
              <View style={styles.sidebarHeader}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>{studentInfo.name.substring(0,2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.sidebarTitle}>{studentInfo.name}</Text>
                  <Text style={styles.sidebarVersion}>Class {studentInfo.class}</Text>
                </View>
              </View>
              <ScrollView style={styles.menuScroll}>
                <SidebarItem icon="home" label="Home" onPress={() => navigation.navigate('StudentDash')} />
                <SidebarItem icon="list-check" label="Quiz Center" active onPress={toggleSidebar} />
              </ScrollView>
            </View>
         </View>
      </Animated.View>

      <View style={styles.mainContent}>
        <View style={styles.successContainer}>
            <View style={styles.trophyContainer}>
                <View style={styles.trophyCircle}>
                    <FontAwesome5 name="trophy" size={40} color="#facc15" />
                </View>
            </View>

            <Text style={styles.successTitle}>Quiz Completed!</Text>
            <Text style={styles.successSub}>{result?.title}</Text>

            <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                <Text style={styles.scoreValue}>{result?.score}<Text style={styles.scoreTotal}>/{result?.total}</Text></Text>
                
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumGreen}>{result?.correct}</Text>
                        <Text style={styles.statLabel}>CORRECT</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumRed}>{result?.wrong}</Text>
                        <Text style={styles.statLabel}>WRONG</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumSlate}>{result?.accuracy}</Text>
                        <Text style={styles.statLabel}>ACCURACY</Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('StudentDash')}>
                <Text style={styles.homeBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* --- SUB-COMPONENTS & STYLES (Keep existing sidebar/footer styles) --- */
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4f46e5" },
  mainContent: { flex: 1 },
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoBox: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuScroll: { marginTop: 20, flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 8 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  trophyContainer: { marginBottom: 24 },
  trophyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', elevation: 10 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#c7d2fe', marginBottom: 32 },
  scoreCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', elevation: 5 },
  scoreLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  scoreValue: { fontSize: 48, fontWeight: '900', color: '#4f46e5' },
  scoreTotal: { fontSize: 24, color: '#cbd5e1' },
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '100%', backgroundColor: '#f1f5f9' },
  statNumGreen: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  statNumRed: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  statNumSlate: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
  statLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginTop: 2 },
  footer: { padding: 24, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  homeBtn: { paddingVertical: 12, alignItems: 'center' },
  homeBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
});