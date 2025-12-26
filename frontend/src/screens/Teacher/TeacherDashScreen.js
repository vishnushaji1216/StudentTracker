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
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;
const { width } = Dimensions.get('window');

export default function TeacherDashScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? -SIDEBAR_WIDTH : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 0 : 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
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

  const switchView = (viewName) => {
    setActiveView(viewName);
    toggleSidebar(); // Close sidebar on selection
  };

  // Donut Chart Calc
  const donutSize = 100;
  const strokeWidth = 10;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.6; // 18/30

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY (Z-Index 50) --- */}
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
                active={true} // <--- THIS IS THE DASHBOARD, SO IT IS ACTIVE
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
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          {/* <View style={styles.bellContainer}>
            <FontAwesome5 name="bell" size={20} color="#475569" />
            <View style={styles.bellBadge} />
          </View> */}
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 120 }} // Padding for bottom nav
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. HERO: CLASS PERFORMANCE GRAPH */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>CLASS 9-A PERFORMANCE</Text>
                  <View style={styles.heroStatsRow}>
                    <Text style={styles.heroScore}>78%</Text>
                    <View style={styles.heroTrend}>
                      <FontAwesome5 name="arrow-up" size={10} color="#16a34a" />
                      <Text style={styles.heroTrendText}>+4.2%</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreBtn}>
                  <FontAwesome5 name="ellipsis-h" size={14} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Chart Area */}
              <View style={styles.chartContainer}>
                <Svg height="100%" width="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#4f46e5" stopOpacity="0.2" />
                      <Stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Grid Lines */}
                  <Line x1="0" y1="0" x2="300" y2="0" stroke="#f8fafc" strokeWidth="1" />
                  <Line x1="0" y1="50" x2="300" y2="50" stroke="#f8fafc" strokeWidth="1" />
                  <Line x1="0" y1="100" x2="300" y2="100" stroke="#f8fafc" strokeWidth="1" />

                  {/* Path: 60 -> 40 -> 20 (Y-coordinates inverted for SVG) */}
                  <Path 
                    d="M0,60 Q75,55 150,40 T300,20 L300,100 L0,100 Z" 
                    fill="url(#grad)" 
                  />
                  <Path 
                    d="M0,60 Q75,55 150,40 T300,20" 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="3" 
                  />
                  
                  {/* Data Points with Labels */}
                  <Circle cx="0" cy="60" r="3" fill="#4f46e5" />
                  <SvgText x="5" y="50" fontSize="10" fill="#4f46e5" fontWeight="bold">65%</SvgText>
                  
                  <Circle cx="150" cy="40" r="3" fill="#4f46e5" />
                  <SvgText x="150" y="30" fontSize="10" fill="#4f46e5" fontWeight="bold" textAnchor="middle">68%</SvgText>

                  <Circle cx="300" cy="20" r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
                  <SvgText x="290" y="10" fontSize="10" fill="#4f46e5" fontWeight="bold" textAnchor="end">78%</SvgText>
                </Svg>
              </View>

              {/* X-Axis Labels */}
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>Quiz 1</Text>
                <Text style={styles.chartLabel}>Mid-Term</Text>
                <Text style={styles.chartLabel}>Current</Text>
              </View>
            </View>

            {/* 2. SECONDARY: AUDIO TARGET */}
            <View style={styles.secondaryCard}>
              <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
                <Text style={styles.cardSubtitle}>DAILY TASK: AUDIO</Text>
                <View style={styles.timeRow}>
                  <FontAwesome5 name="clock" size={10} color="#818cf8" />
                  <Text style={styles.timeText}>Resets in 04h</Text>
                </View>
                
                <View style={styles.miniStatsRow}>
                  <View>
                    <Text style={styles.miniLabel}>PENDING</Text>
                    <Text style={styles.miniValueRed}>12</Text>
                  </View>
                  <View style={{ width: 1, height: 20, backgroundColor: '#e2e8f0' }} />
                  <View>
                    <Text style={styles.miniLabel}>AVG</Text>
                    <Text style={styles.miniValue}>78%</Text>
                  </View>
                </View>
              </View>

              {/* Donut Chart */}
              <View style={{ width: donutSize, height: donutSize, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={donutSize} height={donutSize}>
                  <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#E0E7FF" strokeWidth={strokeWidth} fill="transparent" />
                  <Circle
                    cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#4F46E5" strokeWidth={strokeWidth}
                    strokeDasharray={[circumference]} strokeDashoffset={circumference * (1 - progress)} strokeLinecap="round" fill="transparent" rotation="-90" origin={`${donutSize / 2}, ${donutSize / 2}`}
                  />
                </Svg>
                <View style={styles.donutInner}>
                  <Text style={styles.donutText}>18<Text style={styles.donutSub}>/30</Text></Text>
                </View>
              </View>
            </View>

            {/* 3. ATTENTION NEEDED */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ATTENTION NEEDED</Text>
                <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
              </View>
              
              <View style={styles.alertCard}>
                <TouchableOpacity style={styles.alertItem}>
                  <View style={[styles.alertIconBox, { backgroundColor: '#fef2f2' }]}>
                    <FontAwesome5 name="microphone-slash" size={14} color="#ef4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>Missed Audio</Text>
                    <Text style={styles.alertSub}>Today's Submission</Text>
                  </View>
                  <View style={[styles.alertBadge, { backgroundColor: '#ef4444' }]}>
                    <Text style={styles.alertBadgeText}>12</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={10} color="#cbd5e1" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.alertItem, { borderBottomWidth: 0 }]}>
                  <View style={[styles.alertIconBox, { backgroundColor: '#fff7ed' }]}>
                    <FontAwesome5 name="pen-fancy" size={14} color="#f97316" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>Weekly Review</Text>
                    <Text style={styles.alertSub}>5 Handwriting Checks</Text>
                  </View>
                  <View style={[styles.alertBadge, { backgroundColor: '#f97316' }]}>
                    <Text style={styles.alertBadgeText}>5</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={10} color="#cbd5e1" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. QUICK ACTIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
              <View style={styles.actionGrid}>
                <ActionBtn label="Create Quiz" icon="plus-circle" color="#4f46e5" bg="#eef2ff" onPress={() => handleNav('QuizDashboard')} />
                {/* <ActionBtn label="Upload Note" icon="cloud-upload-alt" color="#9333ea" bg="#faf5ff" /> */}
                {/* <ActionBtn label="Log Behavior" icon="star" color="#d97706" bg="#fffbeb" /> */}
                <ActionBtn label="Broadcast" icon="bullhorn" color="#db2777" bg="#fce7f3" onPress={() => handleNav('NoticeBoard')} />
              </View>
            </View>

          </View>
        </ScrollView>

        {/* FIXED BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color={activeView === 'dashboard' ? "#4f46e5" : "#94a3b8"} />
            <Text style={[styles.navLabel, activeView === 'dashboard' && { color: '#4f46e5' }]}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyClasses')}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color={activeView === 'MyClasses' ? "#4f46e5" : "#94a3b8"} />
            <Text style={[styles.navLabel, activeView === 'MyClasses' && { color: '#4f46e5' }]}>Classes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDirectory')}>
            <FontAwesome5 name="users" size={20} color={activeView === 'StudentDirectory' ? "#4f46e5" : "#94a3b8"} />
            <Text style={[styles.navLabel, activeView === 'StudentDirectory' && { color: '#4f46e5' }]}>Students</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */

const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

const ActionBtn = ({ label, icon, color, bg }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]}>
    <FontAwesome5 name={icon} size={20} color={color} style={{ marginBottom: 8 }} />
    <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
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
  bellContainer: { position: 'relative' },
  bellBadge: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* 1. Hero Card */
  heroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2, marginBottom: 20 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  heroScore: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroTrend: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  heroTrendText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },
  moreBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 },
  chartContainer: { height: 100, width: '100%', marginBottom: 12 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },

  /* 2. Secondary Card (Donut) */
  secondaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  miniStatsRow: { flexDirection: 'row', gap: 16 },
  miniLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8' },
  miniValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  miniValueRed: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' },
  donutInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  donutText: { fontSize: 20, fontWeight: 'bold', color: '#4f46e5' },
  donutSub: { fontSize: 12, color: '#cbd5e1' },

  /* 3. Alerts */
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  viewAllText: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },
  alertCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  alertItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  alertIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  alertSub: { fontSize: 11, color: '#64748b' },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  alertBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  /* 4. Actions */
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: { width: '48%', padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  actionBtnText: { fontSize: 12, fontWeight: 'bold' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});