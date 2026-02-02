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
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar"; // <--- Import Component

const { width } = Dimensions.get('window');

export default function StudentDashScreen({ navigation }) {
  // --- STATE: Sidebar ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE: Data ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    student: { name: "", className: "", initials: "" },
    hasSiblings: false,
    dailyMission: null,
    pendingList: [],
    feedback: []
  });

  // --- STATE: Toast ---
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const toastAnim = useRef(new Animated.Value(100)).current;

  // --- HANDLER: Back Button ---
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- HANDLER: Fetch Data ---
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
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // --- ACTIONS ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true })
        .start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2500);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login"); 
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // --- AUDIO LOGIC FOR SIDEBAR ---
  const handleAudioPress = () => {
      // Check Daily Mission First
      if (dashboardData.dailyMission && dashboardData.dailyMission.type === 'audio') {
          navigation.navigate('AudioRecorder', { 
              assignmentId: getTaskId(dashboardData.dailyMission), 
              taskTitle: dashboardData.dailyMission.title 
          });
          return;
      }
      
      // Check Pending List
      const pendingAudio = dashboardData.pendingList.find(t => t.type === 'audio');
      if (pendingAudio) {
          navigation.navigate('AudioRecorder', { 
              assignmentId: getTaskId(pendingAudio), 
              taskTitle: pendingAudio.title 
          });
          return;
      }

      // No Task Found
      setTimeout(() => showToast("No active audio tasks found.", "info"), 300);
  };

  // Helper: Date Check
  const isRecent = (dateString) => {
    const date = new Date(dateString);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return date >= twoDaysAgo;
  };

  const getTaskId = (task) => {
      return task.id || task._id; 
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
        </View>
    );
  }

  const { student, hasSiblings, dailyMission, pendingList } = dashboardData;
  const recentFeedback = dashboardData.feedback.filter(item => isRecent(item.updatedAt));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- REUSABLE SIDEBAR --- */}
      <StudentSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeRoute="StudentDash"
        userInfo={student}
        onLogout={handleLogout}
        onAudioPress={handleAudioPress}
      />

      {/* ======================================================= */}
      {/* 1. MAIN CONTENT */}
      {/* ======================================================= */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            
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
            
            {/* TODAY'S MISSION (HERO) */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
              
              {dailyMission ? (
                <View style={styles.heroCard}>
                  <View style={[
                      styles.heroContent,
                      dailyMission.type === 'audio' && { backgroundColor: '#be123c' }
                  ]}>
                    <View style={styles.heroTop}>
                      <View>
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>
                            {dailyMission.type === 'audio' ? '🎙 AUDIO TASK' : 
                             dailyMission.type === 'quiz' ? '📝 WEEKLY QUIZ' : '📘 HOMEWORK'}
                          </Text>
                        </View>
                        <Text style={styles.heroTitle}>{dailyMission.title}</Text>
                        <Text style={styles.heroSub}>{dailyMission.subject || "General"} • Due Today</Text>
                      </View>
                      
                      <View style={styles.heroIconBox}>
                        <FontAwesome5 
                          name={dailyMission.type === 'audio' ? 'microphone' : dailyMission.type === 'quiz' ? 'list-ol' : 'pen'} 
                          size={24} color="#fff" 
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[
                          styles.heroButton,
                          dailyMission.type === 'audio' && { backgroundColor: '#fff' }
                      ]}
                      activeOpacity={0.9}
                      onPress={() => {
                          if (dailyMission.type === 'audio') {
                            navigation.navigate('AudioRecorder', { 
                              assignmentId: getTaskId(dailyMission), 
                              taskTitle: dailyMission.title
                            });
                          } else if (dailyMission.type === 'quiz') {
                            navigation.navigate('StudentQuizCenter');
                          } else {
                            showToast("View details in pending list", "info");
                          }
                      }}
                    >
                      <FontAwesome5 
                        name={dailyMission.type === 'audio' ? 'circle' : 'play-circle'} 
                        size={16} 
                        color={dailyMission.type === 'audio' ? '#be123c' : '#4f46e5'} 
                        solid
                      />
                      <Text style={[
                          styles.heroButtonText,
                          dailyMission.type === 'audio' && { color: '#be123c' }
                      ]}>
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

            {/* PENDING TASKS */}
            <View style={styles.sectionMb}>
              <Text style={styles.sectionTitle}>TO DO LIST</Text>
              
              {pendingList.length > 0 ? (
                 pendingList.map((task) => (
                    <View key={getTaskId(task) || Math.random()} style={styles.taskCard}>
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
                                if (task.type === 'audio') {
                                    navigation.navigate('AudioRecorder', { 
                                        assignmentId: getTaskId(task), 
                                        taskTitle: task.title 
                                    });
                                } else if (task.type === 'quiz') {
                                    navigation.navigate('StudentQuizCenter');
                                }
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

            {/* RECENT FEEDBACK */}
            {recentFeedback.length > 0 && (
                <View style={styles.sectionMb}>
                <Text style={styles.sectionTitle}>TEACHER FEEDBACK (LAST 2 DAYS)</Text>
                {recentFeedback.map((item) => (
                    <View key={item._id || item.id} style={styles.feedbackCard}>
                        <View style={styles.feedbackHeader}>
                            <View style={styles.feedbackLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#faf5ff' }]}>
                                    <FontAwesome5 name={item.type === 'Handwriting' ? 'pen-fancy' : 'comment'} size={12} color="#9333ea" />
                                </View>
                                <Text style={styles.feedbackCategory}>{item.type || 'Review'}</Text>
                            </View>
                            <Text style={styles.feedbackDate}>Recent</Text>
                        </View>
                        
                        <View style={styles.starRow}>
                            <View style={styles.stars}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <FontAwesome5 key={s} name="star" solid={s <= item.obtainedMarks} size={12} color={s <= item.obtainedMarks ? "#fbbf24" : "#cbd5e1"} />
                                ))}
                            </View>
                            <Text style={styles.goodWorkText}>
                                {item.obtainedMarks >= 4 ? "Good Work!" : "Keep Improving"}
                            </Text>
                        </View>

                        {item.feedback ? <Text style={styles.commentText}>"{item.feedback}"</Text> : null}
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

      {/* --- CUSTOM TOAST --- */}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toast, 
            toast.type === 'error' ? styles.toastError : 
            toast.type === 'info' ? styles.toastInfo : styles.toastSuccess,
            { transform: [{ translateY: toastAnim }] }
          ]}
        >
           <FontAwesome5 
              name={toast.type === 'error' ? 'exclamation-circle' : toast.type === 'info' ? 'info-circle' : 'check-circle'} 
              size={16} color="#fff" 
           />
           <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#F8FAFC" },

  /* Toast */
  toast: { position: 'absolute', bottom: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width: 0, height: 4} },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastInfo: { backgroundColor: '#3b82f6' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuButton: { padding: 4 },
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
  commentText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingLeft: 32 },

  /* Empty State */
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});