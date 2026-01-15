import React, { useState, useRef, useEffect, useCallback } from "react";
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
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api"; // Ensure this path is correct

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

export default function StudentDashScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    student: { name: "", className: "", initials: "" },
    hasSiblings: false,
    dailyMission: null,
    pendingList: [],
    feedback: []
  });

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

  // Fetch Data on Focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.log("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

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
      navigation.replace("Login"); 
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // Helper: Check if date is within last 2 days
  const isRecent = (dateString) => {
    const date = new Date(dateString);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return date >= twoDaysAgo;
  };

  const recentFeedback = dashboardData.feedback.filter(item => isRecent(item.updatedAt));

  if (loading) {
    return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: "#F8FAFC"}}>
            <ActivityIndicator size="large" color="#4f46e5" />
        </View>
    );
  }

  const { student, hasSiblings, dailyMission, pendingList } = dashboardData;

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
            <View style={styles.sidebarContentWrapper}>
                <View style={styles.sidebarHeader}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{student.initials}</Text>
                    </View>
                    <View>
                        <Text style={styles.sidebarName}>{student.name}</Text>
                        <Text style={styles.sidebarClass}>{student.className}</Text>
                    </View>
                </View>

                <ScrollView style={styles.menuScroll} contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                    <SidebarItem icon="home" label="Home" active onPress={() => handleNav('StudentDash')} />
                    <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')}/>
                    <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')}/>
                    <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')}/>
                    <SidebarItem icon="microphone" label="Daily Audio" onPress={() => handleNav('AudioRecorder')}/>
                    <SidebarItem icon="bullhorn" label="Notice" onPress={() => handleNav('StudentNoticeBoard')} />
                    <View style={styles.menuDivider} />
                    <SidebarItem icon="question-circle" label="Help & Support" />
                </ScrollView>
            </View>

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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            
            {/* Sibling Switcher - ONLY IF HAS SIBLINGS */}
            <TouchableOpacity 
                style={[styles.siblingPill, !hasSiblings && styles.siblingPillDisabled]}
                disabled={!hasSiblings}
                onPress={() => navigation.navigate('StudentProfile')}
            >
               <View style={styles.miniAvatar}>
                 <Text style={styles.miniAvatarText}>{student.initials}</Text>
               </View>
               <Text style={styles.siblingName}>{student.name}</Text>
               {hasSiblings && <FontAwesome5 name="chevron-down" size={10} color="#94a3b8" />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. TODAY'S MISSION (HERO) */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
              
              {dailyMission ? (
                <View style={styles.heroCard}>
                  <View style={styles.heroContent}>
                    {/* <View style={styles.blob1} />
                    <View style={styles.blob2} /> */}
                    
                    <View style={styles.heroTop}>
                      <View>
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>
                            {dailyMission.type === 'audio' ? 'DAILY AUDIO' : 
                             dailyMission.type === 'quiz' ? 'WEEKLY QUIZ' : 'HOMEWORK'}
                          </Text>
                        </View>
                        <Text style={styles.heroTitle}>{dailyMission.title}</Text>
                        <Text style={styles.heroSub}>Due by {dailyMission.deadline}</Text>
                      </View>
                      
                      <View style={styles.heroIconBox}>
                        <FontAwesome5 
                          name={
                            dailyMission.type === 'audio' ? 'microphone' : 
                            dailyMission.type === 'quiz' ? 'list-ol' : 'pen'
                          } 
                          size={24} 
                          color="#fff" 
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.heroButton}
                      activeOpacity={0.9}
                      onPress={() => {
                          if (dailyMission.type === 'audio') navigation.navigate('AudioRecorder');
                          else if (dailyMission.type === 'quiz') navigation.navigate('StudentQuizCenter');
                          else console.log('Homework details');
                      }}
                    >
                      <FontAwesome5 name="play-circle" size={16} color="#4f46e5" />
                      <Text style={styles.heroButtonText}>
                        {dailyMission.type === 'audio' ? 'Start Recording' : 
                         dailyMission.type === 'quiz' ? 'Start Quiz' : 'View Details'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                   <FontAwesome5 name="calendar-check" size={24} color="#cbd5e1" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>No daily task today! 🎉</Text>
                </View>
              )}
            </View>

            {/* 2. PENDING TASKS */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TO DO LIST</Text>
              
              {pendingList.length > 0 ? (
                 pendingList.map((task) => (
                    <View key={task.id} style={styles.taskCard}>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <View style={styles.timerRow}>
                                <FontAwesome5 name="clock" size={10} color="#ef4444" />
                                <Text style={styles.timerText}>{task.endsIn}</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.startBtn}
                            onPress={() => {
                                if (task.type === 'audio') navigation.navigate('AudioRecorder');
                                else if (task.type === 'quiz') navigation.navigate('StudentQuizCenter');
                            }}
                        >
                            <Text style={styles.startBtnText}>
                                {task.type === 'quiz' ? 'Start Quiz' : task.type === 'audio' ? 'Record' : 'View'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                 ))
              ) : (
                <View style={styles.emptyState}>
                    <FontAwesome5 name="check-circle" size={24} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyText}>No tasks to do. Great job!</Text>
                </View>
              )}
            </View>

            {/* 3. RECENT FEEDBACK */}
            {recentFeedback.length > 0 && (
                <View style={styles.sectionMb}>
                <Text style={styles.sectionTitle}>TEACHER FEEDBACK (LAST 2 DAYS)</Text>
                
                {recentFeedback.map((item) => (
                    <View key={item._id} style={styles.feedbackCard}>
                        <View style={styles.feedbackHeader}>
                        <View style={styles.feedbackLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#faf5ff' }]}>
                                <FontAwesome5 
                                    name={item.type === 'Handwriting' ? 'pen-fancy' : 'comment'} 
                                    size={12} color="#9333ea" 
                                />
                            </View>
                            <Text style={styles.feedbackCategory}>{item.type || 'Review'}</Text>
                        </View>
                        <Text style={styles.feedbackDate}>Just Now</Text>
                        </View>
                        
                        {/* Stars */}
                        <View style={styles.starRow}>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <FontAwesome5 
                                    key={s} 
                                    name="star" 
                                    solid={s <= item.obtainedMarks} 
                                    size={12} 
                                    color={s <= item.obtainedMarks ? "#fbbf24" : "#cbd5e1"} 
                                />
                            ))}
                        </View>
                        <Text style={styles.goodWorkText}>
                            {item.obtainedMarks >= 4 ? "Good Work!" : "Keep Improving"}
                        </Text>
                        </View>

                        {/* Tags or Feedback */}
                        {item.tags && item.tags.length > 0 && (
                            <View style={styles.tagsRow}>
                                {item.tags.map((tag, idx) => (
                                    <View key={idx} style={[styles.tag, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                                        <Text style={[styles.tagText, { color: '#15803d' }]}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {item.feedback ? (
                             <Text style={styles.commentText}>"{item.feedback}"</Text>
                        ) : null}
                    </View>
                ))}
                </View>
            )}

          </View>
        </ScrollView>

        {/* FIXED BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => fetchDashboard()}>
            <FontAwesome5 name="home" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentProfile')}>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' },
  menuButton: { padding: 4 },
  
  /* Sibling Switcher */
  siblingPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  siblingPillDisabled: { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },
  siblingName: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#334155' },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  sectionMb: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },

  /* Hero Card */
  heroCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  heroContent: { backgroundColor: '#4f46e5', padding: 20 },
  blob1: { position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)' },
  blob2: { position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  heroBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 12, color: '#e0e7ff' },
  heroIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 14, borderRadius: 12 },
  heroButtonText: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5' },

  /* To Do */
  taskCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: '#4f46e5', marginBottom: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  startBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  startBtnText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },

  /* Feedback */
  feedbackCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  feedbackCategory: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  feedbackDate: { fontSize: 10, color: '#94a3b8' },
  
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8 },
  stars: { flexDirection: 'row', gap: 2 },
  goodWorkText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: 'bold' },
  commentText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingLeft: 32 },

  /* Empty State */
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});       