import React, { useEffect, useState, useRef } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Animated, Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import DateTimePicker from '@react-native-community/datetimepicker'; 
import api from "../../../services/api";

export default function QuizEditScreen({ route, navigation }) {
  const { quizId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Quiz Metadata
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [passingScore, setPassingScore] = useState('');
  
  // --- NEW: Status State ---
  const [targetStatus, setTargetStatus] = useState('Draft'); // Draft, Active, Scheduled
  
  // Schedule State
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState([]);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 

  useEffect(() => {
    fetchQuizData();
  }, []);

  const fetchQuizData = async () => {
    try {
      const response = await api.get(`/teacher/quizzes/${quizId}`);
      const q = response.data;
      
      setTitle(q.title);
      setDuration(q.duration.toString());
      setPassingScore(q.passingScore ? q.passingScore.toString() : '40');
      
      // Initialize Status
      setTargetStatus(q.status);
      
      if (q.scheduledAt) {
        setScheduleDate(new Date(q.scheduledAt));
      }

      setQuestions(q.questions || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load quiz details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // --- QUESTION HANDLERS (Unchanged) ---
  const handleQuestionChange = (text, index) => {
    const newQ = [...questions]; newQ[index].questionText = text; setQuestions(newQ);
  };
  const handleOptionChange = (text, qIndex, optIndex) => {
    const newQ = [...questions]; newQ[qIndex].options[optIndex] = text; setQuestions(newQ);
  };
  const handleCorrectAnswer = (qIndex, optIndex) => {
    const newQ = [...questions]; newQ[qIndex].correctAnswer = optIndex; setQuestions(newQ);
  };
  const handleMarksChange = (text, index) => {
    const newQ = [...questions]; newQ[index].marks = Number(text); setQuestions(newQ);
  };
  const handleDeleteQuestion = (index) => {
    const newQ = questions.filter((_, i) => i !== index); setQuestions(newQ);
    showToast("Question deleted", "error"); 
  };
  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1 }]);
  };

  // --- SCHEDULE HANDLERS ---
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
        const newDate = new Date(scheduleDate);
        newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setScheduleDate(newDate);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
        const newDate = new Date(scheduleDate);
        newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        setScheduleDate(newDate);
    }
  };

  // --- SAVE ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2000);
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) { showToast("Title is required", "error"); return; }
    if (questions.some(q => !q.questionText || q.options.some(o => !o))) {
        showToast("Please fill all empty fields", "error"); return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        duration: Number(duration),
        passingScore: Number(passingScore),
        questions: questions,
        // --- KEY CHANGE: Send the selected status ---
        status: targetStatus, 
        // Only send scheduledAt if status is Scheduled
        scheduledAt: targetStatus === 'Scheduled' ? scheduleDate : undefined 
      };

      await api.put(`/teacher/quizzes/${quizId}`, payload);
      
      showToast("Quiz Updated Successfully!", "success");
      setTimeout(() => navigation.goBack(), 1200);

    } catch (err) {
      console.error(err);
      showToast("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  // Date Formatters
  const formatDate = (d) => d.toLocaleDateString();
  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5"/></View>;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <FontAwesome5 name="arrow-left" size={20} color="#64748b"/>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Quiz</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#4f46e5"/> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
        </View>
        
        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
           
           {/* Settings Card */}
           <View style={styles.card}>
               <Text style={styles.cardHeader}>SETTINGS</Text>
               
               <Text style={styles.label}>Quiz Title</Text>
               <TextInput style={styles.input} value={title} onChangeText={setTitle} />
               
               <View style={styles.row}>
                   <View style={{flex:1}}>
                       <Text style={styles.label}>Duration (min)</Text>
                       <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />
                   </View>
                   <View style={{width: 15}}/>
                   <View style={{flex:1}}>
                       <Text style={styles.label}>Pass Score (%)</Text>
                       <TextInput style={styles.input} value={passingScore} onChangeText={setPassingScore} keyboardType="numeric" />
                   </View>
               </View>

               {/* --- NEW: STATUS SELECTOR --- */}
               <Text style={[styles.label, {marginTop: 5}]}>Quiz Status</Text>
               <View style={styles.statusRow}>
                  {['Draft', 'Active', 'Scheduled'].map((opt) => (
                    <TouchableOpacity 
                        key={opt}
                        style={[styles.statusBtn, targetStatus === opt && styles.statusBtnActive]}
                        onPress={() => setTargetStatus(opt)}
                    >
                        <Text style={[styles.statusBtnText, targetStatus === opt && styles.statusBtnTextActive]}>
                            {opt === 'Active' ? 'Live Now' : opt}
                        </Text>
                    </TouchableOpacity>
                  ))}
               </View>

               {/* Reschedule Section (Only if Scheduled) */}
               {targetStatus === 'Scheduled' && (
                 <View style={{marginTop: 15, padding: 10, backgroundColor: '#fff7ed', borderRadius: 8, borderWidth: 1, borderColor: '#fed7aa'}}>
                    <Text style={[styles.label, {color:'#c2410c', marginBottom: 8}]}>Schedule Launch Time</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                            <FontAwesome5 name="calendar-alt" size={14} color="#64748b" />
                            <Text style={styles.pickerText}>{formatDate(scheduleDate)}</Text>
                        </TouchableOpacity>
                        <View style={{width: 10}}/>
                        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                            <FontAwesome5 name="clock" size={14} color="#64748b" />
                            <Text style={styles.pickerText}>{formatTime(scheduleDate)}</Text>
                        </TouchableOpacity>
                    </View>
                 </View>
               )}
           </View>

           {/* Questions List (Unchanged) */}
           <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
              <Text style={styles.sectionTitle}>QUESTIONS ({questions.length})</Text>
           </View>
           
           {questions.map((q, qIndex) => (
               <View key={qIndex} style={styles.qCard}>
                   <View style={styles.qHeader}>
                       <Text style={styles.qIndex}>Q{qIndex + 1}</Text>
                       <View style={{flexDirection:'row', gap: 10, alignItems:'center'}}>
                           <View style={styles.markBox}>
                               <Text style={styles.markLabel}>Marks:</Text>
                               <TextInput 
                                   style={styles.markInput} 
                                   value={q.marks.toString()} 
                                   keyboardType="numeric"
                                   onChangeText={(t) => handleMarksChange(t, qIndex)}
                               />
                           </View>
                           <TouchableOpacity onPress={() => handleDeleteQuestion(qIndex)}>
                               <FontAwesome5 name="trash" size={14} color="#ef4444" />
                           </TouchableOpacity>
                       </View>
                   </View>
                   
                   <TextInput 
                     style={styles.qInput} 
                     value={q.questionText} 
                     multiline
                     placeholder="Enter question text..."
                     onChangeText={(text) => handleQuestionChange(text, qIndex)}
                   />
                   
                   <View style={styles.optContainer}>
                       {q.options.map((opt, optIndex) => (
                           <View key={optIndex} style={styles.optRow}>
                               <TouchableOpacity 
                                  style={styles.radio} 
                                  onPress={() => handleCorrectAnswer(qIndex, optIndex)}
                               >
                                  <View style={[styles.radioDot, q.correctAnswer === optIndex && styles.radioActive]} />
                               </TouchableOpacity>
                               <TextInput 
                                  style={[styles.optInput, q.correctAnswer === optIndex && styles.optInputActive]}
                                  value={opt}
                                  placeholder={`Option ${String.fromCharCode(65+optIndex)}`}
                                  onChangeText={(t) => handleOptionChange(t, qIndex, optIndex)}
                               />
                           </View>
                       ))}
                   </View>
               </View>
           ))}

           <TouchableOpacity style={styles.addBtn} onPress={handleAddQuestion}>
               <FontAwesome5 name="plus" size={14} color="#4f46e5" />
               <Text style={styles.addBtnText}>Add New Question</Text>
           </TouchableOpacity>

        </ScrollView>

        {/* Pickers Modal */}
        {showDatePicker && (
            <DateTimePicker value={scheduleDate} mode="date" display="default" onChange={onChangeDate} />
        )}
        {showTimePicker && (
            <DateTimePicker value={scheduleDate} mode="time" display="default" onChange={onChangeTime} />
        )}

        {/* Toast */}
        {toast.visible && (
          <Animated.View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: toastAnim }] }]}>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  saveText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 16 },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  label: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 10, borderRadius: 8, marginBottom: 15, fontWeight: '600', color: '#1e293b' },
  row: { flexDirection: 'row' },
  
  // Status Selector Styles
  statusRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 8, marginBottom: 15 },
  statusBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  statusBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusBtnTextActive: { color: '#4f46e5', fontWeight: 'bold' },

  // Picker Styles
  pickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12 },
  pickerText: { fontWeight: 'bold', color: '#1e293b' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginLeft: 4 },
  
  // Question Card Styles
  qCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  qIndex: { fontWeight: 'bold', color: '#4f46e5', fontSize: 16 },
  markBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 6, borderRadius: 4 },
  markLabel: { fontSize: 12, color: '#64748b' },
  markInput: { width: 30, padding: 2, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  qInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 10, borderRadius: 8, marginBottom: 16, color: '#1e293b', textAlignVertical: 'top' },
  
  // Options Styles
  optContainer: { gap: 8 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { padding: 4 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1' },
  radioActive: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  optInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 8, borderRadius: 8, fontSize: 13 },
  optInputActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },

  // Add Button
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#eef2ff', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#818cf8', marginTop: 10 },
  addBtnText: { color: '#4f46e5', fontWeight: 'bold' },

  // Toast
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});