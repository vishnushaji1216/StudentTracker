import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Keyboard,
  BackHandler,
  LayoutAnimation,
  UIManager
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../../services/api'; 
import TeacherSidebar from '../../components/TeacherSidebar'; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- 1. DEFINE HEADER COMPONENT OUTSIDE (Fixes Keyboard Bug) ---
const GradebookHeader = ({ 
    examTitle, setExamTitle, 
    totalMarks, setTotalMarks, 
    subject, setShowSubjectPicker, 
    studentsCount, 
    isEnteringMarks, onDonePress 
}) => {
    
    // Compact Mode (When typing marks)
    if (isEnteringMarks) {
        return (
            <View style={styles.compactHeader}>
                <View>
                    <Text style={styles.compactLabel}>Exam Title</Text>
                    <Text style={styles.compactTitle} numberOfLines={1}>
                        {examTitle || "Untitled Exam"}
                    </Text>
                </View>
                <TouchableOpacity onPress={onDonePress} style={styles.doneBtn}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Expanded Mode (Default)
    return (
        <View style={styles.metaCard}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Exam Title</Text>
                <TextInput 
                    style={styles.textInput} 
                    placeholder="e.g. Weekly Test 4" 
                    value={examTitle}
                    onChangeText={setExamTitle}
                />
            </View>
            <View style={{flexDirection:'row', gap:15}}>
                <View style={[styles.inputGroup, {flex:0.6}]}>
                    <Text style={styles.label}>Max Marks</Text>
                    <TextInput 
                        style={[styles.textInput, {textAlign:'center', fontWeight:'bold'}]} 
                        placeholder="100" 
                        keyboardType="numeric"
                        value={totalMarks}
                        onChangeText={setTotalMarks}
                    />
                </View>

                <View style={[styles.inputGroup, {flex:1.4}]}>
                    <Text style={styles.label}>Subject</Text>
                    <TouchableOpacity 
                        style={styles.dropdownTrigger}
                        onPress={() => setShowSubjectPicker(true)}
                    >
                        <Text style={styles.dropdownText}>
                            {subject || "Select Subject"}
                        </Text>
                        <FontAwesome5 name="chevron-down" size={12} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={styles.divider} />
            <Text style={styles.listTitle}>Student Marks ({studentsCount})</Text>
        </View>
    );
};

// --- MAIN COMPONENT ---
export default function TeacherGradebookScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form State
  const [examTitle, setExamTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState('25'); 
  const [className, setClassName] = useState('');
  
  // Subject State
  const [subject, setSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]); 
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Marks State
  const [marksMap, setMarksMap] = useState({});

  // Focus Mode
  const [isEnteringMarks, setIsEnteringMarks] = useState(false);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(-100)).current; 

  // --- EFFECTS ---
  useEffect(() => {
    loadInitialData();
  }, []);

  // Detect Keyboard Close
  useEffect(() => {
    const kListener = Keyboard.addListener('keyboardDidHide', () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsEnteringMarks(false);
    });
    return () => kListener.remove();
  }, []);

  // Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true; 
      }
      if (isEnteringMarks) {
        Keyboard.dismiss();
        return true;
      }
      return false; 
    });
    return () => backHandler.remove();
  }, [isSidebarOpen, isEnteringMarks]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/teacher/profile');
      const teacherClass = profileRes.data.classTeachership || profileRes.data.assignedClass; 

      if (!teacherClass) {
        showToast("No class assigned to teacher", "error");
        setLoading(false);
        return;
      }
      setClassName(teacherClass);

      const studentRes = await api.get(`/teacher/students?className=${teacherClass}`);
      setStudents(studentRes.data);
      
      const subjectRes = await api.get(`/teacher/class-subjects?className=${teacherClass}`);
      const subs = subjectRes.data; 
      if (subs && subs.length > 0) {
          setAvailableSubjects(subs);
          setSubject(subs[0]);
      }

      const initialMap = {};
      studentRes.data.forEach(s => initialMap[s._id] = '');
      setMarksMap(initialMap);

    } catch (error) {
      console.error(error);
      showToast("Failed to load class data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    if (value && isNaN(value)) return; 
    const max = Number(totalMarks) || 100;
    if (Number(value) > max) {
        showToast(`Marks cannot exceed ${max}`, "error");
        return; 
    }
    setMarksMap(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async () => {
    Keyboard.dismiss(); 
    if (!examTitle.trim() || !totalMarks || !subject) {
        showToast("Please fill all exam details", "error");
        return;
    }
    const studentMarksArray = Object.keys(marksMap)
        .filter(id => marksMap[id] !== '')
        .map(id => ({ studentId: id, marks: Number(marksMap[id]) }));

    if (studentMarksArray.length === 0) {
        showToast("Please enter marks for at least one student", "error");
        return;
    }

    setSubmitting(true);
    try {
        await api.post('/teacher/gradebook/submit', {
            className, subject, examTitle, totalMarks, studentMarks: studentMarksArray
        });
        showToast("Grades published successfully!", "success");
        setTimeout(() => { setMarksMap({}); setExamTitle(''); }, 1500); 
    } catch (error) {
        showToast("Failed to submit grades", "error");
    } finally {
        setSubmitting(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 50, useNativeDriver: true }).start();
    setTimeout(() => {
        Animated.timing(toastAnim, { toValue: -100, useNativeDriver: true }).start(() => setToast(t => ({ ...t, visible: false })));
    }, 2500);
  };

  const renderStudentRow = ({ item }) => {
    const maxDisplay = totalMarks && totalMarks.length > 0 ? totalMarks : '-';
    return (
      <View style={styles.studentRow}>
        <View style={styles.studentInfo}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.substring(0,2).toUpperCase()}</Text>
            </View>
            <View>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.rollNo}>Roll No: {item.rollNo}</Text>
            </View>
        </View>
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.markInput}
                keyboardType="numeric"
                placeholder="0"
                maxLength={3}
                value={marksMap[item._id]}
                onChangeText={(text) => handleMarkChange(item._id, text)}
                onFocus={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsEnteringMarks(true);
                }}
            />
            <Text style={styles.totalText}>/ {maxDisplay}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TeacherSidebar navigation={navigation} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} activeItem="Gradebook" />
      
      {/* HEADER (Hide main header when typing marks to save space) */}
      {!isEnteringMarks && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.backBtn}>
                <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gradebook ({className})</Text>
          </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{marginTop: 50}} />
        ) : (
            <FlatList
                data={students}
                keyExtractor={item => item._id}
                renderItem={renderStudentRow}
                // --- 2. PASS COMPONENT WITH PROPS ---
                ListHeaderComponent={
                    <GradebookHeader 
                        examTitle={examTitle}
                        setExamTitle={setExamTitle}
                        totalMarks={totalMarks}
                        setTotalMarks={setTotalMarks}
                        subject={subject}
                        setShowSubjectPicker={setShowSubjectPicker}
                        studentsCount={students.length}
                        isEnteringMarks={isEnteringMarks}
                        onDonePress={Keyboard.dismiss}
                    />
                }
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                stickyHeaderIndices={[0]} // Keeps the compact/full header visible while scrolling
            />
        )}

        <View style={styles.footer}>
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : (
                    <><FontAwesome5 name="check-circle" size={18} color="#fff" /><Text style={styles.submitText}>Publish Results</Text></>
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* MODAL & TOAST */}
      <Modal visible={showSubjectPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Subject</Text>
                {availableSubjects.length > 0 ? availableSubjects.map((sub, index) => (
                    <TouchableOpacity key={index} style={styles.modalItem} onPress={() => { setSubject(sub); setShowSubjectPicker(false); }}>
                        <Text style={[styles.modalItemText, subject === sub && {color: '#4f46e5', fontWeight: 'bold'}]}>{sub}</Text>
                        {subject === sub && <FontAwesome5 name="check" size={14} color="#4f46e5" />}
                    </TouchableOpacity>
                )) : <Text style={styles.emptyText}>No subjects found.</Text>}
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowSubjectPicker(false)}>
                    <Text style={{color:'#ef4444', fontWeight:'bold'}}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
        <FontAwesome5 name={toast.type === 'error' ? "exclamation-circle" : "check-circle"} size={20} color="#fff" />
        <Text style={styles.toastText}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', zIndex: 1 },
  backBtn: { paddingRight: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  /* Meta Card */
  metaCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  dropdownTrigger: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { fontSize: 14, color: '#1e293b', fontWeight:'500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },

  /* Compact Header */
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4f46e5', padding: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 10, shadowColor: '#4f46e5', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  compactLabel: { color: '#e0e7ff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  compactTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', maxWidth: 250 },
  doneBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  doneText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 12 },

  /* List Items */
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#4f46e5' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rollNo: { fontSize: 12, color: '#94a3b8' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markInput: { width: 60, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, textAlign: 'center', paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalText: { color: '#94a3b8', fontWeight: 'bold' },

  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 16 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabledBtn: { opacity: 0.7 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection:'row', justifyContent:'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemText: { fontSize: 14, color: '#334155' },
  emptyText: { textAlign: 'center', color:'#94a3b8', marginVertical: 10 },
  modalClose: { marginTop: 15, alignItems: 'center', padding: 10 },

  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10, zIndex: 9999, gap: 12 },
  toastSuccess: { backgroundColor: '#16a34a' }, 
  toastError: { backgroundColor: '#ef4444' },   
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14, flex: 1 }
});