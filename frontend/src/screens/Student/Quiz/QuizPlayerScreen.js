import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  Dimensions,
  UIManager,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;
const { width } = Dimensions.get('window');

// Mock Questions
const QUESTIONS = [
  {
    id: 1,
    question: "Which of the following is the correct formula for the area of a circle?",
    options: ["2πr", "πr²", "2πr²", "πd"],
  },
  {
    id: 2,
    question: "What is the value of Pi (π) to two decimal places?",
    options: ["3.14", "3.41", "3.12", "3.24"],
  },
  {
    id: 3,
    question: "If the radius of a circle is 5cm, what is its diameter?",
    options: ["2.5cm", "5cm", "10cm", "25cm"],
  },
];

export default function QuizPlayerScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { 0: 1, 1: 3 } (QuestionIndex: OptionIndex)
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  // Handle Android Back Button (Prevent Accidental Exit)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      
      Alert.alert(
        "Quit Quiz?",
        "Progress will be lost. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Quit", style: "destructive", onPress: () => navigation.navigate('StudentQuizCenter') }
        ]
      );
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // Timer Logic
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleSubmit(); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isOpen ? -SIDEBAR_WIDTH : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 0 : 0.5, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsSidebarOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleNav = (screen) => {
    // Confirm before leaving
    Alert.alert(
      "Leave Quiz?",
      "Your progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave", 
          style: "destructive", 
          onPress: () => {
            toggleSidebar();
            navigation.navigate(screen);
          }
        }
      ]
    );
  };

  const selectOption = (optionIndex) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: optionIndex
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    navigation.replace('StudentQuizResult'); // Go to results
  };

  const currentQ = QUESTIONS[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={isSidebarOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View>
            <View style={styles.sidebarHeader}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>AK</Text>
              </View>
              <View>
                <Text style={styles.sidebarTitle}>Arjun Kumar</Text>
                <Text style={styles.sidebarVersion}>Class 9-A</Text>
              </View>
            </View>

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
              <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')} />
              <SidebarItem icon="folder-open" label="Resource Library" />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>ACADEMICS</Text>
              
              <SidebarItem icon="microphone" label="Daily Audio" />
              <SidebarItem icon="pen-fancy" label="Handwriting" />
              <SidebarItem icon="list-check" label="Quiz Center" active onPress={() => { toggleSidebar(); /* Already here */ }} />

              <View style={styles.menuDivider} />
              <SidebarItem icon="circle-question" label="Help & Support" />
            </ScrollView>
          </View>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <View style={styles.mainContent}>
        
        {/* Header (Blue) */}
        <View style={styles.header}>
           <SafeAreaView edges={['top', 'left', 'right']}>
              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => {
                   Alert.alert("Quit Quiz?", "Progress will be lost.", [
                     { text: "Cancel", style: "cancel" },
                     { text: "Quit", style: "destructive", onPress: () => navigation.goBack() }
                   ]);
                }}>
                   <FontAwesome5 name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                <View style={styles.timerBox}>
                   <Text style={styles.timerLabel}>TIME REMAINING</Text>
                   <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
                </View>
              </View>
              
              <View style={styles.quizInfo}>
                 <Text style={styles.quizTitle}>Weekly Math Test</Text>
                 
                 <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</Text>
                    <View style={styles.progressBarBg}>
                       <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                 </View>
              </View>
           </SafeAreaView>
        </View>

        {/* Question Body */}
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ padding: 20 }}>
            
            <Text style={styles.questionText}>
              {currentQ.question}
            </Text>

            <View style={styles.optionsContainer}>
               {currentQ.options.map((option, index) => {
                  const isSelected = answers[currentQuestionIndex] === index;
                  return (
                    <TouchableOpacity 
                       key={index}
                       style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                       activeOpacity={0.8}
                       onPress={() => selectOption(index)}
                    >
                       <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                       </View>
                       <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {option}
                       </Text>
                    </TouchableOpacity>
                  );
               })}
            </View>

        </ScrollView>

        {/* Footer Navigation */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
           <TouchableOpacity 
             style={styles.prevBtn} 
             onPress={handlePrev}
             disabled={currentQuestionIndex === 0}
           >
              <FontAwesome5 
                name="arrow-left" 
                size={14} 
                color={currentQuestionIndex === 0 ? "#cbd5e1" : "#94a3b8"} 
              />
              <Text style={[styles.prevText, currentQuestionIndex === 0 && { color: "#cbd5e1" }]}>Prev</Text>
           </TouchableOpacity>

           <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextText}>
                {currentQuestionIndex === QUESTIONS.length - 1 ? "Submit" : "Next"}
              </Text>
              <FontAwesome5 
                name={currentQuestionIndex === QUESTIONS.length - 1 ? "check" : "arrow-right"} 
                size={14} 
                color="#fff" 
              />
           </TouchableOpacity>
        </SafeAreaView>

      </View>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */
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

  /* Sidebar (Standard) */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoBox: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, width: '100%' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },

  /* Header */
  header: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, zIndex: 10, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 10 },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', marginBottom: 2 },
  timerValue: { fontSize: 20, fontWeight: 'bold', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  quizInfo: { width: '100%' },
  quizTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { color: '#c7d2fe', fontSize: 12, fontWeight: '600' },
  progressBarBg: { width: 100, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

  /* Content */
  scrollContent: { flex: 1, backgroundColor: '#f8fafc' },
  questionText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 24, lineHeight: 28 },
  optionsContainer: { gap: 12 },
  
  /* Options */
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  optionCardSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#4f46e5', backgroundColor: '#4f46e5' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#475569' },
  optionTextSelected: { color: '#4f46e5', fontWeight: 'bold' },

  /* Footer */
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  prevText: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 16, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});