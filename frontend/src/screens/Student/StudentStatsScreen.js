import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  BackHandler,
  Platform,
  UIManager,
  ActivityIndicator,
  Animated // Kept for Toast Animation
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar"; // <--- IMPORT COMPONENT

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function StudentStatsScreen({ navigation }) {
  // --- LAYOUT STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // --- DATA STATE ---
  const [userInfo, setUserInfo] = useState({ name: "", className: "", initials: "", profilePic: null });
  const [stats, setStats] = useState({ overall: 0, classAvg: 0, graphData: [], subjectPerformance: [], recentHistory: [] });
  const [activeAudioTask, setActiveAudioTask] = useState(null); 

  // --- TOAST STATE ---
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const toastAnim = useRef(new Animated.Value(100)).current;

  // --- EFFECTS ---
  // Load data ONCE on mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.navigate('StudentDash');
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- HELPERS ---
  const generateInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true })
        .start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2500);
  };

  // --- DATA LOADING ---
  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserInfo({
          name: u.name || "Student",
          className: u.className || "Class",
          initials: generateInitials(u.name),
          profilePic: u.profilePic || null
        });
      }

      const [statsRes, dashRes] = await Promise.all([
          api.get('/student/stats'),
          api.get('/student/dashboard') 
      ]);

      setStats(statsRes.data);

      const { dailyMission, pendingList } = dashRes.data;
      let task = null;
      
      if (dailyMission && dailyMission.type === 'audio') {
          task = dailyMission;
      } else if (pendingList && pendingList.length > 0) {
          task = pendingList.find(t => t.type === 'audio');
      }
      setActiveAudioTask(task);

    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleAudioClick = () => {
    // Note: Sidebar closes automatically inside the component when an item is pressed
    if (activeAudioTask) {
        setTimeout(() => {
            navigation.navigate('AudioRecorder', { 
                assignmentId: activeAudioTask.id || activeAudioTask._id, 
                taskTitle: activeAudioTask.title 
            });
        }, 100);
    } else {
        setTimeout(() => showToast("No active audio tasks found.", "info"), 300);
    }
  };

  // --- CHART LOGIC ---
  const getChartPath = () => {
    if (!stats.graphData || stats.graphData.length === 0) return "";
    const stepX = 300 / (Math.max(stats.graphData.length - 1, 1));
    let d = `M0,${100 - (stats.graphData[0]?.score || 0)} `;
    stats.graphData.forEach((point, index) => {
        if (index === 0) return;
        const x = index * stepX;
        const y = 100 - point.score;
        d += `L${x},${y} `;
    });
    return d;
  };

  const diff = stats.overall - stats.classAvg;
  const isPositive = diff >= 0;

  const getSubjectStyle = (subjectName) => {
      const name = subjectName.toLowerCase();
      if (name.includes('math')) return { color: '#4f46e5', bg: '#eef2ff', icon: 'calculator', border: styles.cardLeftBorderBlue };
      if (name.includes('sci')) return { color: '#ea580c', bg: '#fff7ed', icon: 'flask', border: styles.cardLeftBorderOrange };
      if (name.includes('eng')) return { color: '#0284c7', bg: '#f0f9ff', icon: 'book', border: styles.cardLeftBorderSky };
      return { color: '#64748b', bg: '#f1f5f9', icon: 'book-open', border: styles.cardLeftBorderBlue };
  };

  if (loading) {
      return (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- REUSABLE SIDEBAR --- */}
      <StudentSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeRoute="StudentStats" // Highlights "Academic Stats"
        userInfo={userInfo}
        onLogout={handleLogout}
        onAudioPress={handleAudioClick} // Pass the custom audio logic
      />

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Academic Stats</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentPadding}>
            
            {/* Overall Stats Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroLabel}>OVERALL AVERAGE</Text>
                  <Text style={styles.heroValue}>{stats.overall}%</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.heroLabel}>VS CLASS AVG</Text>
                  <View style={[styles.trendBadge, { backgroundColor: isPositive ? '#f0fdf4' : '#fef2f2' }]}>
                    <Text style={[styles.trendText, { color: isPositive ? '#16a34a' : '#ef4444' }]}>
                        {isPositive ? '+' : ''}{diff}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.chartContainer}>
                {stats.graphData.length > 1 ? (
                    <Svg height="100%" width="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <Line x1="0" y1="0" x2="300" y2="0" stroke="#f8fafc" strokeWidth="1" />
                    <Line x1="0" y1="50" x2="300" y2="50" stroke="#f8fafc" strokeWidth="1" />
                    <Line x1="0" y1="100" x2="300" y2="100" stroke="#f8fafc" strokeWidth="1" />
                    <Line x1="0" y1={100 - stats.classAvg} x2="300" y2={100 - stats.classAvg} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                    <Path d={getChartPath()} fill="none" stroke="#4f46e5" strokeWidth="3" />
                    {stats.graphData.map((p, i) => {
                        const stepX = 300 / (stats.graphData.length - 1);
                        return <Circle key={i} cx={i * stepX} cy={100 - p.score} r="4" fill="#fff" stroke="#4f46e5" strokeWidth="2" />;
                    })}
                    </Svg>
                ) : (
                    <View style={styles.emptyChart}><Text style={styles.emptyText}>Not enough data for graph</Text></View>
                )}
              </View>

              <View style={styles.chartLabels}>
                {stats.graphData.map((d, i) => (
                    <Text key={i} style={styles.chartLabel}>{d.label}</Text>
                ))}
              </View>
            </View>

            {/* Subject List */}
            <Text style={styles.sectionTitle}>SUBJECT PERFORMANCE</Text>
            <View style={styles.subjectList}>
              {stats.subjectPerformance.length > 0 ? (
                  stats.subjectPerformance.map((subj, index) => {
                    const style = getSubjectStyle(subj.subject);
                    return (
                        <TouchableOpacity key={index} style={[styles.subjectCard, style.border]}>
                            <View style={styles.cardLeft}>
                            <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
                                <FontAwesome5 name={style.icon} size={16} color={style.color} />
                            </View>
                            <View><Text style={styles.subjectName}>{subj.subject}</Text></View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.scoreText, { color: style.color }]}>{subj.score}</Text>
                            <Text style={styles.gradeText}>{subj.grade}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                  })
              ) : (
                  <Text style={styles.emptyText}>No graded subjects yet.</Text>
              )}
            </View>

            {/* Recent History */}
            <Text style={styles.sectionTitle}>RECENT GRADED WORK</Text>
            <View style={styles.recentList}>
              {stats.recentHistory && stats.recentHistory.length > 0 ? (
                  stats.recentHistory.map((item, index) => (
                    <View key={index} style={styles.recentItem}>
                        <View>
                        <Text style={styles.dateText}>{item.date}</Text>
                        <Text style={styles.taskName}>{item.title}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={item.isHigh ? styles.scoreBadgeGreen : styles.scoreBadgeOrange}>
                            <Text style={item.isHigh ? styles.scoreBadgeTextGreen : styles.scoreBadgeTextOrange}>{item.score}</Text>
                        </View>
                        </View>
                    </View>
                  ))
              ) : (
                  <View style={styles.recentItem}><Text style={styles.emptyText}>No recent graded tasks.</Text></View>
              )}
            </View>

          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDash')}>
            <FontAwesome5 name="home" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentProfile')}>
            <FontAwesome5 name="user" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* TOAST COMPONENT */}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  /* Toast */
  toast: { position: 'absolute', bottom: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width: 0, height: 4} },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastInfo: { backgroundColor: '#3b82f6' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  
  /* Hero Card */
  heroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2, marginBottom: 24 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
  heroValue: { fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
  trendBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendText: { fontSize: 12, fontWeight: 'bold' },
  
  /* Chart */
  chartContainer: { height: 120, width: '100%', marginBottom: 12 },
  emptyChart: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8 },
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
  scoreText: { fontSize: 18, fontWeight: 'bold' },
  gradeText: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  
  /* Recent Work */
  recentList: { gap: 8 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  dateText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 2 },
  taskName: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  scoreBadgeGreen: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreBadgeTextGreen: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  scoreBadgeOrange: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreBadgeTextOrange: { fontSize: 14, fontWeight: 'bold', color: '#f97316' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 12 },
  
  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});