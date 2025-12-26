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
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;
const { width } = Dimensions.get('window');

// Mock Data
const CLASSES = [
  {
    id: '9-A',
    name: 'Class 9-A',
    subject: 'Mathematics',
    students: 42,
    avg: '78%',
    isClassTeacher: true,
    topic: 'Ch 5: Arithmetic',
    notesStatus: 'Done', 
    quizStatus: 'Pending'
  },
  {
    id: '10-B',
    name: 'Class 10-B',
    subject: 'Physics',
    students: 38,
    avg: '62%',
    isClassTeacher: false,
    topic: 'Ch 3: Light & Optics',
    notesStatus: 'Pending',
    quizStatus: 'Pending'
  },
  {
    id: '10-C',
    name: 'Class 10-C',
    subject: 'Physics',
    students: 40,
    avg: '74%',
    isClassTeacher: false,
    topic: 'Ch 3: Light & Optics',
    notesStatus: 'Done',
    quizStatus: 'Done'
  }
];

export default function MyClassesScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Accordion State
  const [expandedId, setExpandedId] = useState(null);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.navigate('TeacherDash'); // Go back to Dash
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

  // --- NAVIGATION HELPER (Fix for "handleNav doesn't exist") ---
  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const navigateToClass = (classId) => {
    // Navigate to Detail Screen
    navigation.navigate('TClassDetail', { classId });
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

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View style={{ flex: 1 }}>
            <View style={styles.sidebarHeader}>
              <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.profilePic} />
              <View>
                <Text style={styles.teacherName}>Priya Sharma</Text>
                <Text style={styles.teacherCode}>T-2025-08</Text>
              </View>
              <View style={styles.classTag}>
                <Text style={styles.classTagText}>Class Teacher: 9-A</Text>
              </View>
            </View>

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => handleNav('TeacherDash')} />
              <SidebarItem icon="calendar-check" label="Daily Tasks" onPress={() => handleNav('DailyTask')} />
              <SidebarItem icon="chalkboard-teacher" label="My Classes" active onPress={() => handleNav('MyClasses')} />
              <SidebarItem icon="users" label="Student Directory" onPress={() => handleNav('StudentDirectory')} />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>CONTENT & GRADING</Text>
              
              <SidebarItem icon="list-ul" label="Quiz Manager" onPress={() => handleNav('QuizDashboard')} />
              <SidebarItem icon="pen-fancy" label="Handwriting Review" onPress={() => handleNav('HandwritingReview')} />
              <SidebarItem icon="headphones" label="Audio Review" onPress={() => handleNav('AudioReview')} />
              <SidebarItem icon="bullhorn" label="Notice Board" onPress={() => handleNav('NoticeBoard')} />
              <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('ResourceLibrary')} />
              <SidebarItem icon="question-circle" label="Help & Support" />
            </ScrollView>
          </View>

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
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Classes</Text>
          </View>
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>AY 2025-26</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. SUMMARY CARD */}
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL STUDENTS</Text>
                <Text style={styles.summaryValue}>120</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summarySub}>Across 3 Classes</Text>
                <FontAwesome5 name="users" size={24} color="#fff" style={{ marginTop: 4, opacity: 0.9 }} />
              </View>
            </View>

            {/* 2. CLASS TEACHER SECTION */}
            <Text style={styles.sectionTitle}>PRIMARY RESPONSIBILITY</Text>
            
            {CLASSES.filter(c => c.isClassTeacher).map((item) => (
              <ClassCard 
                key={item.id} 
                item={item} 
                expanded={expandedId === item.id}
                onToggle={() => toggleAccordion(item.id)}
                onEnter={() => navigateToClass(item.id)}
              />
            ))}

            {/* 3. SUBJECT TEACHER SECTION */}
            <Text style={styles.sectionTitle}>SUBJECT CLASSES</Text>
            
            {CLASSES.filter(c => !c.isClassTeacher).map((item) => (
              <ClassCard 
                key={item.id} 
                item={item} 
                expanded={expandedId === item.id}
                onToggle={() => toggleAccordion(item.id)}
                onEnter={() => navigateToClass(item.id)}
              />
            ))}

          </View>
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

          {/* Classes is Active (Blue) */}
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

const ClassCard = ({ item, expanded, onToggle, onEnter }) => (
  <View style={[styles.classCard, item.isClassTeacher && styles.classCardPrimary]}>
    
    <TouchableOpacity 
      style={styles.classHeader} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classSubject}>{item.subject}</Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {item.isClassTeacher ? (
          <View style={styles.ctBadge}>
            <Text style={styles.ctText}>CLASS TEACHER</Text>
          </View>
        ) : (
          <View style={[styles.ctBadge, { backgroundColor: item.id === '10-B' ? '#fff7ed' : '#eff6ff' }]}>
             <Text style={[styles.ctText, { color: item.id === '10-B' ? '#f97316' : '#2563eb' }]}>
               PHYSICS
             </Text>
          </View>
        )}
        <FontAwesome5 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={12} 
          color="#94a3b8" 
        />
      </View>
    </TouchableOpacity>

    {expanded && (
      <View style={styles.classBody}>
        
        <View style={styles.topicBox}>
          <Text style={styles.label}>CURRENT TOPIC</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome5 name="book-open" size={12} color="#4f46e5" />
            <Text style={styles.topicText}>{item.topic}</Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          <View style={[styles.statusItem, item.notesStatus === 'Done' ? styles.statusDone : styles.statusPending]}>
             <FontAwesome5 
               name={item.notesStatus === 'Done' ? "check" : "times"} 
               size={10} 
               color={item.notesStatus === 'Done' ? "#16a34a" : "#ef4444"} 
             />
             <Text style={[styles.statusText, item.notesStatus === 'Done' ? {color:'#15803d'} : {color:'#b91c1c'}]}>
                Notes {item.notesStatus}
             </Text>
          </View>

          <View style={[styles.statusItem, item.quizStatus === 'Done' ? styles.statusDone : styles.statusPending]}>
             <FontAwesome5 
                name={item.quizStatus === 'Done' ? "check" : "clock"} 
                size={10} 
                color={item.quizStatus === 'Done' ? "#16a34a" : "#94a3b8"} 
             />
             <Text style={[styles.statusText, item.quizStatus === 'Done' ? {color:'#15803d'} : {color:'#64748b'}]}>
                Quiz {item.quizStatus}
             </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.label}>STUDENTS</Text>
            <Text style={styles.statVal}>{item.students}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.label}>AVG SCORE</Text>
            <Text style={[styles.statVal, { color: parseInt(item.avg) > 70 ? '#16a34a' : '#f97316' }]}>
              {item.avg}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.enterBtn} onPress={onEnter}>
          <Text style={styles.enterBtnText}>Enter Classroom</Text>
          <FontAwesome5 name="arrow-right" size={12} color="#fff" />
        </TouchableOpacity>

      </View>
    )}
  </View>
);

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
  yearBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  yearText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* 1. Summary */
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4f46e5', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  summaryLabel: { fontSize: 10, fontWeight: 'bold', color: '#c7d2fe', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  summarySub: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },

  /* Section Title */
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },

  /* 2. Class Cards */
  classCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  classCardPrimary: { borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  className: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  classSubject: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ctBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e0e7ff' },
  ctText: { fontSize: 9, fontWeight: 'bold', color: '#4f46e5' },

  /* Expanded Body */
  classBody: { padding: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  topicBox: { marginBottom: 16 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  topicText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  
  /* Status Grid */
  statusGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1 },
  statusDone: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fff', borderColor: '#e2e8f0', borderStyle: 'dashed' },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  /* Stats Row */
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  statCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: '#f1f5f9' },
  statVal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  /* CTA */
  enterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, shadowColor: '#4f46e5', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  enterBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});