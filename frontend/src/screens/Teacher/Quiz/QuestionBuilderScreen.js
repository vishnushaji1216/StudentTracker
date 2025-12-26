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
  LayoutAnimation,
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

export default function QuestionBuilderScreen({ route, navigation }) {
  // Get params from previous screen (Title, Class, etc.)
  const { quizData } = route.params || {};

  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Question State
  const [questionCount, setQuestionCount] = useState(1);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    { id: 1, text: "", isCorrect: true },
    { id: 2, text: "", isCorrect: false },
  ]);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      // Warn before exit if data exists
      if (questionText.length > 0) {
        Alert.alert("Discard Changes?", "You have unsaved work. Are you sure you want to go back?", [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => navigation.goBack() }
        ]);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen, questionText]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isOpen ? -SIDEBAR_WIDTH : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 0 : 0.5, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsSidebarOpen(!isOpen);
  };

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // --- Question Logic ---

  const addOption = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOptions([...options, { id: Date.now(), text: "", isCorrect: false }]);
  };

  const removeOption = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOptions(options.filter(opt => opt.id !== id));
  };

  const toggleCorrect = (id) => {
    // Only one correct answer logic
    const updatedOptions = options.map(opt => ({
      ...opt,
      isCorrect: opt.id === id
    }));
    setOptions(updatedOptions);
  };

  const updateOptionText = (id, text) => {
    const updatedOptions = options.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    );
    setOptions(updatedOptions);
  };

  const handleAddNext = () => {
    // Validation
    if (!questionText.trim()) {
      Alert.alert("Missing Info", "Please enter a question text.");
      return;
    }
    
    // Reset for next question
    setQuestionCount(prev => prev + 1);
    setQuestionText("");
    setOptions([
      { id: Date.now(), text: "", isCorrect: true },
      { id: Date.now() + 1, text: "", isCorrect: false },
    ]);
  };

  const handlePublish = () => {
    Alert.alert("Success", "Quiz Published Successfully!", [
        { text: "OK", onPress: () => navigation.navigate('QuizManager') }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={isSidebarOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* --- SIDEBAR DRAWER (Z-Index 51) --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View style={{ flex: 1 }}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <Image 
                source={{ uri: "https://i.pravatar.cc/150?img=5" }} 
                style={styles.profilePic} 
              />
              <View>
                <Text style={styles.teacherName}>Priya Sharma</Text>
                <Text style={styles.teacherCode}>T-2025-08</Text>
              </View>
              <View style={styles.classTag}>
                <Text style={styles.classTagText}>Class Teacher: 9-A</Text>
              </View>
            </View>

            {/* Navigation Items (Corrected Teacher Menu) */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem 
                icon="chart-pie" 
                label="Dashboard" 
                onPress={() => handleNav('TeacherDash')}
              />
              <SidebarItem 
                icon="calendar-check" 
                label="Daily Tasks" 
                onPress={() => handleNav('DailyTask')}
              />
              <SidebarItem 
                icon="chalkboard-teacher" 
                label="My Classes" 
                onPress={() => handleNav('MyClasses')}
              />
              <SidebarItem 
                icon="users" 
                label="Student Directory" 
                onPress={() => handleNav('StudentDirectory')}
              />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>CONTENT & GRADING</Text>

              <SidebarItem 
                icon="list-ul" 
                label="Quiz Manager" 
                onPress={() => handleNav('QuizDashboard')}
                active={true}
              />
              <SidebarItem 
                icon="pen-fancy" 
                label="Handwriting Review" 
                onPress={() => handleNav('HandwritingReview')}
              />
              <SidebarItem 
                icon="headphones" 
                label="Audio Review" 
                onPress={() => handleNav('AudioReview')}
              />
              <SidebarItem 
                icon="bullhorn" 
                label="Notice Board" 
                onPress={() => handleNav('NoticeBoard')}
              />
              <SidebarItem 
                icon="folder-open" 
                label="Resource Library" 
                onPress={() => handleNav('ResourceLibrary')}
              />

              <View style={styles.menuDivider} />
              <SidebarItem icon="question-circle" label="Help & Support" />
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => handleNav('TeacherSetting')}>
              <FontAwesome5 name="cog" size={16} color="#64748b" />
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Question {questionCount}</Text>
              <Text style={styles.headerSub}>MIN 2 • MAX 10</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.publishBtn} 
            onPress={handlePublish}
          >
            <Text style={styles.publishText}>Publish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* Question Card */}
            <View style={styles.questionCard}>
              <Text style={styles.qBadge}>Q{questionCount}</Text>
              
              <Text style={styles.label}>QUESTION TEXT</Text>
              <TextInput 
                style={styles.textArea} 
                placeholder="Type question here..." 
                placeholderTextColor="#cbd5e1"
                multiline
                textAlignVertical="top"
                value={questionText}
                onChangeText={setQuestionText}
              />

              {/* Options List */}
              <View style={styles.optionsList}>
                {options.map((opt, index) => (
                  <View key={opt.id} style={styles.optionRow}>
                    
                    {/* Radio Button */}
                    <TouchableOpacity 
                      style={[styles.radioOuter, opt.isCorrect && styles.radioOuterSelected]}
                      onPress={() => toggleCorrect(opt.id)}
                    >
                      {opt.isCorrect && <View style={styles.radioInner} />}
                    </TouchableOpacity>

                    {/* Input */}
                    <TextInput 
                      style={[styles.optionInput, opt.isCorrect && styles.optionInputSelected]}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      placeholderTextColor="#94a3b8"
                      value={opt.text}
                      onChangeText={(text) => updateOptionText(opt.id, text)}
                    />

                    {/* Delete (only if more than 2 options) */}
                    {options.length > 2 && (
                      <TouchableOpacity onPress={() => removeOption(opt.id)} style={{ padding: 4 }}>
                        <FontAwesome5 name="times" size={14} color="#cbd5e1" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                  <Text style={styles.addOptionText}>+ Add Option</Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* Add Next Button */}
            <TouchableOpacity style={styles.addNextBtn} onPress={handleAddNext}>
              <FontAwesome5 name="plus" size={14} color="#94a3b8" />
              <Text style={styles.addNextText}>Add Next Question</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

      </SafeAreaView>
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
  safeArea: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarHeader: { marginBottom: 10,paddingBottom: 20,borderBottomWidth: 1, borderBottomColor: '#F1F5F9',flexDirection: 'column', gap: 12},
  profileRow: {flexDirection: 'row',alignItems: 'center',gap: 12},
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  teacherCode: { fontSize: 12, color: '#64748b' },
  classTag: { marginTop: 0, alignSelf: 'flex-start',  backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 62 },
  classTagText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  sidebarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingHorizontal: 10 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  publishBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  publishText: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },

  /* Content */
  scrollContent: { flex: 1, backgroundColor: '#f8fafc' },
  contentPadding: { padding: 20 },

  /* Question Card */
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  qBadge: { position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 'bold', color: '#cbd5e1' },
  label: { fontSize: 10, fontWeight: 'bold', color: '#818cf8', marginBottom: 6, letterSpacing: 0.5 },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 'bold', color: '#1e293b', minHeight: 80, marginBottom: 20 },
  
  /* Options */
  optionsList: { gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  
  /* Radio Button */
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  radioOuterSelected: { borderColor: '#22c55e' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },

  /* Option Input */
  optionInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: '#334155', borderWidth: 1, borderColor: '#e2e8f0' },
  optionInputSelected: { backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#dcfce7', fontWeight: 'bold' },

  /* Add Option */
  addOptionBtn: { marginLeft: 30, marginTop: 4 },
  addOptionText: { fontSize: 11, fontWeight: 'bold', color: '#6366f1' },

  /* Add Next */
  addNextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed' },
  addNextText: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
});