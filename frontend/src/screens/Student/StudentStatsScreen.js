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
  Dimensions,
  UIManager
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

export default function StudentStatsScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student Info (Mock)
  const [studentName, setStudentName] = useState("Arjun");
  const [className, setClassName] = useState("Class 9-A");

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.navigate('StudentDash');
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
      }),
    ]).start();
  };

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      // navigation.replace("Login", { skipAnimation: true });
      console.log("Logged out");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View
        style={[
          styles.overlay, 
          { 
            opacity: overlayAnim,
            transform: [{ translateX: isSidebarOpen ? 0 : -width }] 
          }
        ]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.sidebarSafeArea}>
            <View style={styles.sidebarContainer}>
                {/* Top Section (Header + Menu) */}
                <View style={styles.sidebarContentWrapper}>
                    <View style={styles.sidebarHeader}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>AK</Text>
                        </View>
                        <View>
                            <Text style={styles.sidebarName}>{studentName}</Text>
                            <Text style={styles.sidebarClass}>{className}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.menuScroll} contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                        <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
                        <SidebarItem icon="chart-bar" label="Academic Stats" active onPress={() => toggleSidebar()} />
                        <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')} />
                        
                        {/* <View style={styles.menuDivider} />
                        <Text style={styles.menuSectionLabel}>ACADEMICS</Text> */}
                        
                        <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')}/>
                        <SidebarItem icon="microphone" label="Daily Audio" onPress={() => handleNav('AudioRecorder')} />
                        <SidebarItem icon="bullhorn" label="Notice" onPress={() => handleNav('StudentNoticBoard')} />
                        
                        <View style={styles.menuDivider} />
                        <SidebarItem icon="question-circle" label="Help & Support" />
                    </ScrollView>
                </View>

                {/* Bottom Footer */}
                <View style={styles.sidebarFooter}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Academic Stats</Text>
          </View>
          {/* <View style={styles.termBadge}>
            <Text style={styles.termText}>Term 1</Text>
          </View> */}
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. OVERALL PERFORMANCE (Hero Graph) */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroLabel}>OVERALL AVERAGE</Text>
                  <Text style={styles.heroValue}>78%</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.heroLabel}>VS CLASS AVG</Text>
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendText}>+12%</Text>
                  </View>
                </View>
              </View>

              {/* Chart Area */}
              <View style={styles.chartContainer}>
                <Svg height="100%" width="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                  {/* Gradients */}
                  <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#818cf8" stopOpacity="0.2" />
                      <Stop offset="1" stopColor="#818cf8" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Grid Lines */}
                  <Line x1="0" y1="0" x2="300" y2="0" stroke="#f8fafc" strokeWidth="1" />
                  <Line x1="0" y1="50" x2="300" y2="50" stroke="#f8fafc" strokeWidth="1" />
                  <Line x1="0" y1="100" x2="300" y2="100" stroke="#f8fafc" strokeWidth="1" />

                  {/* Class Avg Line (Gray Dashed) */}
                  <Path 
                    d="M0,60 L150,55 L300,50" 
                    fill="none" 
                    stroke="#cbd5e1" 
                    strokeWidth="2" 
                    strokeDasharray="5,5"
                  />

                  {/* Student Line (Purple) */}
                  <Path 
                    d="M0,70 L150,50 L300,20 L300,100 L0,100 Z" 
                    fill="url(#grad)" 
                  />
                  <Path 
                    d="M0,70 L150,50 L300,20" 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="3" 
                  />
                  
                  {/* Data Points */}
                  <Circle cx="0" cy="70" r="3" fill="#4f46e5" />
                  <Circle cx="150" cy="50" r="3" fill="#4f46e5" />
                  <Circle cx="300" cy="20" r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />

                  {/* Tooltips */}
                  <SvgText x="135" y="40" fontSize="10" fill="#fff" fontWeight="bold" textAnchor="middle">68%</SvgText>
                  <SvgText x="280" y="10" fontSize="10" fill="#4f46e5" fontWeight="bold" textAnchor="end">78%</SvgText>
                </Svg>
              </View>

              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>Quiz 1</Text>
                <Text style={styles.chartLabel}>Mid-Term</Text>
                <Text style={styles.chartLabel}>Current</Text>
              </View>
            </View>

            {/* 2. SUBJECT PERFORMANCE */}
            <Text style={styles.sectionTitle}>SUBJECT PERFORMANCE</Text>
            
            <View style={styles.subjectList}>
              {/* Math */}
              <TouchableOpacity style={[styles.subjectCard, styles.cardLeftBorderBlue]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
                    <FontAwesome5 name="calculator" size={16} color="#4f46e5" />
                  </View>
                  <View>
                    <Text style={styles.subjectName}>Mathematics</Text>
                    <Text style={styles.teacherName}>Mrs. Priya Sharma</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.scoreText, { color: '#4f46e5' }]}>85%</Text>
                  <Text style={styles.gradeText}>GRADE A</Text>
                  <Text style={styles.trendTextSmall}>↑ 2%</Text>
                </View>
              </TouchableOpacity>

              {/* Science */}
              <TouchableOpacity style={[styles.subjectCard, styles.cardLeftBorderOrange]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                    <FontAwesome5 name="flask" size={16} color="#ea580c" />
                  </View>
                  <View>
                    <Text style={styles.subjectName}>Science</Text>
                    <Text style={styles.teacherName}>Mr. Rahul Verma</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.scoreText, { color: '#ea580c' }]}>55%</Text>
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>Needs Focus</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* English */}
              <TouchableOpacity style={[styles.subjectCard, styles.cardLeftBorderSky, { opacity: 0.9 }]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#f0f9ff' }]}>
                    <FontAwesome5 name="book" size={16} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.subjectName}>English</Text>
                    <Text style={styles.teacherName}>Mrs. Sarah J.</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.scoreText, { color: '#0284c7' }]}>72%</Text>
                  <Text style={styles.gradeText}>GRADE B</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 3. RECENT SCORES */}
            <Text style={styles.sectionTitle}>RECENT GRADED WORK</Text>
            <View style={styles.recentList}>
              
              <View style={styles.recentItem}>
                <View>
                  <Text style={styles.dateText}>Yesterday</Text>
                  <Text style={styles.taskName}>Math: Unit Test 4</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.scoreBadgeGreen}>
                    <Text style={styles.scoreBadgeTextGreen}>18/20</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" />
                </View>
              </View>

              <View style={styles.recentItem}>
                <View>
                  <Text style={styles.dateText}>3 Days Ago</Text>
                  <Text style={styles.taskName}>Science: Quiz 2</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.scoreBadgeOrange}>
                    <Text style={styles.scoreBadgeTextOrange}>4/10</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" />
                </View>
              </View>

            </View>

          </View>
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('StudentDash')}
          >
            <FontAwesome5 name="home" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('StudentProfile')}
          >
            <FontAwesome5 name="user" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <View style={{ width: 30, alignItems: 'center' }}>
        <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} />
    </View>
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 101, elevation: 20, shadowColor: "#000", shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  sidebarSafeArea: { flex: 1, backgroundColor: '#fff' },
  sidebarContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarContentWrapper: { flex: 1 }, 
  
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  avatarTextLarge: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  sidebarName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sidebarClass: { fontSize: 12, color: '#64748b' },
  
  menuScroll: { marginTop: 10 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, marginBottom: 2 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 8 },
  
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  termBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  termText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Hero Card */
  heroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2, marginBottom: 24 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
  heroValue: { fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
  trendBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendText: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  chartContainer: { height: 120, width: '100%', marginBottom: 12 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },

  /* Subject Cards */
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
  subjectList: { gap: 12, marginBottom: 24 },
  subjectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  cardLeftBorderBlue: { borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  cardLeftBorderOrange: { borderLeftWidth: 4, borderLeftColor: '#f97316' },
  cardLeftBorderSky: { borderLeftWidth: 4, borderLeftColor: '#0ea5e9' },
  
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subjectName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  teacherName: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  
  scoreText: { fontSize: 18, fontWeight: 'bold' },
  gradeText: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  trendTextSmall: { fontSize: 10, color: '#16a34a', marginTop: 2 },
  warningBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  warningText: { fontSize: 9, fontWeight: 'bold', color: '#ea580c' },

  /* Recent Work */
  recentList: { gap: 8 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  dateText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 2 },
  taskName: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  scoreBadgeGreen: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreBadgeTextGreen: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  scoreBadgeOrange: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreBadgeTextOrange: { fontSize: 14, fontWeight: 'bold', color: '#f97316' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});