import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
  UIManager,
  FlatList,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); 
  
  // Confirmation & Toast State
  const [endConfirm, setEndConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 

  //Check for quiz end
  const isQuizEnded = quizData?.status === 'Completed' || quizData?.status === 'History';

  // --- 1. TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
      });
    }, 2000);
  };

  // --- 2. FETCH DATA FUNCTION ---
  const fetchData = async () => {
    try {
      const response = await api.get(`/teacher/quizzes/${quizId}`);
      const q = response.data;
      
      setQuizData(q);
      
      const mappedStudents = q.submissions.map(sub => {
        let status = 'working';
        if (sub.status === 'submitted' || sub.status === 'graded') status = 'finished';
        
        const progress = sub.quizResponses ? `${sub.quizResponses.length} / ${q.questions.length}` : `0 / ${q.questions.length}`;

        return {
           id: sub._id,
           name: sub.student?.name || "Unknown Student",
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
      showToast("Failed to load live data", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. INITIAL LOAD & AUTO REFRESH ---
  useFocusEffect(
    useCallback(() => {
      fetchData(); 
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }, [quizId])
  );

  // --- 4. TIMER COUNTDOWN (Strict Sync) ---
  useEffect(() => {
    if (!quizData?.dueDate) return;
    
    // Update immediately
    const updateTimer = () => {
        const now = new Date();
        const end = new Date(quizData.dueDate);
        const diff = Math.floor((end - now) / 1000); 
        setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer(); // Run once
    const interval = setInterval(updateTimer, 1000); // Run every sec
    return () => clearInterval(interval);
  }, [quizData]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "ENDED";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- 5. END QUIZ LOGIC ---
  const handleStopQuizRequest = () => {
    setEndConfirm(true);
  };

  const executeStopQuiz = async () => {
    setEndConfirm(false);
    try {
        await api.put(`/teacher/quizzes/${quizId}`, { status: 'Completed' });
        showToast("Quiz Ended Successfully", "success");
        setTimeout(() => navigation.goBack(), 1000);
    } catch(e) { 
        showToast("Failed to end quiz", "error"); 
    }
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
          <TouchableOpacity style={styles.stopBtn} onPress={handleStopQuizRequest}>
            <Text style={styles.stopBtnText}>End Quiz for All</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* --- CONFIRMATION CARD (Replaces Alert) --- */}
        {endConfirm && (
          <View style={styles.confirmOverlay}>
             <View style={styles.confirmBox}>
                 <View style={styles.confirmTextContainer}>
                     <Text style={styles.confirmTitle}>End Quiz Now?</Text>
                     <Text style={styles.confirmSub}>Submits all answers and closes the session.</Text>
                 </View>
                 <View style={styles.confirmActions}>
                     <TouchableOpacity style={styles.cancelBtn} onPress={() => setEndConfirm(false)}>
                         <Text style={styles.cancelText}>Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.deleteConfirmBtn} onPress={executeStopQuiz}>
                         <Text style={styles.deleteConfirmText}>End Quiz</Text>
                     </TouchableOpacity>
                 </View>
             </View>
          </View>
        )}

        {!isQuizEnded && (
          <SafeAreaView edges={['bottom']} style={styles.footerAction}>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStopQuizRequest}>
              <Text style={styles.stopBtnText}>End Quiz for All</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* --- TOAST --- */}
        {toast.visible && (
          <Animated.View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: toastAnim }] }]}>
             <FontAwesome5 name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} size={16} color="#fff" />
             <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}

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

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1 },

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

  /* Footer */
  footerAction: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  stopBtn: { backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  stopBtnText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },

  /* Toast */
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems:'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* Confirmation Card */
  confirmOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center', zIndex: 1000 },
  confirmBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, width: '100%', borderWidth: 1, borderColor: '#f1f5f9' },
  confirmTextContainer: { flex: 1, marginRight: 10 },
  confirmTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  confirmSub: { fontSize: 12, color: '#64748b' },
  confirmActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f1f5f9' },
  cancelText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  deleteConfirmBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fee2e2' },
  deleteConfirmText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
});