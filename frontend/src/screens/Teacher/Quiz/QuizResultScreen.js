import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform,
  LayoutAnimation,
  UIManager,
  FlatList,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../services/api";

const SIDEBAR_WIDTH = 280;

export default function QuizResultScreen({ route, navigation }) {
  const { quizId, quizTitle } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState({ name: "Teacher", code: "", class: "" });

  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Teacher Info from Storage
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setTeacherInfo({ 
          name: user.name || "Teacher", 
          code: user.teacherCode || "",
          class: user.classTeachership || ""
        });
      }

      // 2. Fetch Analytics
      const res = await api.get(`/teacher/quizzes/${quizId}/analytics`);
      setAnalytics(res.data);

    } catch (err) {
      console.error("Analytics fetch error:", err);
      Alert.alert("Error", "Could not load quiz analytics.");
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

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

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

      {/* --- SIDEBAR DRAWER (Z-Index 51) --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View style={{ flex: 1 }}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <Image 
                source={{ uri: `https://ui-avatars.com/api/?name=${teacherInfo.name}&background=eef2ff&color=4f46e5` }} 
                style={styles.profilePic} 
              />
              <View>
                <Text style={styles.teacherName}>{teacherInfo.name}</Text>
                <Text style={styles.teacherCode}>{teacherInfo.code}</Text>
              </View>
              {teacherInfo.class ? (
                <View style={styles.classTag}>
                  <Text style={styles.classTagText}>Class Teacher: {teacherInfo.class}</Text>
                </View>
              ) : null}
            </View>

            {/* Navigation Items (Corrected Teacher Menu) */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem 
                icon="chart-pie" 
                label="Dashboard" 
                onPress={() => handleNav('TeacherDash')}
              />
              <SidebarItem 
                icon="calendar-check" 
                label="Daily Tasks" 
                onPress={() => handleNav('DailyTask')}
              />
              <SidebarItem 
                icon="chalkboard-teacher" 
                label="My Classes" 
                onPress={() => handleNav('MyClasses')}
              />
              <SidebarItem 
                icon="users" 
                label="Student Directory" 
                onPress={() => handleNav('StudentDirectory')}
              />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>CONTENT & GRADING</Text>

              <SidebarItem 
                icon="list-ul" 
                label="Quiz Manager" 
                onPress={() => handleNav('QuizDashboard')}
                active={true}
              />
              <SidebarItem 
                icon="pen-fancy" 
                label="Handwriting Review" 
                onPress={() => handleNav('HandwritingReview')}
              />
              <SidebarItem 
                icon="headphones" 
                label="Audio Review" 
                onPress={() => handleNav('AudioReview')}
              />
              <SidebarItem 
                icon="bullhorn" 
                label="Notice Board" 
                onPress={() => handleNav('NoticeBoard')}
              />
              <SidebarItem 
                icon="folder-open" 
                label="Resource Library" 
                onPress={() => handleNav('ResourceLibrary')}
              />

              <View style={styles.menuDivider} />
              <SidebarItem icon="question-circle" label="Help & Support" />
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => handleNav('TeacherSetting')}>
              <FontAwesome5 name="cog" size={16} color="#64748b" />
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
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
              <FontAwesome5 name="arrow-left" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{analytics?.title || quizTitle || "Quiz Results"}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleSidebar}>
            <FontAwesome5 name="bars" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={{ marginTop: 12, color: '#64748b' }}>Loading Analytics...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={{ paddingBottom: 100 }} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentPadding}>
              
              {/* 1. Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>CLASS AVERAGE</Text>
                <Text style={styles.summaryValue}>{analytics?.stats?.classAvg || "0%"}</Text>
                <View style={styles.trendRow}>
                  <Text style={styles.trendText}>
                    {analytics?.stats?.submittedCount || 0} / {analytics?.stats?.totalStudents || 0} Students Submitted
                  </Text>
                </View>
              </View>

              {/* 2. Top Performers */}
              <Text style={styles.sectionTitle}>TOP PERFORMERS</Text>
              <View style={{ marginBottom: 24 }}>
                {analytics?.topPerformers?.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
                    {analytics.topPerformers.map((student, index) => (
                      <View key={student.id || index} style={styles.rankCard}>
                        <View style={[styles.rankCircle, { backgroundColor: student.bg, borderColor: student.border }]}>
                          <Text style={[styles.rankText, { color: student.color }]}>{student.rank || (index + 1)}</Text>
                        </View>
                        <Text style={styles.rankName} numberOfLines={1}>{student.name}</Text>
                        <Text style={styles.rankScore}>{student.score}</Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No submissions yet.</Text>
                  </View>
                )}
              </View>

              {/* 3. Needs Help */}
              <Text style={styles.sectionTitle}>NEEDS HELP ({'<'} 40%)</Text>
              <View style={styles.needsHelpList}>
                {analytics?.needsHelp?.length > 0 ? (
                  analytics.needsHelp.map((student, index) => (
                    <View key={student.id || index} style={styles.helpItem}>
                      <Text style={styles.helpName}>{student.name}</Text>
                      <Text style={styles.helpScore}>{student.score} ({student.percent})</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.helpEmpty}>
                    <Text style={styles.helpEmptyText}>All students above threshold!</Text>
                  </View>
                )}
              </View>

            </View>
          </ScrollView>
        )}

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="list-ul" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDirectory')}>
            <FontAwesome5 name="users" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Students</Text>
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

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarHeader: { marginBottom: 10,paddingBottom: 20,borderBottomWidth: 1, borderBottomColor: '#F1F5F9',flexDirection: 'column', gap: 12},
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  teacherCode: { fontSize: 12, color: '#64748b' },
  classTag: { alignSelf: 'flex-start',  backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  classTagText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 8 },
  sidebarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  /* Content */
  scrollContent: { flex: 1, backgroundColor: '#fff' },
  contentPadding: { padding: 20 },

  /* Summary Card */
  summaryCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: '#4f46e5' },
  trendRow: { marginTop: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  /* Section Title */
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', marginLeft: 4, letterSpacing: 0.5 },

  /* Top Performers */
  rankCard: { alignItems: 'center', marginRight: 16, width: 80 },
  rankCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  rankText: { fontSize: 16, fontWeight: 'bold' },
  rankName: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 2 },
  rankScore: { fontSize: 10, color: '#94a3b8' },

  /* Needs Help List */
  needsHelpList: { gap: 8 },
  helpItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' },
  helpName: { fontSize: 12, fontWeight: 'bold', color: '#991b1b' },
  helpScore: { fontSize: 12, fontWeight: 'bold', color: '#dc2626' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  /* Empty States */
  emptyCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  helpEmpty: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bcf0da' },
  helpEmptyText: { color: '#16a34a', fontSize: 12, fontWeight: 'bold' },
});