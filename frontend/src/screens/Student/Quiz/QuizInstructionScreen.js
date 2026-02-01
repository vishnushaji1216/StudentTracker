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
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../services/api";

const SIDEBAR_WIDTH = 280;

export default function QuizInstructionScreen({ route, navigation }) {
  const { quizId } = route.params || {}; // Received from Quiz Center
  
  const [loading, setLoading] = useState(true);
  const [quizDetails, setQuizDetails] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: "Student", class: "" });

  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [quizId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Student Info from Storage
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setStudentInfo({ name: user.name, class: user.className });
      }

      // 2. Fetch Quiz Details
      // We use the same route used for the player to get metadata
      const res = await api.get(`/student/quiz/${quizId}`);
      
      // Since we need the deadline/duration from the Assignment model, 
      // the getAvailableQuizzes endpoint is usually better for metadata.
      // Let's assume the response contains the necessary fields.
      setQuizDetails(res.data);
      
    } catch (err) {
      console.error("Load Error:", err);
      Alert.alert("Error", "Could not load quiz details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.goBack();
      return true;
    });
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

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role"]);
    navigation.replace("Login");
  };

  const startQuiz = () => {
    navigation.navigate('QuizPlayer', { quizId: quizId });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={isSidebarOpen ? "auto" : "none"}
      >
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

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem icon="home" label="Home" onPress={() => navigation.navigate('StudentDash')} />
              <SidebarItem icon="list-check" label="Quiz Center" active onPress={toggleSidebar} />
            </ScrollView>
          </View>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Instruction</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. Dynamic Quiz Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardDecoration} />
              
              <View style={styles.iconCircle}>
                <FontAwesome5 name="file-alt" size={24} color="#4f46e5" />
              </View>
              
              <Text style={styles.quizTitle}>{quizDetails?.title || "Quiz"}</Text>
              <Text style={styles.quizTopic}>Class {studentInfo.class} • Official Test</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>TIME</Text>
                  <Text style={styles.statValue}>
                    <FontAwesome5 name="clock" size={12} color="#6366f1" /> {quizDetails?.duration || "30"}m
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>QUESTIONS</Text>
                  <Text style={styles.statValue}>{quizDetails?.questions?.length || 0}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>MARKS</Text>
                  <Text style={styles.statValue}>{quizDetails?.totalMarks || 0}</Text>
                </View>
              </View>
            </View>

            {/* 2. Instructions (Static content preserved) */}
            <Text style={styles.sectionTitle}>IMPORTANT INSTRUCTIONS</Text>
            
            <View style={styles.instructionList}>
              <View style={styles.instructionItem}>
                <View style={styles.numberBadge}><Text style={styles.numberText}>1</Text></View>
                <View style={{flex: 1}}>
                  <Text style={styles.instructionTitle}>No Going Back</Text>
                  <Text style={styles.instructionDesc}>Once you answer a question and move next, you cannot return to change it.</Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.numberBadge}><Text style={styles.numberText}>2</Text></View>
                <View style={{flex: 1}}>
                  <Text style={styles.instructionTitle}>Do Not Switch Apps</Text>
                  <Text style={styles.instructionDesc}>Leaving the app may automatically submit your quiz.</Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.numberBadge}><Text style={styles.numberText}>3</Text></View>
                <View style={{flex: 1}}>
                  <Text style={styles.instructionTitle}>Auto-Submit</Text>
                  <Text style={styles.instructionDesc}>The quiz will automatically submit when the timer reaches zero.</Text>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>

        {/* Footer Action */}
        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={styles.startBtn}
            onPress={startQuiz}
            activeOpacity={0.9}
          >
            <Text style={styles.startBtnText}>Start Quiz Now</Text>
            <FontAwesome5 name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoBox: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuScroll: { marginTop: 20, flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 8 },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, width: '100%' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  scrollContent: { flex: 1, backgroundColor: '#f8fafc' },
  contentPadding: { padding: 20 },
  infoCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', overflow: 'hidden', elevation: 1 },
  cardDecoration: { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderBottomLeftRadius: 40, backgroundColor: '#eef2ff' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e0e7ff', borderWidth: 4, borderColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  quizTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4, textAlign: 'center' },
  quizTopic: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statsGrid: { flexDirection: 'row', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f8fafc', width: '100%', justifyContent: 'center', gap: 16 },
  statCol: { alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  divider: { width: 1, height: '80%', backgroundColor: '#f1f5f9' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16, marginLeft: 4 },
  instructionList: { gap: 16 },
  instructionItem: { flexDirection: 'row', gap: 16 },
  numberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  numberText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  instructionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 2 },
  instructionDesc: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  footerContainer: { backgroundColor: '#fff', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 16, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});