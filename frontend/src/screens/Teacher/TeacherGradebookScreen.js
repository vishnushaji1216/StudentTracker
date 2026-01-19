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
  BackHandler // <--- Added
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../../services/api'; 
import TeacherSidebar from '../../components/TeacherSidebar'; // <--- Added

export default function TeacherGradebookScreen({ navigation, route }) {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form State
  const [examTitle, setExamTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState('20'); 
  const [className, setClassName] = useState('9-A'); 
  
  // Subject Picker State
  const [subject, setSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]); 
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Marks State
  const [marksMap, setMarksMap] = useState({});

  // --- TOAST STATE & ANIMATION ---
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(-100)).current; 

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    loadInitialData();
  }, []);

  // --- BACK HANDLER (Close Sidebar First) ---
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true; // Handle the event (don't exit)
      }
      return false; // Default behavior (exit/back)
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/teacher/students?className=${className}`);
      setStudents(studentRes.data);
      
      const subjectRes = await api.get(`/teacher/my-subjects?className=${className}`);
      const subs = subjectRes.data; 
      setAvailableSubjects(subs);
      
      if (subs.length > 0) setSubject(subs[0]);

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

  // --- TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    
    Animated.spring(toastAnim, {
      toValue: 50, 
      useNativeDriver: true,
      tension: 50,
      friction: 10
    }).start();

    setTimeout(() => {
      hideToast();
    }, 2500);
  };

  const hideToast = () => {
    Animated.timing(toastAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => setToast(t => ({ ...t, visible: false })));
  };

  // --- HANDLERS ---
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
        .map(id => ({
            studentId: id,
            marks: Number(marksMap[id])
        }));

    if (studentMarksArray.length === 0) {
        showToast("Please enter marks for at least one student", "error");
        return;
    }

    setSubmitting(true);

    try {
        await api.post('/teacher/gradebook/submit', {
            className,
            subject,
            examTitle,
            totalMarks,
            studentMarks: studentMarksArray
        });
        
        showToast("Grades published successfully!", "success");
        setTimeout(() => {
            // Optional: Reset form or Navigate
             setMarksMap({});
             setExamTitle('');
        }, 1500); 
        
    } catch (error) {
        console.error(error);
        showToast("Failed to submit grades", "error");
    } finally {
        setSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
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
            />
            <Text style={styles.totalText}>/ {maxDisplay}</Text>
        </View>
      </View>
    );
  };

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR COMPONENT --- */}
      <TeacherSidebar 
        navigation={navigation} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeItem="Gradebook" // Matches the label in Sidebar
      />
      
      {/* HEADER */}
      <View style={styles.header}>
        {/* Changed from Arrow Back to Menu Bars */}
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.backBtn}>
            <FontAwesome5 name="bars" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gradebook Entry</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
            
            {/* 1. EXAM DETAILS CARD */}
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
            </View>

            {/* 2. STUDENT LIST */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Student Marks ({students.length})</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4f46e5" style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={item => item._id}
                    renderItem={renderStudentRow}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>

        {/* FOOTER BUTTON */}
        <View style={styles.footer}>
            <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.disabledBtn]} 
                onPress={handleSubmit}
                disabled={submitting}
            >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                    <>
                        <FontAwesome5 name="check-circle" size={18} color="#fff" />
                        <Text style={styles.submitText}>Publish Results</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* --- SUBJECT SELECTION MODAL --- */}
      <Modal visible={showSubjectPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Subject</Text>
                {availableSubjects.map((sub, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.modalItem}
                        onPress={() => {
                            setSubject(sub);
                            setShowSubjectPicker(false);
                        }}
                    >
                        <Text style={[
                            styles.modalItemText, 
                            subject === sub && {color: '#4f46e5', fontWeight: 'bold'}
                        ]}>
                            {sub}
                        </Text>
                        {subject === sub && <FontAwesome5 name="check" size={14} color="#4f46e5" />}
                    </TouchableOpacity>
                ))}
                <TouchableOpacity 
                    style={styles.modalClose} 
                    onPress={() => setShowSubjectPicker(false)}
                >
                    <Text style={{color:'#ef4444', fontWeight:'bold'}}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* --- MODERN FLOATING TOAST --- */}
      <Animated.View 
        style={[
            styles.toastContainer, 
            { transform: [{ translateY: toastAnim }] },
            toast.type === 'error' ? styles.toastError : styles.toastSuccess
        ]}
      >
        <FontAwesome5 
            name={toast.type === 'error' ? "exclamation-circle" : "check-circle"} 
            size={20} 
            color="#fff" 
        />
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
  
  content: { flex: 1, padding: 20 },
  
  metaCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  
  dropdownTrigger: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { fontSize: 14, color: '#1e293b', fontWeight:'500' },

  listHeader: { marginBottom: 10 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },

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
  modalClose: { marginTop: 15, alignItems: 'center', padding: 10 },

  /* --- TOAST STYLES --- */
  toastContainer: {
    position: 'absolute',
    top: 0, 
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10, 
    zIndex: 9999,
    gap: 12
  },
  toastSuccess: { backgroundColor: '#16a34a' }, 
  toastError: { backgroundColor: '#ef4444' },   
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14, flex: 1 }
});