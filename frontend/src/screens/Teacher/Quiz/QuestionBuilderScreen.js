import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import api from "../../../services/api";

export default function QuestionBuilderScreen({ route, navigation }) {
  const { setupData } = route.params;

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Current Question Input State
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0); 
  const [marks, setMarks] = useState('1');

  // --- TOAST FUNCTION ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    
    // Auto Hide
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
      });
    }, 2000);
  };

  const addQuestion = () => {
    // Validation using Toast
    if (!qText.trim()) {
        showToast("Please enter a question text", "error");
        return;
    }
    if (options.some(o => !o.trim())) {
        showToast("Please fill all 4 options", "error");
        return;
    }

    const newQ = {
      questionText: qText,
      options: [...options],
      correctAnswer: correctIdx,
      marks: parseInt(marks) || 1
    };

    setQuestions([...questions, newQ]);

    // Reset Form
    setQText('');
    setOptions(['', '', '', '']);
    setCorrectIdx(0);
    setMarks('1');
    
    // Optional: Small success feedback for adding
    // showToast("Question Added", "success"); 
  };

  const handleOptionChange = (text, index) => {
    const newOpts = [...options];
    newOpts[index] = text;
    setOptions(newOpts);
  };

  const handlePublish = async () => {
    // 1. Check current input status
    const isCurrentQuestionEmpty = !qText.trim() && options.every(o => !o.trim());
    const isCurrentQuestionComplete = qText.trim() && options.every(o => o.trim());
    
    let finalQuestions = [...questions];

    // 2. Logic to Handle "Pending" Question
    if (!isCurrentQuestionEmpty) {
        if (isCurrentQuestionComplete) {
            // Auto-add the current question
            finalQuestions.push({
                questionText: qText,
                options: [...options],
                correctAnswer: correctIdx,
                marks: parseInt(marks) || 1
            });
        } else {
            // Alert user to fix the partial data
            showToast("Please complete the current question or clear it.", "error");
            return; 
        }
    }

    // 3. Final Check
    if (finalQuestions.length === 0) {
        showToast("Add at least one question first!", "error");
        return;
    }

    // 4. Proceed to API
    setLoading(true);
    try {
      const payload = {
        ...setupData,
        questions: finalQuestions // Use the updated list
      };

      await api.post('/teacher/quizzes', payload);
      
      showToast("Quiz Published Successfully!", "success");
      setTimeout(() => {
          navigation.navigate('QuizDashboard');
      }, 1500);

    } catch (error) {
      console.error("Publish Error:", error);
      showToast("Failed to publish quiz", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        ...setupData,
        questions:questions,
        isDraft: true
      };

      await api.post('/teacher/quizzes', payload);
      showToast("Saved as Draft", "info");
      setTimeout(() => navigation.navigate('QuizDashboard'), 1000);

    } catch (error) {
      showToast("Failed to save draft", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
           {/* Title Section - Uses flex:1 to shrink if needed */}
           <View style={{ flex: 1, paddingRight: 10 }}>
             <Text style={styles.headerTitle} numberOfLines={1}>Add Questions</Text>
             <Text style={styles.headerSub} numberOfLines={1}>
               {questions.length} Added • {questions.reduce((sum, q) => sum + q.marks, 0)} Marks
             </Text>
           </View>
           
           {/* Buttons Section - Fixed width, doesn't shrink */}
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
               
               {/* 1. Draft Button (Icon Only) */}
               <TouchableOpacity 
                  style={styles.iconBtn} 
                  onPress={handleDraft} 
                  disabled={loading}
               >
                  <FontAwesome5 name="save" size={20} color="#64748b" />
               </TouchableOpacity>

               {/* 2. Publish Button (Text) */}
               <TouchableOpacity 
                  style={styles.publishBtn} 
                  onPress={handlePublish} 
                  disabled={loading}
               >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.publishText}>Publish</Text>
                  )}
               </TouchableOpacity>
           </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          
          {/* Question Input Card */}
          <View style={styles.card}>
             <View style={styles.row}>
                <Text style={styles.qCount}>Question {questions.length + 1}</Text>
                <View style={styles.markInputBox}>
                   <Text style={styles.markLabel}>Marks:</Text>
                   <TextInput style={styles.markInput} keyboardType="numeric" value={marks} onChangeText={setMarks} />
                </View>
             </View>
             
             <TextInput 
                style={styles.qInput} 
                placeholder="Enter question text here..." 
                multiline 
                value={qText} 
                onChangeText={setQText} 
             />

             {/* Options */}
             {options.map((opt, idx) => (
               <View key={idx} style={styles.optRow}>
                  <TouchableOpacity style={styles.radio} onPress={() => setCorrectIdx(idx)}>
                     <View style={[styles.radioDot, correctIdx === idx && styles.radioActive]} />
                  </TouchableOpacity>
                  <TextInput 
                     style={[styles.optInput, correctIdx === idx && styles.optInputActive]}
                     placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                     value={opt}
                     onChangeText={(t) => handleOptionChange(t, idx)}
                  />
               </View>
             ))}

             <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
                <FontAwesome5 name="plus" size={12} color="#4f46e5" />
                <Text style={styles.addBtnText}>Add Next Question</Text>
             </TouchableOpacity>
          </View>

          {/* Preview List (Mini) */}
          {questions.map((q, i) => (
             <View key={i} style={styles.previewItem}>
                <Text style={styles.previewText} numberOfLines={1}>{i + 1}. {q.questionText}</Text>
                <Text style={styles.previewMarks}>{q.marks}m</Text>
             </View>
          ))}

        </ScrollView>

        {/* --- TOAST NOTIFICATION --- */}
        {toast.visible && (
          <Animated.View 
            style={[
              styles.toast, 
              toast.type === 'error' ? styles.toastError : styles.toastSuccess,
              { transform: [{ translateY: toastAnim }] }
            ]}
            pointerEvents="none" 
          >
             <FontAwesome5 
                name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} 
                size={16} 
                color="#fff" 
             />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b' },
  publishBtn: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  publishText: { color: '#fff', fontWeight: 'bold' },
  draftBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  draftText: { color: '#475569', fontWeight: 'bold' },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  qCount: { fontWeight: 'bold', color: '#4f46e5' },
  markInputBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markLabel: { fontSize: 12, color: '#64748b' },
  markInput: { backgroundColor: '#f1f5f9', width: 40, padding: 4, textAlign: 'center', borderRadius: 4, fontWeight: 'bold' },
  qInput: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, height: 80, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  
  optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  radio: { padding: 4 },
  radioDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1' },
  radioActive: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  optInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 10, borderRadius: 8 },
  optInputActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 10, backgroundColor: '#eef2ff', borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#818cf8' },
  addBtnText: { color: '#4f46e5', fontWeight: 'bold' },

  previewItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', marginBottom: 8, borderRadius: 8 },
  previewText: { color: '#64748b', fontSize: 12, flex: 1 },
  previewMarks: { fontWeight: 'bold', fontSize: 12, color: '#1e293b' },

  /* --- TOAST STYLES --- */
  toast: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});