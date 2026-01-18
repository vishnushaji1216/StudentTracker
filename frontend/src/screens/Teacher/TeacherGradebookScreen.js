import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../../services/api'; 

export default function TeacherGradebookScreen({ navigation, route }) {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  
  // Form State
  const [examTitle, setExamTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState('20'); // Default to 20 or 100
  
  // Context: These ideally come from the previous screen or Teacher Profile
  // For now, we default, but logic handles fetching subjects for THIS class
  const [className, setClassName] = useState('9-A'); 
  
  // Subject Picker State
  const [subject, setSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]); // ['Math', 'Physics']
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Marks State
  const [marksMap, setMarksMap] = useState({});

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Students for Class 9-A
      const studentRes = await api.get(`/teacher/students?className=${className}`);
      setStudents(studentRes.data);
      
      // 2. Fetch Subjects THIS Teacher teaches to Class 9-A
      // Endpoint logic: Backend checks Teacher's 'assignments' array for this class
      const subjectRes = await api.get(`/teacher/my-subjects?className=${className}`);
      
      const subs = subjectRes.data; // Expecting ['Mathematics', 'Physics']
      setAvailableSubjects(subs);
      
      // Auto-select first subject if available
      if (subs.length > 0) setSubject(subs[0]);

      // Initialize marks map
      const initialMap = {};
      studentRes.data.forEach(s => initialMap[s._id] = '');
      setMarksMap(initialMap);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleMarkChange = (studentId, value) => {
    // Validation
    if (value && isNaN(value)) return; 
    
    // Check Max Marks
    const max = Number(totalMarks) || 100;
    if (Number(value) > max) {
        // Optional: Show toast or red border, avoiding Alert for every keystroke
        return; 
    }
    setMarksMap(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async () => {
    if (!examTitle.trim() || !totalMarks || !subject) {
        Alert.alert("Missing Info", "Please fill all exam details");
        return;
    }

    const studentMarksArray = Object.keys(marksMap)
        .filter(id => marksMap[id] !== '')
        .map(id => ({
            studentId: id,
            marks: Number(marksMap[id])
        }));

    if (studentMarksArray.length === 0) {
        Alert.alert("Empty Gradebook", "Please enter marks for at least one student.");
        return;
    }

    setSubmitting(true);

    try {
        await api.post('/teacher/gradebook/submit', {
            className,
            subject, // Now selected from Dropdown
            examTitle,
            totalMarks,
            studentMarks: studentMarksArray
        });
        
        Alert.alert("Success", "Grades published successfully!", [
            { text: "OK", onPress: () => navigation.goBack() }
        ]);
        
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to submit grades.");
    } finally {
        setSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderStudentRow = ({ item }) => {
    // Dynamic Max Marks Display
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
            {/* Auto-reflects the value from the top box */}
            <Text style={styles.totalText}>/ {maxDisplay}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Grade Entry</Text>
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
                    
                    {/* Max Marks Input */}
                    <View style={[styles.inputGroup, {flex:0.6}]}>
                        <Text style={styles.label}>Max Marks</Text>
                        <TextInput 
                            style={[styles.textInput, {textAlign:'center', fontWeight:'bold'}]} 
                            placeholder="100" 
                            keyboardType="numeric"
                            value={totalMarks}
                            onChangeText={setTotalMarks} // Directly updates state
                        />
                    </View>

                    {/* Subject Dropdown Trigger */}
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { paddingRight: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  content: { flex: 1, padding: 20 },
  
  /* Meta Card */
  metaCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  
  /* Dropdown Styles */
  dropdownTrigger: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { fontSize: 14, color: '#1e293b', fontWeight:'500' },

  /* List */
  listHeader: { marginBottom: 10 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },

  /* Row */
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#4f46e5' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rollNo: { fontSize: 12, color: '#94a3b8' },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markInput: { width: 60, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, textAlign: 'center', paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalText: { color: '#94a3b8', fontWeight: 'bold' },

  /* Footer */
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 16 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabledBtn: { opacity: 0.7 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection:'row', justifyContent:'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemText: { fontSize: 14, color: '#334155' },
  modalClose: { marginTop: 15, alignItems: 'center', padding: 10 }
});