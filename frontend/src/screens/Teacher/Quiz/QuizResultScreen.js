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
  FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;

// Mock Data
const TOP_PERFORMERS = [
  { id: '1', name: 'Arjun', score: '20/20', rank: 1, color: '#ca8a04', bg: '#fefce8', border: '#fef08a' }, // Gold
  { id: '2', name: 'Fatima', score: '19/20', rank: 2, color: '#475569', bg: '#f8fafc', border: '#e2e8f0' }, // Silver
  { id: '3', name: 'Karan', score: '18/20', rank: 3, color: '#b45309', bg: '#fff7ed', border: '#ffedd5' }, // Bronze
  { id: '4', name: 'Priya', score: '17/20', rank: 4, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
];

const NEEDS_HELP = [
  { id: '1', name: 'Diya Singh', score: '8/20', percent: '40%' },
  { id: '2', name: 'Rohan Das', score: '6/20', percent: '30%' },
  { id: '3', name: 'Amit Patel', score: '5/20', percent: '25%' },
];

export default function QuizResultScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                source={{ uri: "https://i.pravatar.cc/150?img=5" }} 
                style={styles.profilePic} 
              />
              <View>
                <Text style={styles.teacherName}>Priya Sharma</Text>
                <Text style={styles.teacherCode}>T-2025-08</Text>
              </View>
              <View style={styles.classTag}>
                <Text style={styles.classTagText}>Class Teacher: 9-A</Text>
              </View>
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
              <Text style={styles.headerTitle}>Results: Math Test</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleSidebar}>
            <FontAwesome5 name="bars" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>CLASS AVERAGE</Text>
              <Text style={styles.summaryValue}>72%</Text>
              <View style={styles.trendRow}>
                <Text style={styles.trendText}>+5% vs Last Quiz</Text>
              </View>
            </View>

            {/* 2. Top Performers */}
            <Text style={styles.sectionTitle}>TOP PERFORMERS</Text>
            <View style={{ marginBottom: 24 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
                {TOP_PERFORMERS.map((student) => (
                  <View key={student.id} style={styles.rankCard}>
                    <View style={[styles.rankCircle, { backgroundColor: student.bg, borderColor: student.border }]}>
                      <Text style={[styles.rankText, { color: student.color }]}>{student.rank}</Text>
                    </View>
                    <Text style={styles.rankName}>{student.name}</Text>
                    <Text style={styles.rankScore}>{student.score}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 3. Needs Help */}
            <Text style={styles.sectionTitle}>NEEDS HELP ({'<'} 40%)</Text>
            <View style={styles.needsHelpList}>
              {NEEDS_HELP.map((student) => (
                <View key={student.id} style={styles.helpItem}>
                  <Text style={styles.helpName}>{student.name}</Text>
                  <Text style={styles.helpScore}>{student.score}</Text>
                </View>
              ))}
            </View>

          </View>
        </ScrollView>

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
  profileRow: {flexDirection: 'row',alignItems: 'center',gap: 12},
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  teacherCode: { fontSize: 12, color: '#64748b' },
  classTag: { marginTop: 0, alignSelf: 'flex-start',  backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 62 },
  classTagText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  sidebarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingHorizontal: 10 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

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
});