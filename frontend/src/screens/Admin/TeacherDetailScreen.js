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
  UIManager
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Svg, { Path, Circle, Line } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;

export default function TeacherDetailScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Accordion State for Subject Classes
  const [expandedCards, setExpandedCards] = useState({
    '10-B': false, // Initially collapsed
    '10-C': false, // Initially collapsed
  });

  // --- NAVIGATION FIX ---
  // Force back button to go to TeacherRegistry
  const handleBackNavigation = () => {
    if (isSidebarOpen) {
      toggleSidebar();
      return true;
    }
    // Explicitly navigate to the registry
    navigation.navigate('TeacherRegistry');
    return true;
  };

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackNavigation
    );
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

  const toggleAccordion = (classId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
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

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View>
            <View style={styles.sidebarHeader}>
              <View style={styles.logoBox}><Text style={styles.logoText}>S</Text></View>
              <View>
                <Text style={styles.sidebarTitle}>Stella Admin</Text>
                <Text style={styles.sidebarVersion}>v5.0.0</Text>
              </View>
            </View>

            {/* Navigation Items */}
            <View style={styles.menuSection}>
              <SidebarItem 
                icon="chart-pie" 
                label="Dashboard" 
                onPress={() => { toggleSidebar(); navigation.navigate('AdminDash'); }} 
              />
              <SidebarItem 
                icon="user-plus" 
                label="Add User" 
                onPress={() => { toggleSidebar(); navigation.navigate('AddUser'); }} 
              />
              <SidebarItem 
                icon="list-ul" 
                label="Teacher Registry" 
                onPress={() => { toggleSidebar(); navigation.navigate('TeacherRegistry'); }} 
                active // Keep this active if we consider details part of registry flow
              />
              <SidebarItem 
                icon="list-ul" 
                label="Student Registry" 
                onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry'); }} 
              />
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" />
              <SidebarItem icon="shield-alt" label="Security" />
            </View>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn}>
                <FontAwesome5 name="cog" size={16} color="#64748b" />
                <Text style={styles.settingsText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header - Uses custom back handler */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={handleBackNavigation}>
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Teacher Profile</Text>
          </View>
          <TouchableOpacity onPress={toggleSidebar}>
            <FontAwesome5 name="bars" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* 1. Profile Identity */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.avatar} />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.profileName}>Priya Sharma</Text>
              <Text style={styles.profileCode}>Code: T-2025-08</Text>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>Class 9-A</Text>
              </View>
            </View>
          </View>

          {/* 2. Teacher Ranking Card */}
          <View style={styles.rankCard}>
            <View style={styles.rankHeader}>
              <View>
                <Text style={styles.rankLabel}>GLOBAL PERFORMANCE</Text>
                <Text style={styles.rankValue}>70.6%</Text>
                <Text style={styles.rankSub}>Avg across all 3 subjects</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.trophyCircle}>
                  <FontAwesome5 name="trophy" size={14} color="#facc15" />
                </View>
                <Text style={styles.rankPosition}>Rank #3</Text>
                <Text style={styles.rankTotal}>of 42 Teachers</Text>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={styles.rankBarBg}>
              <View style={[styles.rankBarFill, { width: '92%' }]} />
            </View>
            <Text style={styles.rankFooter}>Top 10% Faculty</Text>
          </View>

          {/* 3. Academic Trajectory Graph */}
          <View style={styles.graphCard}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome5 name="chart-line" size={14} color="#6366f1" />
                <Text style={styles.cardTitle}>CLASS 9-A GRADES</Text>
              </View>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>Improving</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              {/* SVG Chart */}
              <Svg height="100%" width="100%" viewBox="0 0 320 120">
                {/* Grid Lines */}
                <Line x1="0" y1="20" x2="320" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <Line x1="0" y1="60" x2="320" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <Line x1="0" y1="100" x2="320" y2="100" stroke="#f1f5f9" strokeWidth="1" />

                {/* The Curve: 65% -> 68% -> 72% mapped to Y coordinates */}
                <Path 
                  d="M20,80 L160,70 L300,50" 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                />
                
                {/* Data Points & Labels */}
                <Circle cx="20" cy="80" r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
                
                <Circle cx="160" cy="70" r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
                
                <Circle cx="300" cy="50" r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
              </Svg>

              {/* Absolute Labels for Crisp Text */}
              <View style={[styles.dataLabel, { top: 55, left: 0 }]}>
                <Text style={styles.dataLabelText}>65%</Text>
              </View>
              <View style={[styles.dataLabel, { top: 45, left: '45%' }]}>
                <Text style={styles.dataLabelText}>68%</Text>
              </View>
              <View style={[styles.dataLabel, { top: 25, right: 0 }]}>
                <Text style={styles.dataLabelText}>72%</Text>
              </View>
            </View>

            {/* X-Axis */}
            <View style={styles.xAxis}>
              <Text style={styles.axisText}>Unit 1</Text>
              <Text style={styles.axisText}>Mid-Term</Text>
              <Text style={styles.axisText}>Unit 2</Text>
            </View>
          </View>

          {/* 4. Academic Progress (Accordion Section) */}
          <Text style={styles.sectionHeader}>ACADEMIC PROGRESS</Text>
          
          {/* Card 1: Class Teacher (Always Expanded) */}
          <View style={styles.classCardExpanded}>
            <View style={styles.classCardHeaderExpanded}>
              <View>
                <Text style={styles.classNameExp}>Class 9-A (Math)</Text>
                <Text style={styles.roleText}>CLASS TEACHER</Text>
              </View>
              <Text style={styles.studentCount}>42 Students</Text>
            </View>
            
            <View style={styles.classBody}>
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.topicLabel}>CURRENT TOPIC</Text>
                <View style={styles.topicRow}>
                  <FontAwesome5 name="book-open" size={12} color="#6366f1" />
                  <Text style={styles.topicText}>Ch 5: Arithmetic</Text>
                </View>
              </View>

              {/* Checklist Grid */}
              <View style={styles.checklistGrid}>
                <View style={styles.checkItem}>
                  <FontAwesome5 name="check" size={10} color="#16a34a" />
                  <Text style={styles.checkText}>Notes</Text>
                </View>
                <View style={styles.checkItem}>
                  <FontAwesome5 name="check" size={10} color="#16a34a" />
                  <Text style={styles.checkText}>Quiz</Text>
                </View>
                <View style={styles.checkItemPending}>
                  <FontAwesome5 name="clock" size={10} color="#f97316" />
                  <Text style={styles.checkTextPending}>Test</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.rosterBtn}>
                <FontAwesome5 name="users" size={12} color="#fff" />
                <Text style={styles.rosterBtnText}>View 9-A Roster</Text>
              </TouchableOpacity>
            </View>
            {/* Purple Accent Bar */}
            <View style={styles.accentBar} />
          </View>

          {/* Card 2: Subject 10-B (Collapsible) */}
          <View style={styles.accordionCard}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              onPress={() => toggleAccordion('10-B')}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.className}>Class 10-B (Physics)</Text>
                <Text style={styles.roleTextGray}>SUBJECT TEACHER</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.avgBadge}>
                  <Text style={styles.avgText}>Avg 62%</Text>
                </View>
                <FontAwesome5 
                  name={expandedCards['10-B'] ? "chevron-up" : "chevron-down"} 
                  size={12} 
                  color="#94a3b8" 
                />
              </View>
            </TouchableOpacity>

            {/* Collapsible Content */}
            {expandedCards['10-B'] && (
              <View style={styles.accordionBody}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.topicLabel}>CURRENT TOPIC</Text>
                  <View style={styles.topicRow}>
                    <FontAwesome5 name="book-open" size={12} color="#64748b" />
                    <Text style={styles.topicText}>Ch 3: Light & Optics</Text>
                  </View>
                </View>
                <View style={styles.checklistGrid}>
                  <View style={styles.checkItemRed}>
                    <Text style={styles.checkTextRed}>Notes Pending</Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Text style={styles.checkText}>Quiz Done</Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Text style={styles.checkText}>Test Done</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Card 3: Subject 10-C (Collapsible) */}
          <View style={styles.accordionCard}>
            <TouchableOpacity 
              style={styles.accordionHeader} 
              onPress={() => toggleAccordion('10-C')}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.className}>Class 10-C (Physics)</Text>
                <Text style={styles.roleTextGray}>SUBJECT TEACHER</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.avgBadge, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
                  <Text style={[styles.avgText, { color: '#16a34a' }]}>Avg 78%</Text>
                </View>
                <FontAwesome5 
                  name={expandedCards['10-C'] ? "chevron-up" : "chevron-down"} 
                  size={12} 
                  color="#94a3b8" 
                />
              </View>
            </TouchableOpacity>

            {expandedCards['10-C'] && (
              <View style={styles.accordionBody}>
                <Text style={styles.emptyStateText}>All tasks up to date. Chapter 4 Completed.</Text>
              </View>
            )}
          </View>

        </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Sidebar (Standard) */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoBox: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuSection: { gap: 8 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutIconBtn: { padding: 4 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  /* Content */
  scrollContent: { flex: 1 },
  
  /* 1. Profile Header */
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', marginBottom: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#f1f5f9' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  profileCode: { fontSize: 12, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  classBadge: { backgroundColor: '#eef2ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 6 },
  classBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },

  /* 2. Rank Card (Dark Gradient Look) */
  rankCard: { marginHorizontal: 20, borderRadius: 16, padding: 16, backgroundColor: '#1e293b', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, marginBottom: 20 },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rankLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  rankValue: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  rankSub: { fontSize: 10, color: '#94a3b8' },
  trophyCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4, alignSelf: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  rankPosition: { fontSize: 12, fontWeight: 'bold', color: '#facc15' },
  rankTotal: { fontSize: 10, color: '#94a3b8' },
  rankBarBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 12, position: 'relative' },
  rankBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#facc15', borderRadius: 3 },
  rankFooter: { fontSize: 10, color: '#94a3b8', textAlign: 'right', marginTop: 6 },

  /* 3. Graph Card */
  graphCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase' },
  trendBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  trendText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },
  chartContainer: { height: 120, width: '100%', position: 'relative' },
  dataLabel: { position: 'absolute', backgroundColor: '#fff', paddingHorizontal: 4, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  dataLabelText: { fontSize: 10, fontWeight: 'bold', color: '#4338ca' },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  axisText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },

  /* 4. Progress Section */
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginLeft: 24, marginBottom: 12, textTransform: 'uppercase' },
  
  /* Class Teacher Card (Expanded) */
  classCardExpanded: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#c7d2fe', marginBottom: 12, overflow: 'hidden', position: 'relative' },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 6, backgroundColor: '#6366f1' },
  classCardHeaderExpanded: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingLeft: 20, backgroundColor: '#eef2ff', borderBottomWidth: 1, borderBottomColor: '#e0e7ff' },
  classNameExp: { fontSize: 13, fontWeight: 'bold', color: '#4338ca' },
  roleText: { fontSize: 9, fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase' },
  studentCount: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  classBody: { padding: 16, paddingLeft: 22 },
  topicLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topicText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  checklistGrid: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  checkItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#dcfce7' },
  checkText: { fontSize: 10, fontWeight: 'bold', color: '#15803d' },
  checkItemPending: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' },
  checkTextPending: { fontSize: 10, fontWeight: 'bold', color: '#c2410c' },
  checkItemRed: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' },
  checkTextRed: { fontSize: 10, fontWeight: 'bold', color: '#b91c1c' },
  rosterBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 8 },
  rosterBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  /* Accordion Card (Collapsed/Expandable) */
  accordionCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  className: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  roleTextGray: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  avgBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5' },
  avgText: { fontSize: 10, fontWeight: 'bold', color: '#f97316' },
  accordionBody: { padding: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  emptyStateText: { fontSize: 12, color: '#64748b', textAlign: 'center', fontStyle: 'italic' },
});