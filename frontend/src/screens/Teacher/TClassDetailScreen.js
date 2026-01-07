import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import TeacherSidebar from "../../components/TeacherSidebar"; 
import api from "../../services/api"; 

const SIDEBAR_WIDTH = 280;

export default function ClassDetailScreen({ route, navigation }) {
  // Params
  const { classId, subject } = route.params || { classId: '9-A', subject: 'Mathematics' };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 

  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  
  // --- SYLLABUS STATE ---
  const [chapterNo, setChapterNo] = useState(""); // <--- NEW STATE
  const [topicName, setTopicName] = useState("");
  const [isNotesDone, setIsNotesDone] = useState(false);
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [isChapterDone, setIsChapterDone] = useState(false);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClassDetails();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2000);
  };

  const fetchClassDetails = async () => {
    try {
      const response = await api.get(`/teacher/classes/${classId}/${subject}`);
      const { roster, topic } = response.data;

      setRoster(roster);
      
      // Populate State
      setChapterNo(topic.chapterNo ? topic.chapterNo.toString() : ""); // <--- NEW
      setTopicName(topic.title || "");
      setIsNotesDone(topic.notesStatus === 'Done');
      setIsQuizDone(topic.quizStatus === 'Done');
      setIsChapterDone(topic.isCompleted || false);

    } catch (error) {
      console.error("Fetch Class Error:", error);
      showToast("Failed to load class data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!chapterNo.trim() || !topicName.trim()) {
        showToast("Please enter Chapter No & Name", "error");
        return;
    }

    setSaving(true);
    try {
      const payload = {
        chapterNo: chapterNo, // <--- NEW
        chapterTitle: topicName,
        notesStatus: isNotesDone,
        quizStatus: isQuizDone,
        isCompleted: isChapterDone
      };

      await api.put(`/teacher/classes/${classId}/${subject}/status`, payload);
      showToast("Class status updated!", "success");
    } catch (error) {
      console.error("Update Error:", error);
      showToast("Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper for Colors
  const getAvatarColor = (index) => {
    const colors = [{ bg: '#dcfce7', text: '#16a34a' }, { bg: '#ffedd5', text: '#f97316' }, { bg: '#eff6ff', text: '#3b82f6' }, { bg: '#f1f5f9', text: '#64748b' }];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TeacherSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeItem="MyClasses"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Class {classId}</Text>
              <Text style={styles.headerSub}>{subject.toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)}>
            <FontAwesome5 name="bars" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
        ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentPadding}>
            
            {/* 1. CONTROL PANEL */}
            <View style={styles.controlCard}>
              <View style={styles.cardTopBar} />
              
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>CURRENT STATUS</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStatus} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#4338ca"/> : <Text style={styles.saveBtnText}>Save Updates</Text>}
                </TouchableOpacity>
              </View>

              {/* --- UPDATED INPUT SECTION --- */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                  
                  {/* Chapter Number Box */}
                  <View style={{ flex: 0.3 }}>
                      <Text style={styles.inputLabel}>CH NO</Text>
                      <View style={styles.inputBox}>
                          <TextInput 
                            style={[styles.textInput, { textAlign: 'center' }]}
                            value={chapterNo}
                            onChangeText={setChapterNo}
                            placeholder="#"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                          />
                      </View>
                  </View>

                  {/* Chapter Name Box */}
                  <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CHAPTER NAME</Text>
                      <View style={styles.inputBox}>
                          <FontAwesome5 name="book-open" size={14} color="#818cf8" />
                          <TextInput 
                            style={styles.textInput}
                            value={topicName}
                            onChangeText={setTopicName}
                            placeholder="e.g. Arithmetic"
                            placeholderTextColor="#94a3b8"
                          />
                          <FontAwesome5 name="pen" size={12} color="#cbd5e1" />
                      </View>
                  </View>
              </View>

              {/* Status Toggles Grid */}
              <View style={styles.toggleGrid}>
                
                <TouchableOpacity style={[styles.statusBtn, isNotesDone ? styles.statusDone : styles.statusPending]} onPress={() => setIsNotesDone(!isNotesDone)}>
                  <View style={[styles.iconCircle, isNotesDone ? styles.iconDone : styles.iconPending]}>
                    <FontAwesome5 name={isNotesDone ? "check" : "minus"} size={10} color={isNotesDone ? "#16a34a" : "#94a3b8"} />
                  </View>
                  <Text style={[styles.statusText, isNotesDone ? {color: '#16a34a'} : {color: '#64748b'}]}>
                    Notes {isNotesDone ? 'Done' : 'Pending'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.statusBtn, isQuizDone ? styles.statusDone : styles.statusPending]} onPress={() => setIsQuizDone(!isQuizDone)}>
                  <View style={[styles.iconCircle, isQuizDone ? styles.iconDone : styles.iconPending]}>
                    <FontAwesome5 name={isQuizDone ? "check" : "minus"} size={10} color={isQuizDone ? "#16a34a" : "#94a3b8"} />
                  </View>
                  <Text style={[styles.statusText, isQuizDone ? {color: '#16a34a'} : {color: '#64748b'}]}>
                    Quiz {isQuizDone ? 'Done' : 'Pending'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.statusBtn, isChapterDone ? styles.statusDone : styles.statusPending]} onPress={() => setIsChapterDone(!isChapterDone)}>
                  <View style={[styles.iconCircle, isChapterDone ? styles.iconDone : styles.iconPending]}>
                    <FontAwesome5 name={isChapterDone ? "check" : "minus"} size={10} color={isChapterDone ? "#16a34a" : "#94a3b8"} />
                  </View>
                  <Text style={[styles.statusText, isChapterDone ? {color: '#16a34a'} : {color: '#64748b'}]}>
                    Chapter {isChapterDone ? 'Done' : 'Ongoing'}
                  </Text>
                </TouchableOpacity>

              </View>
            </View>

            {/* 2. ROSTER HEADER */}
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>STUDENT ROSTER ({roster.length})</Text>
              <TouchableOpacity>
                <FontAwesome5 name="sort" size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* 3. STUDENT LIST */}
            <View style={styles.rosterList}>
              {roster.length > 0 ? roster.map((student, index) => {
                const colors = getAvatarColor(index);
                const avgScore = student.stats?.avgScore ? Math.round(student.stats.avgScore) + "%" : "0%";
                return (
                <TouchableOpacity key={student._id} style={styles.studentCard} onPress={() => navigation.navigate('TStudentDetail', { studentId: student._id })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.avatarBox, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.avatarText, { color: colors.text }]}>{student.name.substring(0,2).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.rollNo}>Roll No. {student.rollNo}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.scoreBadge, { backgroundColor: '#f8fafc' }]}>
                      <Text style={[styles.scoreText, { color: '#64748b' }]}>{avgScore}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
                )}) : (
                  <Text style={{textAlign:'center', color:'#94a3b8', marginTop:10}}>No students found in this class.</Text>
                )}
            </View>

          </View>
        </ScrollView>
        )}

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyClasses')}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color="#4f46e5" />
            <Text style={styles.navLabel}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDirectory')}>
            <FontAwesome5 name="users" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Students</Text>
          </TouchableOpacity>
        </View>

        {/* --- TOAST NOTIFICATION --- */}
        {toast.visible && (
          <Animated.View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: toastAnim }] }]} pointerEvents="none">
             <FontAwesome5 name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} size={16} color="#fff" />
             <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', marginTop: 2 },
  menuButton: { padding: 4 },
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  controlCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 24, overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#4f46e5' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { fontSize: 10, fontWeight: 'bold', color: '#4338ca' },
  inputLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 },
  textInput: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  toggleGrid: { flexDirection: 'row', gap: 12 },
  statusBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  statusDone: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fff', borderColor: '#e2e8f0', borderStyle: 'dashed' },
  iconCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: '#dcfce7' },
  iconPending: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  rosterTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  rosterList: { gap: 8 },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: 'bold' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rollNo: { fontSize: 10, color: '#64748b' },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scoreText: { fontSize: 10, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10, position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});