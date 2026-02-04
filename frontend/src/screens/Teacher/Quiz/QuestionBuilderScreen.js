import React, { useState, useRef } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Animated 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import api from "../../../services/api";

export default function QuestionBuilderScreen({ route, navigation }) {
  // 1. Get Setup Data
  const { setupData } = route.params;
  
  // --- SEPARATE LOADING STATES ---
  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  
  // 2. Initialize Questions
  const [questions, setQuestions] = useState([
    { questionText: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1 }
  ]);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 

  // --- HANDLERS (Unchanged) ---
  const handleQuestionChange = (text, index) => {
    const newQ = [...questions];
    newQ[index].questionText = text;
    setQuestions(newQ);
  };

  const handleOptionChange = (text, qIndex, optIndex) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex] = text;
    setQuestions(newQ);
  };

  const handleCorrectAnswer = (qIndex, optIndex) => {
    const newQ = [...questions];
    newQ[qIndex].correctAnswer = optIndex;
    setQuestions(newQ);
  };

  const handleMarksChange = (text, index) => {
    const newQ = [...questions];
    newQ[index].marks = text.replace(/[^0-9]/g, ''); 
    setQuestions(newQ);
  };

  const handleDeleteQuestion = (index) => {
    if (questions.length === 1) return;
    const newQ = questions.filter((_, i) => i !== index);
    setQuestions(newQ);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1 }
    ]);
  };

  // --- SUBMIT LOGIC (FIXED) ---
  const handleSubmit = async (isDraftRequest = false) => {
    // 1. Validation (Only strictly validate if Publishing)
    if (!isDraftRequest) {
        const isValid = questions.every(q => q.questionText.trim() && q.options.every(opt => opt.trim()));
        if (!isValid) {
            showToast("Please fill all fields to publish", "error");
            return;
        }
    }

    // 2. Set Specific Loading State
    if (isDraftRequest) setDraftLoading(true);
    else setPublishLoading(true);

    try {
        let finalStatus = 'Draft';
        let finalReleaseType = setupData.releaseType;

        if (isDraftRequest) {
            finalStatus = 'Draft';
            // OPTIONAL: Force releaseType to 'Later' or undefined for drafts 
            // to prevent backend from auto-activating based on 'Now'.
            finalReleaseType = undefined; 
        } else {
            // Publishing Logic
            if (setupData.releaseType === 'Later') {
                finalStatus = 'Scheduled';
            } else {
                finalStatus = 'Active';
            }
        }

        const payload = {
            ...setupData,
            releaseType: finalReleaseType, // Override setupData's releaseType
            questions: questions.map(q => ({ ...q, marks: Number(q.marks) || 1 })),
            status: finalStatus
        };

        // console.log("Sending Payload:", payload); // Debug if needed

        await api.post('/teacher/quizzes', payload);
        
        const successMsg = isDraftRequest ? "Saved to Drafts!" : "Quiz Published!";
        showToast(successMsg, "success");
        
        setTimeout(() => navigation.popToTop(), 1500);

    } catch (error) {
        console.error(error);
        showToast("Failed to save quiz", "error");
    } finally {
        setDraftLoading(false);
        setPublishLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2000);
  };

  const anyLoading = draftLoading || publishLoading;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={anyLoading}>
                <FontAwesome5 name="arrow-left" size={20} color="#64748b"/>
            </TouchableOpacity>
            <View>
                <Text style={styles.headerTitle}>Add Questions</Text>
                <Text style={styles.headerSub}>{setupData.title}</Text>
            </View>
            <View style={{width: 20}}/>
        </View>
        
        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 120}}>
           {questions.map((q, qIndex) => (
               <View key={qIndex} style={styles.qCard}>
                   <View style={styles.qHeader}>
                       <Text style={styles.qIndex}>Question {qIndex + 1}</Text>
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
                     placeholder="Type question here..."
                     onChangeText={(text) => handleQuestionChange(text, qIndex)}
                   />
                   <View style={styles.optContainer}>
                       {q.options.map((opt, optIndex) => (
                           <View key={optIndex} style={styles.optRow}>
                               <TouchableOpacity style={styles.radio} onPress={() => handleCorrectAnswer(qIndex, optIndex)}>
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

        <View style={styles.footer}>
            {/* Draft Button */}
            <TouchableOpacity 
                style={[styles.footerBtn, styles.draftBtn]} 
                onPress={() => handleSubmit(true)} 
                disabled={anyLoading}
            >
                {draftLoading ? (
                    <ActivityIndicator size="small" color="#475569" />
                ) : (
                    <Text style={styles.draftText}>Save Draft</Text>
                )}
            </TouchableOpacity>

            {/* Publish Button */}
            <TouchableOpacity 
                style={[styles.footerBtn, styles.publishBtn]} 
                onPress={() => handleSubmit(false)} 
                disabled={anyLoading}
            >
                {publishLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Text style={styles.publishText}>Publish Quiz</Text>
                        <FontAwesome5 name="check" size={14} color="#fff" />
                    </>
                )}
            </TouchableOpacity>
        </View>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b' },
  qCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  qIndex: { fontWeight: 'bold', color: '#4f46e5', fontSize: 14 },
  markBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  markLabel: { fontSize: 12, color: '#64748b', fontWeight:'600' },
  markInput: { minWidth: 20, padding: 0, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  qInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 12, marginBottom: 16, color: '#1e293b', fontSize: 15, textAlignVertical: 'top', minHeight: 60 },
  optContainer: { gap: 10 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { padding: 4 },
  radioDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1' },
  radioActive: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  optInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 10, borderRadius: 8, fontSize: 14, color: '#334155' },
  optInputActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', marginTop: 10 },
  addBtnText: { color: '#64748b', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  draftBtn: { backgroundColor: '#f1f5f9' },
  draftText: { color: '#475569', fontWeight: 'bold' },
  publishBtn: { backgroundColor: '#4f46e5' },
  publishText: { color: '#fff', fontWeight: 'bold' },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});