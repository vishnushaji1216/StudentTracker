import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
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
  FlatList,
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

// Mock Data for Live Monitoring
const LIVE_STUDENTS = [
  { id: '1', name: 'Arjun Kumar', initials: 'AK', bg: '#dcfce7', color: '#16a34a', status: 'finished', score: '18/20' },
  { id: '2', name: 'Diya Singh', initials: 'DS', bg: '#f1f5f9', color: '#64748b', status: 'working', progress: 'Q8 / Q10' },
  { id: '3', name: 'Rohan Das', initials: 'RD', bg: '#f1f5f9', color: '#94a3b8', status: 'pending' },
  { id: '4', name: 'Fatima Z.', initials: 'FZ', bg: '#dcfce7', color: '#16a34a', status: 'finished', score: '19/20' },
  { id: '5', name: 'Gaurav M.', initials: 'GM', bg: '#f1f5f9', color: '#64748b', status: 'working', progress: 'Q5 / Q10' },
  { id: '6', name: 'Karan Vohra', initials: 'KV', bg: '#f1f5f9', color: '#64748b', status: 'working', progress: 'Q9 / Q10' },
];

export default function LiveQuizMonitorScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(765); // 12m 45s in seconds

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

  // Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
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

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const handleStopQuiz = () => {
    Alert.alert(
      "End Quiz?",
      "This will submit all active sessions immediately. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Quiz", style: "destructive", onPress: () => navigation.navigate('QuizResult') }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const renderStudentRow = ({ item }) => {
    return (
      <View style={[styles.studentCard, item.status === 'finished' && { opacity: 0.8 }]}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatarBox, { backgroundColor: item.bg }]}>
            <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
          </View>
          <Text style={styles.studentName}>{item.name}</Text>
        </View>

        <View style={styles.cardRight}>
          {item.status === 'finished' && (
            <View style={styles.statusBox}>
              <Text style={[styles.statusText, { color: '#64748b' }]}>Finished ({item.score})</Text>
            </View>
          )}

          {item.status === 'working' && (
            <View style={styles.workingBox}>
              <View style={styles.pulseContainer}>
                <PulsingDot />
                <Text style={styles.workingText}>Writing...</Text>
              </View>
              <Text style={styles.progressText}>{item.progress}</Text>
            </View>
          )}

          {item.status === 'pending' && (
            <Text style={styles.pendingText}>Not Started</Text>
          )}
        </View>
      </View>
    );
  };

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
      <View style={styles.mainContent}>
        
        {/* Dark Header Card */}
        <View style={styles.headerCard}>
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.navRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <FontAwesome5 name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>TIME REMAINING</Text>
                <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
              </View>
            </View>
            
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>Weekly Math Test</Text>
              <Text style={styles.quizSub}>Class 9-A • 42 Students</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.bodyContainer}>
          
          {/* Status Bar */}
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>LIVE STATUS</Text>
            <TouchableOpacity style={styles.refreshBtn}>
              <FontAwesome5 name="sync-alt" size={10} color="#4f46e5" />
              <Text style={styles.refreshText}>Auto-refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Student List */}
          <FlatList 
            data={LIVE_STUDENTS}
            keyExtractor={item => item.id}
            renderItem={renderStudentRow}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />

        </View>

        {/* Footer Action */}
        <SafeAreaView edges={['bottom']} style={styles.footerAction}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStopQuiz}>
            <Text style={styles.stopBtnText}>End Quiz for All</Text>
          </TouchableOpacity>
        </SafeAreaView>

      </View>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */

const PulsingDot = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={{
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginRight: 6,
        transform: [{ scale: scaleAnim }]
      }} 
    />
  );
};

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

  /* Header Card */
  headerCard: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, zIndex: 10, shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', marginBottom: 2 },
  timerValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  quizInfo: { alignItems: 'center' },
  quizTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  quizSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  /* Body */
  bodyContainer: { flex: 1, padding: 20, paddingTop: 24 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  statusTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },

  /* List Items */
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  
  cardRight: { alignItems: 'flex-end' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  workingBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseContainer: { flexDirection: 'row', alignItems: 'center' },
  workingText: { fontSize: 10, fontWeight: 'bold', color: '#f97316' },
  progressText: { fontSize: 10, color: '#f97316', fontWeight: 'bold', marginLeft: 6 },

  pendingText: { fontSize: 10, fontWeight: 'bold', color: '#ef4444' },

  /* Footer */
  footerAction: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  stopBtn: { backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  stopBtnText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },
});