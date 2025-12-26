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
  UIManager
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

// --- MOCK DATA FROM TEACHER ---
const DAILY_TASK = {
  id: '101',
  type: 'audio', // Options: 'audio', 'homework', 'quiz', 'none'
  title: 'Recite: Poem 4',
  deadline: '10:00 PM',
  subject: 'English'
};

export default function StudentDashScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student State
  const [studentName, setStudentName] = useState("Arjun");
  const [className, setClassName] = useState("Class 9-A");

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      return false; // Default exit behavior
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    // If opening, set state first to render, then animate.
    // If closing, animate then set state (optional, but keeping simpler logic here)
    
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

  const handleTaskAction = () => {
    // Navigation logic here
    console.log("Task Action Triggered");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY --- */}
      {/* We use position absolute to cover the whole screen */}
      <Animated.View
        style={[
          styles.overlay, 
          { 
            opacity: overlayAnim,
            // Move overlay off-screen when closed so it doesn't block touches
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
                    <SidebarItem icon="home" label="Home" active onPress={() => handleNav('StudentDash')} />
                    <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')}/>
                    <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')}/>
                    
                    {/* <View style={styles.menuDivider} />
                    <Text style={styles.menuSectionLabel}>ACADEMICS</Text> */}
                    
                    <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')}/>
                    <SidebarItem icon="microphone" label="Daily Audio" onPress={() => handleNav('AudioRecord')}/>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            
            {/* Sibling Switcher */}
            <TouchableOpacity style={styles.siblingPill}>
               <View style={styles.miniAvatar}>
                 <Text style={styles.miniAvatarText}>AK</Text>
               </View>
               <Text style={styles.siblingName}>{studentName}</Text>
               <FontAwesome5 name="chevron-down" size={10} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. TODAY'S MISSION (HERO) */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
              
              {/* Dynamic Task Card */}
              {DAILY_TASK.type !== 'none' ? (
                <View style={styles.heroCard}>
                  <View style={styles.heroContent}>
                    {/* Decorative Blobs */}
                    <View style={styles.blob1} />
                    <View style={styles.blob2} />
                    
                    <View style={styles.heroTop}>
                      <View>
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>
                            {DAILY_TASK.type === 'audio' ? 'DAILY AUDIO' : 
                             DAILY_TASK.type === 'quiz' ? 'WEEKLY QUIZ' : 'HOMEWORK'}
                          </Text>
                        </View>
                        <Text style={styles.heroTitle}>{DAILY_TASK.title}</Text>
                        <Text style={styles.heroSub}>Due by {DAILY_TASK.deadline}</Text>
                      </View>
                      
                      <View style={styles.heroIconBox}>
                        <FontAwesome5 
                          name={
                            DAILY_TASK.type === 'audio' ? 'microphone' : 
                            DAILY_TASK.type === 'quiz' ? 'list-ol' : 'pen'
                          } 
                          size={24} 
                          color="#fff" 
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.heroButton}
                      activeOpacity={0.9}
                      onPress={handleTaskAction}
                    >
                      <FontAwesome5 name="play-circle" size={16} color="#4f46e5" />
                      <Text style={styles.heroButtonText}>
                        {DAILY_TASK.type === 'audio' ? 'Start Recording' : 
                         DAILY_TASK.type === 'quiz' ? 'Start Quiz' : 'Upload Work'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No active tasks for today! 🎉</Text>
                </View>
              )}
            </View>

            {/* 2. PENDING TASKS */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TO DO LIST</Text>
              
              <View style={styles.taskCard}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>Weekly Math Test</Text>
                  <View style={styles.timerRow}>
                    <FontAwesome5 name="clock" size={10} color="#ef4444" />
                    <Text style={styles.timerText}>Ends in 2h</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.startBtn}>
                  <Text style={styles.startBtnText}>Start Quiz</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. RECENT FEEDBACK */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TEACHER FEEDBACK</Text>
              
              {/* Handwriting Feedback */}
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.feedbackLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#faf5ff' }]}>
                      <FontAwesome5 name="pen-fancy" size={12} color="#9333ea" />
                    </View>
                    <Text style={styles.feedbackCategory}>Handwriting</Text>
                  </View>
                  <Text style={styles.feedbackDate}>Yesterday</Text>
                </View>
                
                <View style={styles.starRow}>
                  <View style={styles.stars}>
                    <FontAwesome5 name="star" solid size={12} color="#fbbf24" />
                    <FontAwesome5 name="star" solid size={12} color="#fbbf24" />
                    <FontAwesome5 name="star" solid size={12} color="#fbbf24" />
                    <FontAwesome5 name="star" solid size={12} color="#fbbf24" />
                    <FontAwesome5 name="star" size={12} color="#cbd5e1" />
                  </View>
                  <Text style={styles.goodWorkText}>Good Work!</Text>
                </View>

                <View style={styles.tagsRow}>
                  <View style={[styles.tag, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                    <Text style={[styles.tagText, { color: '#15803d' }]}>Neat</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                    <Text style={[styles.tagText, { color: '#64748b' }]}>Legible</Text>
                  </View>
                </View>
              </View>

              {/* Behavior Log */}
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.feedbackLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#fffbeb' }]}>
                      <FontAwesome5 name="star" size={12} color="#d97706" />
                    </View>
                    <Text style={styles.feedbackCategory}>Class Behavior</Text>
                  </View>
                  <Text style={styles.feedbackDate}>2 days ago</Text>
                </View>
                <Text style={styles.commentText}>"Active participation in Science class today."</Text>
              </View>
            </View>

          </View>
        </ScrollView>

        {/* FIXED BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="home" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
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
  sidebarContentWrapper: { flex: 1 }, // Added to ensure top content takes available space
  
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
  taskCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
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
  
  tagsRow: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: 'bold' },
  commentText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingLeft: 32 },

  /* Empty State */
  emptyState: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  emptyText: { color: '#94a3b8', fontSize: 12 },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});