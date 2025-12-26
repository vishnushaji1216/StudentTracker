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
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;
const { width } = Dimensions.get('window');

export default function QuizDashboardScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Screen State
  const [activeTab, setActiveTab] = useState('Active'); // Active, Drafts, History

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.navigate('TeacherDash'); // Go back to Dash instead of exiting
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

  // Navigation Helpers
  const goToCreate = () => navigation.navigate('QuizSetup');
  const goToMonitor = () => navigation.navigate('LiveQuizMonitor');
  const goToResult = () => navigation.navigate('QuizResult');

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
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Quiz Manager</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>Active: 2</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {['Active', 'Drafts', 'History'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* Create Button */}
            <TouchableOpacity 
              style={styles.createBtn} 
              activeOpacity={0.9}
              onPress={goToCreate}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.createIconBox}>
                  <FontAwesome5 name="plus" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.createTitle}>Create New Quiz</Text>
                  <Text style={styles.createSub}>Set up manually</Text>
                </View>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            {/* --- ACTIVE TAB CONTENT --- */}
            {activeTab === 'Active' && (
              <>
                <Text style={styles.sectionLabel}>ACTIVE NOW</Text>

                {/* Live Quiz Card */}
                <View style={styles.liveCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={styles.liveBadge}>LIVE</Text>
                        <Text style={styles.timerText}>Ends in 45m</Text>
                      </View>
                      <Text style={styles.cardTitle}>Weekly Math Test</Text>
                      <Text style={styles.cardSub}>Class 9-A • Ch 5 Arithmetic</Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.progressLabel}>Submitted: 24/42</Text>
                      <Text style={styles.progressLabel}>57%</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: '57%' }]} />
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.outlineBtn}>
                      <Text style={styles.outlineBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtnSmall} onPress={goToMonitor}>
                      <Text style={styles.primaryBtnTextSmall}>Monitor Live</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Scheduled Quiz Card */}
                <View style={styles.scheduledCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <View style={styles.scheduledBadge}>
                           <FontAwesome5 name="clock" size={8} color="#ea580c" style={{ marginRight: 4 }} />
                           <Text style={styles.scheduledBadgeText}>SCHEDULED</Text>
                        </View>
                      </View>
                      <Text style={styles.cardTitle}>Physics Pop Quiz</Text>
                      <Text style={styles.cardSub}>Class 10-B • Optics</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                       <Text style={styles.startLabel}>Starts</Text>
                       <Text style={styles.startValue}>Tmrw 10am</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.dashedBtn}>
                    <Text style={styles.dashedBtnText}>Edit Questions (10)</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* --- HISTORY TAB CONTENT --- */}
            {activeTab === 'History' && (
              <>
                <Text style={styles.sectionLabel}>PAST HISTORY</Text>
                
                <TouchableOpacity style={styles.historyCard} onPress={goToResult}>
                  <View>
                    <Text style={styles.historyTitle}>History Ch 4</Text>
                    <Text style={styles.historySub}>Class 8-C • Ended Yesterday</Text>
                  </View>
                  <View style={styles.reportBtn}>
                    <Text style={styles.reportBtnText}>View Report</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.historyCard} onPress={goToResult}>
                  <View>
                    <Text style={styles.historyTitle}>Science Unit 2</Text>
                    <Text style={styles.historySub}>Class 9-A • 2 Days ago</Text>
                  </View>
                  <View style={styles.reportBtn}>
                    <Text style={styles.reportBtnText}>View Report</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* --- DRAFTS TAB CONTENT --- */}
            {activeTab === 'Drafts' && (
               <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <FontAwesome5 name="file-alt" size={32} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', marginTop: 10, fontSize: 12 }}>No drafts saved.</Text>
               </View>
            )}

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
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  countBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },

  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Create Button */
  createBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4f46e5', padding: 16, borderRadius: 16, marginBottom: 24, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  createIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  createTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  createSub: { color: '#c7d2fe', fontSize: 10 },

  /* Section Label */
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },

  /* Cards */
  liveCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#22c55e', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 },
  scheduledCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#f97316', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { fontSize: 11, color: '#64748b' },
  
  /* Badges */
  liveBadge: { fontSize: 9, fontWeight: 'bold', color: '#16a34a', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  timerText: { fontSize: 11, fontWeight: 'bold', color: '#ef4444' },
  
  scheduledBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5' },
  scheduledBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#c2410c' },
  
  startLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', textAlign: 'right' },
  startValue: { fontSize: 12, fontWeight: 'bold', color: '#334155' },

  /* Progress Bar */
  progressContainer: { marginBottom: 12 },
  progressLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  track: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 4 },
  fill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },

  /* Actions */
  actionRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  outlineBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#f8fafc' },
  outlineBtnText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
  primaryBtnSmall: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#eef2ff' },
  primaryBtnTextSmall: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },
  
  dashedBtn: { width: '100%', alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', marginTop: 8 },
  dashedBtnText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },

  /* History Card */
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, opacity: 0.8 },
  historyTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  historySub: { fontSize: 10, color: '#94a3b8' },
  reportBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  reportBtnText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});