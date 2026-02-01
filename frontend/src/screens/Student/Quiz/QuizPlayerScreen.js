import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Animated, BackHandler, Platform, Dimensions, UIManager, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import api from "../../../services/api";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function QuizPlayerScreen({ route, navigation }) {
  const { quizId } = route.params;

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores INDEX now
  const [timeLeft, setTimeLeft] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [gradedData, setGradedData] = useState([]);

  useEffect(() => { fetchQuizDetails(); }, []);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/student/quiz/${quizId}`);
      setQuizData(res.data);
      // Use duration from API, fallback to 30 if missing
      const duration = res.data.duration ? Number(res.data.duration) : 30;
      setTimeLeft(duration * 60);
    } catch {
      Alert.alert("Error", "Could not load quiz.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quizData || reviewMode) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerId); submitQuiz(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [quizData, reviewMode]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (reviewMode) { navigation.goBack(); return true; }
      Alert.alert("Quit Quiz?", "Progress will be lost.", [
        { text: "Cancel", style: "cancel" },
        { text: "Quit", style: "destructive", onPress: () => navigation.goBack() }
      ]);
      return true;
    });
    return () => backHandler.remove();
  }, [reviewMode]);

  const formatTime = s => `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;

  // FIX: Store the INDEX (0, 1, 2) not the text
  const selectOption = (index) => { 
      if (!reviewMode) {
          setAnswers({ ...answers, [currentQuestionIndex]: index }); 
      }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
    else if (!reviewMode) confirmSubmit();
  };

  const handlePrev = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1); };

  const confirmSubmit = () => {
    Alert.alert("Submit Quiz", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: submitQuiz }
    ]);
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      // Construct responses using stored INDICES
      const responses = Object.keys(answers).map(i => ({ 
          questionIndex: parseInt(i), 
          selectedOption: answers[i] // This is now a number (0,1,2)
      }));
      
      const res = await api.post("/student/quiz/submit", { quizId, responses });
      setGradedData(res.data.gradedResponses || []);
      setReviewMode(true);
    } catch {
      Alert.alert("Error", "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quizData) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  const currentQ = quizData.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={reviewMode ? navigation.goBack : confirmSubmit}>
              <FontAwesome5 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>{reviewMode ? "REVIEW MODE" : "TIME REMAINING"}</Text>
              {!reviewMode && <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>}
            </View>
          </View>

          <Text style={styles.quizTitle}>{quizData.title}</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {quizData.questions.length}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.questionText}>{currentQ.questionText}</Text>

        {currentQ.options.map((option, index) => {
          // Compare Indices
          const isSelected = answers[currentQuestionIndex] === index; 
          
          // Review Mode Logic
          const correctIdx = Number(gradedData[currentQuestionIndex]?.correctAnswer); 
          const isCorrect = reviewMode && correctIdx === index;
          const isWrong = reviewMode && isSelected && !isCorrect;

          return (
            <TouchableOpacity 
                key={index} 
                disabled={reviewMode} 
                onPress={() => selectOption(index)} // PASS INDEX HERE
                style={[
                    styles.optionCard, 
                    isSelected && styles.optionCardSelected, 
                    isCorrect && { borderColor: "#22c55e", backgroundColor: "#f0fdf4" }, 
                    isWrong && { borderColor: "#ef4444", backgroundColor: "#fef2f2" }
                ]}
            >
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {isCorrect && <FontAwesome5 name="check-circle" size={18} color="#22c55e" />}
              {isWrong && <FontAwesome5 name="times-circle" size={18} color="#ef4444" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <TouchableOpacity onPress={handlePrev} disabled={currentQuestionIndex === 0}>
          <Text style={styles.prevText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{reviewMode ? "Done" : currentQuestionIndex === quizData.questions.length - 1 ? "Submit" : "Next"}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#F8FAFC"},
  loader:{flex:1,justifyContent:"center",alignItems:"center"},
  header:{backgroundColor:"#4f46e5",padding:20,paddingBottom:24,borderBottomLeftRadius:32,borderBottomRightRadius:32},
  navRow:{flexDirection:"row",justifyContent:"space-between"},
  timerBox:{alignItems:"flex-end"},
  timerLabel:{fontSize:10,color:"#c7d2fe",fontWeight:"bold"},
  timerValue:{fontSize:20,fontWeight:"bold",color:"#fff"},
  quizTitle:{fontSize:20,fontWeight:"bold",color:"#fff",marginVertical:10},
  progressRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  progressText:{color:"#c7d2fe",fontSize:12},
  progressBarBg:{width:100,height:6,backgroundColor:"rgba(255,255,255,0.3)",borderRadius:3},
  progressBarFill:{height:"100%",backgroundColor:"#fff",borderRadius:3},
  questionText:{fontSize:18,fontWeight:"bold",marginBottom:24,color:"#1e293b"},
  optionCard:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#fff",padding:16,borderRadius:16,borderWidth:2,borderColor:"transparent",marginBottom:12},
  optionCardSelected:{borderColor:"#4f46e5",backgroundColor:"#eef2ff"},
  radioCircle:{width:24,height:24,borderRadius:12,borderWidth:2,borderColor:"#cbd5e1",alignItems:"center",justifyContent:"center"},
  radioCircleSelected:{backgroundColor:"#4f46e5",borderColor:"#4f46e5"},
  radioDot:{width:8,height:8,borderRadius:4,backgroundColor:"#fff"},
  optionText:{flex:1,fontWeight:"600",color:"#475569"},
  footer:{flexDirection:"row",justifyContent:"space-between",padding:20,backgroundColor:"#fff"},
  prevText:{fontWeight:"bold",color:"#94a3b8"},
  nextBtn:{backgroundColor:"#4f46e5",paddingHorizontal:32,paddingVertical:12,borderRadius:16},
  nextText:{color:"#fff",fontWeight:"bold"}
});