import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform,
  UIManager,
  FlatList,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; 
import TeacherSidebar from "../../../components/TeacherSidebar";
import api from "../../../services/api";

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function LiveQuizMonitorScreen({ route, navigation }) {
  // GET ID FROM PARAMS
  const { quizId } = route.params; 

  // Sidebar State (Using your reusable component logic is better, but keeping yours if preferred)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); 

  // --- 1. FETCH DATA FUNCTION ---
  const fetchData = async () => {
    try {
      const response = await api.get(`/teacher/quizzes/${quizId}`);
      const q = response.data;
      
      setQuizData(q);
      
      // Calculate Time Left
      if (q.dueDate) {
        const now = new Date();
        const end = new Date(q.dueDate);
        const diffInSeconds = Math.floor((end - now) / 1000);
        setTimeLeft(diffInSeconds > 0 ? diffInSeconds : 0);
      }

      // Map Submissions to UI structure
      // Note: Backend 'submissions' array has { student: {name, rollNo}, status, obtainedMarks }
      // We need to map this to your UI needs.
      // Ideally, you'd want ALL students here. For now, we show only those who started.
      // To show ALL, we'd need to fetch Class Roster and merge.
      // Let's stick to submissions for now.
      
      const mappedStudents = q.submissions.map(sub => {
        // Determine status color/bg logic
        let status = 'working';
        if (sub.status === 'submitted' || sub.status === 'graded') status = 'finished';
        
        // Progress (mock calculation if not in backend, or use sub.quizResponses.length)
        // Let's assume backend sends populated submissions
        const progress = sub.quizResponses ? `${sub.quizResponses.length} / ${q.questions.length}` : `0 / ${q.questions.length}`;

        return {
           id: sub._id,
           name: sub.student.name,
           initials: sub.student.name.substring(0,2).toUpperCase(),
           rollNo: sub.student.rollNo,
           bg: status === 'finished' ? '#dcfce7' : '#f1f5f9',
           color: status === 'finished' ? '#16a34a' : '#64748b',
           status: status,
           score: `${sub.obtainedMarks}/${q.totalMarks}`,
           progress: progress
        };
      });

      setStudents(mappedStudents);

    } catch (error) {
      console.error("Monitor Error:", error);
      Alert.alert("Error", "Failed to load live data");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. INITIAL LOAD & AUTO REFRESH ---
  useFocusEffect(
    useCallback(() => {
      fetchData(); // Load immediately

      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }, [quizId])
  );

  // --- 3. TIMER COUNTDOWN (Local) ---
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "ENDED";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStopQuiz = async () => {
    Alert.alert(
      "End Quiz?",
      "This will close the quiz for everyone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Quiz", style: "destructive", onPress: async () => {
            try {
                await api.put(`/teacher/quizzes/${quizId}`, { status: 'Completed' });
                navigation.goBack();
            } catch(e) { Alert.alert("Error ending quiz"); }
        }}
      ]
    );
  };

  const renderStudentRow = ({ item }) => {
    return (
      <View style={[styles.studentCard, item.status === 'finished' && { opacity: 0.8 }]}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatarBox, { backgroundColor: item.bg }]}>
            <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
          </View>
          <View>
             <Text style={styles.studentName}>{item.name}</Text>
             <Text style={{fontSize:10, color:'#94a3b8'}}>Roll No: {item.rollNo}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          {item.status === 'finished' ? (
            <View style={styles.statusBox}>
              <Text style={[styles.statusText, { color: '#16a34a' }]}>Finished ({item.score})</Text>
            </View>
          ) : (
            <View style={styles.workingBox}>
              <View style={styles.pulseContainer}>
                <PulsingDot />
                <Text style={styles.workingText}>Live</Text>
              </View>
              <Text style={styles.progressText}>{item.progress}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
      return <View style={[styles.container, {justifyContent:'center'}]}><ActivityIndicator size="large" color="#4f46e5"/></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      <TeacherSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        navigation={navigation} 
        activeItem="QuizManager"
      />

      {/* --- MAIN CONTENT --- */}
      <View style={styles.mainContent}>
        
        {/* Dark Header Card */}
        <View style={styles.headerCard}>
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.navRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <FontAwesome5 name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>TIME REMAINING</Text>
                <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)}>
                 <FontAwesome5 name="bars" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{quizData?.title || "Quiz Monitor"}</Text>
              <Text style={styles.quizSub}>{quizData?.className} • {students.length} Active</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.bodyContainer}>
          
          {/* Status Bar */}
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>LIVE STATUS</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
              <FontAwesome5 name="sync-alt" size={10} color="#4f46e5" />
              <Text style={styles.refreshText}>Refreshed just now</Text>
            </TouchableOpacity>
          </View>

          {/* Student List */}
          <FlatList 
            data={students}
            keyExtractor={item => item.id}
            renderItem={renderStudentRow}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={{textAlign:'center', marginTop:50, color:'#94a3b8'}}>Waiting for students to join...</Text>}
          />

        </View>

        {/* Footer Action */}
        <SafeAreaView edges={['bottom']} style={styles.footerAction}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStopQuiz}>
            <Text style={styles.stopBtnText}>End Quiz for All</Text>
          </TouchableOpacity>
        </SafeAreaView>

      </View>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */

const PulsingDot = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={{
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginRight: 6,
        transform: [{ scale: scaleAnim }]
      }} 
    />
  );
};

const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  // sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
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

  /* Header Card */
  headerCard: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, zIndex: 10, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', marginBottom: 2 },
  timerValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  quizInfo: { alignItems: 'center' },
  quizTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  quizSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  /* Body */
  bodyContainer: { flex: 1, padding: 20, paddingTop: 24 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  statusTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },

  /* List Items */
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  
  cardRight: { alignItems: 'flex-end' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  workingBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseContainer: { flexDirection: 'row', alignItems: 'center' },
  workingText: { fontSize: 10, fontWeight: 'bold', color: '#f97316' },
  progressText: { fontSize: 10, color: '#f97316', fontWeight: 'bold', marginLeft: 6 },

  pendingText: { fontSize: 10, fontWeight: 'bold', color: '#ef4444' },

  /* Footer */
  footerAction: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  stopBtn: { backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  stopBtnText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },
});