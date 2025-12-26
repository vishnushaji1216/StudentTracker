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
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;
const { width } = Dimensions.get('window');

// Mock Data: Students in this class
const ROSTER = [
  { id: '1', name: 'Arjun Kumar', roll: '24', score: '78%', color: '#16a34a', bg: '#dcfce7', initials: 'AK', avatarColor: '#e0e7ff', textCol: '#4f46e5' },
  { id: '2', name: 'Diya Singh', roll: '25', score: '45%', color: '#f97316', bg: '#ffedd5', initials: 'DS', avatarColor: '#f1f5f9', textCol: '#64748b' },
  { id: '3', name: 'Karan Vohra', roll: '26', score: '65%', color: '#475569', bg: '#f1f5f9', initials: 'KV', avatarColor: '#eff6ff', textCol: '#3b82f6' },
  { id: '4', name: 'Fatima Z.', roll: '27', score: '92%', color: '#16a34a', bg: '#dcfce7', initials: 'FZ', avatarColor: '#f0fdf4', textCol: '#16a34a' },
  { id: '5', name: 'Gaurav M.', roll: '28', score: '70%', color: '#475569', bg: '#f1f5f9', initials: 'GM', avatarColor: '#fefce8', textCol: '#ca8a04' },
];

export default function ClassDetailScreen({ route, navigation }) {
  const { classId } = route.params || { classId: '9-A' }; // Default for demo

  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Class State
  const [topic, setTopic] = useState("Ch 5: Arithmetic Progressions");
  const [isNotesDone, setIsNotesDone] = useState(true);
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [isTestDone, setIsTestDone] = useState(false);

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
      Animated.timing(slideAnim, {
        toValue: isOpen ? -SIDEBAR_WIDTH : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 0 : 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
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
                active={true}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Class {classId}</Text>
              <Text style={styles.headerSub}>MATHEMATICS</Text>
            </View>
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
            
            {/* 1. CONTROL PANEL (Status Card) */}
            <View style={styles.controlCard}>
              <View style={styles.cardTopBar} />
              
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>CURRENT STATUS</Text>
                <TouchableOpacity style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save Updates</Text>
                </TouchableOpacity>
              </View>

              {/* Chapter Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>CURRENT TOPIC</Text>
                <View style={styles.inputBox}>
                  <FontAwesome5 name="book-open" size={14} color="#818cf8" />
                  <TextInput 
                    style={styles.textInput}
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="Enter Chapter Name"
                    placeholderTextColor="#94a3b8"
                  />
                  <FontAwesome5 name="pen" size={12} color="#cbd5e1" />
                </View>
              </View>

              {/* Status Toggles Grid */}
              <View style={styles.toggleGrid}>
                
                {/* Notes Toggle */}
                <TouchableOpacity 
                  style={[styles.statusBtn, isNotesDone ? styles.statusDone : styles.statusPending]}
                  onPress={() => setIsNotesDone(!isNotesDone)}
                >
                  <View style={[styles.iconCircle, isNotesDone ? styles.iconDone : styles.iconPending]}>
                    <FontAwesome5 name={isNotesDone ? "check" : "minus"} size={10} color={isNotesDone ? "#16a34a" : "#94a3b8"} />
                  </View>
                  <Text style={[styles.statusText, isNotesDone ? {color: '#16a34a'} : {color: '#64748b'}]}>
                    Notes {isNotesDone ? 'Done' : 'Pending'}
                  </Text>
                </TouchableOpacity>

                {/* Quiz Toggle */}
                <TouchableOpacity 
                  style={[styles.statusBtn, isQuizDone ? styles.statusDone : styles.statusPending]}
                  onPress={() => setIsQuizDone(!isQuizDone)}
                >
                  <View style={[styles.iconCircle, isQuizDone ? styles.iconDone : styles.iconPending]}>
                    <FontAwesome5 name={isQuizDone ? "check" : "minus"} size={10} color={isQuizDone ? "#16a34a" : "#94a3b8"} />
                  </View>
                  <Text style={[styles.statusText, isQuizDone ? {color: '#16a34a'} : {color: '#64748b'}]}>
                    Quiz {isQuizDone ? 'Done' : 'Pending'}
                  </Text>
                </TouchableOpacity>

                {/* Test Toggle */}
                <TouchableOpacity 
                  style={[styles.statusBtn, isTestDone ? styles.statusDone : styles.statusPending]}
                  onPress={() => setIsTestDone(!isTestDone)}
                >
                  <View style={[styles.iconCircle, isTestDone ? styles.iconDone : styles.iconPending]}>
                    <FontAwesome5 name={isTestDone ? "check" : "minus"} size={10} color={isTestDone ? "#16a34a" : "#94a3b8"} />
                  </View>
                  <Text style={[styles.statusText, isTestDone ? {color: '#16a34a'} : {color: '#64748b'}]}>
                    Test {isTestDone ? 'Done' : 'Pending'}
                  </Text>
                </TouchableOpacity>

              </View>
            </View>

            {/* 2. ROSTER HEADER */}
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>STUDENT ROSTER (42)</Text>
              <TouchableOpacity>
                <FontAwesome5 name="sort" size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* 3. STUDENT LIST */}
            <View style={styles.rosterList}>
              {ROSTER.map((student) => (
                <TouchableOpacity key={student.id} style={styles.studentCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.avatarBox, { backgroundColor: student.avatarColor }]}>
                      <Text style={[styles.avatarText, { color: student.textCol }]}>{student.initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.rollNo}>Roll No. {student.roll}</Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.scoreBadge, { backgroundColor: student.bg }]}>
                      <Text style={[styles.scoreText, { color: student.color }]}>{student.score}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        </ScrollView>

        {/* FOOTER ACTIONS */}
        {/* <View style={styles.actionFooter}>
          <TouchableOpacity style={styles.actionBtnLight}>
            <FontAwesome5 name="list-check" size={14} color="#4338ca" />
            <Text style={styles.actionBtnTextLight}>Mark Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDark}>
            <FontAwesome5 name="bullhorn" size={14} color="#fff" />
            <Text style={styles.actionBtnTextDark}>Broadcast</Text>
          </TouchableOpacity>
        </View> */}

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyClasses')}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Classes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDirectory')}>
            <FontAwesome5 name="users" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Students</Text>
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
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', marginTop: 2 },
  menuButton: { padding: 4 },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Control Card */
  controlCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 24, overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#4f46e5' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { fontSize: 10, fontWeight: 'bold', color: '#4338ca' },
  
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 10 },
  textInput: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  /* Toggles */
  toggleGrid: { flexDirection: 'row', gap: 12 },
  statusBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  statusDone: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fff', borderColor: '#e2e8f0', borderStyle: 'dashed' },
  iconCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: '#dcfce7' },
  iconPending: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  /* Roster */
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  rosterTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  rosterList: { gap: 8 },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: 'bold' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rollNo: { fontSize: 10, color: '#64748b' },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scoreText: { fontSize: 10, fontWeight: 'bold' },

  /* Footer Actions */
  actionFooter: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', position: 'absolute', bottom: 70, left: 0, right: 0, zIndex: 30 },
  actionBtnLight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eef2ff', paddingVertical: 12, borderRadius: 12, marginRight: 8 },
  actionBtnTextLight: { fontSize: 12, fontWeight: 'bold', color: '#4338ca' },
  actionBtnDark: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 12, marginLeft: 8 },
  actionBtnTextDark: { fontSize: 12, fontWeight: 'bold', color: '#fff' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10, position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});