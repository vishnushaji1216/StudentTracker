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
  UIManager
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tractor } from "lucide-react-native";

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;

export default function QuizSetupScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 9-A");
  const [timeLimit, setTimeLimit] = useState("30 Mins");
  const [passingScore, setPassingScore] = useState("");
  
  // Scheduling State
  const [releaseType, setReleaseType] = useState("Now"); // 'Now' or 'Later'
  const [scheduleDate, setScheduleDate] = useState("Sun, 29 Nov");
  const [scheduleTime, setScheduleTime] = useState("10:00 AM");

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

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

  const toggleReleaseType = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setReleaseType(type);
  };

  const handleNext = () => {
    // Navigate to Question Builder
    navigation.navigate('QuestionBuilder', { 
      quizData: { title, selectedClass, timeLimit, passingScore, releaseType, scheduleDate, scheduleTime }
    });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
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
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Quiz</Text>
          </View>
          <TouchableOpacity onPress={toggleSidebar}>
            <FontAwesome5 name="bars" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* Form Container */}
            <View style={styles.formSection}>
              
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>QUIZ TITLE</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Chapter 5 Review" 
                  placeholderTextColor="#cbd5e1"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Class Select */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ASSIGN CLASS</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{selectedClass}</Text>
                  <FontAwesome5 name="chevron-down" size={12} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Scheduling Section */}
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <FontAwesome5 name="clock" size={14} color="#4f46e5" />
                    <Text style={styles.scheduleTitle}>RELEASE SCHEDULE</Text>
                  </View>
                  
                  {/* Toggle */}
                  <View style={styles.toggleWrapper}>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, releaseType === 'Later' && styles.toggleBtnActive]}
                      onPress={() => toggleReleaseType('Later')}
                    >
                      <Text style={[styles.toggleText, releaseType === 'Later' && styles.toggleTextActive]}>Later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, releaseType === 'Now' && styles.toggleBtnActive]}
                      onPress={() => toggleReleaseType('Now')}
                    >
                      <Text style={[styles.toggleText, releaseType === 'Now' && styles.toggleTextActive]}>Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Conditional Inputs for "Later" */}
                {releaseType === 'Later' && (
                  <View style={styles.dateTimeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>DATE</Text>
                      <TouchableOpacity style={styles.dateTimeInput}>
                        <Text style={styles.dateTimeText}>{scheduleDate}</Text>
                        <FontAwesome5 name="calendar-alt" size={12} color="#818cf8" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>TIME</Text>
                      <TouchableOpacity style={styles.dateTimeInput}>
                        <Text style={styles.dateTimeText}>{scheduleTime}</Text>
                        <FontAwesome5 name="clock" size={12} color="#818cf8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Grid: Time & Score */}
              <View style={styles.gridRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>TIME LIMIT</Text>
                  <TouchableOpacity style={styles.dropdown}>
                    <Text style={styles.dropdownText}>{timeLimit}</Text>
                    <FontAwesome5 name="chevron-down" size={12} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>PASSING %</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="40" 
                    placeholderTextColor="#cbd5e1"
                    keyboardType="numeric"
                    value={passingScore}
                    onChangeText={setPassingScore}
                  />
                </View>
              </View>

            </View>

          </View>
        </ScrollView>

        {/* Footer Action */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next: Add Questions</Text>
            <FontAwesome5 name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Content */
  scrollContent: { flex: 1, backgroundColor: '#fff' },
  contentPadding: { padding: 20 },
  formSection: { gap: 20 },

  /* Inputs */
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12 },
  dropdownText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  
  /* Scheduling Card */
  scheduleCard: { backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e0e7ff' },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scheduleTitle: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', letterSpacing: 0.5 },
  toggleWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#e0e7ff' },
  toggleText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  toggleTextActive: { color: '#4f46e5' },
  
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  subLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  dateTimeInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  dateTimeText: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },

  /* Grid */
  gridRow: { flexDirection: 'row', gap: 12 },

  /* Footer */
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});