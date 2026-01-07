import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  BackHandler,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native"; // <--- 1. IMPORT THIS
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import TeacherSidebar from "../../components/TeacherSidebar"; 
import api from "../../services/api"; 

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function MyClassesScreen({ navigation }) {
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Data State
  const [classesData, setClassesData] = useState([]);
  const [summary, setSummary] = useState({ totalStudents: 0, totalClasses: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.navigate('TeacherDash');
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- 2. REPLACED useEffect WITH useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
      // This runs every time the screen comes into focus
      fetchClasses();
    }, [])
  );

  const fetchClasses = async () => {
    // We don't want to set loading to true every time we go back, 
    // or it will flash the spinner. Let's keep it subtle or only do it on first load.
    // setIsLoading(true); <--- Optional: Comment this out for smoother UX
    
    try {
      const response = await api.get('/teacher/classes');
      
      if (response.data) {
        setClassesData(response.data.classes);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      // Fail silently on refetch to avoid annoying alerts on every back nav
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const navigateToClass = (classId) => {
    // Find the correct subject for this class ID
    const selectedClass = classesData.find(c => c.id === classId);
    const subject = selectedClass ? selectedClass.subject : "General"; 
    
    navigation.navigate('TClassDetail', { classId, subject });
  };

  // --- LOADING VIEW ---
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Loading Classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Sidebar */}
      <TeacherSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeItem="MyClasses"
      />

      {/* Main Content */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
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
            
            {/* 1. DYNAMIC SUMMARY CARD */}
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL STUDENTS</Text>
                <Text style={styles.summaryValue}>{summary.totalStudents}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summarySub}>Across {summary.totalClasses} Classes</Text>
                <FontAwesome5 name="users" size={24} color="#fff" style={{ marginTop: 4, opacity: 0.9 }} />
              </View>
            </View>

            {/* 2. CLASS TEACHER SECTION */}
            <Text style={styles.sectionTitle}>PRIMARY RESPONSIBILITY</Text>
            
            {classesData.filter(c => c.isClassTeacher).length > 0 ? (
                classesData.filter(c => c.isClassTeacher).map((item) => (
                  <ClassCard 
                    key={item.id} 
                    item={item} 
                    expanded={expandedId === item.id}
                    onToggle={() => toggleAccordion(item.id)}
                    onEnter={() => navigateToClass(item.id)}
                  />
                ))
            ) : (
                <Text style={styles.emptyText}>No primary class assigned.</Text>
            )}

            {/* 3. SUBJECT TEACHER SECTION */}
            <Text style={styles.sectionTitle}>SUBJECT CLASSES</Text>
            
            {classesData.filter(c => !c.isClassTeacher).length > 0 ? (
                classesData.filter(c => !c.isClassTeacher).map((item) => (
                  <ClassCard 
                    key={item.id} 
                    item={item} 
                    expanded={expandedId === item.id}
                    onToggle={() => toggleAccordion(item.id)}
                    onEnter={() => navigateToClass(item.id)}
                  />
                ))
            ) : (
                <Text style={styles.emptyText}>No subject classes found.</Text>
            )}

          </View>
        </ScrollView>

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
          <View style={[styles.ctBadge, { backgroundColor: '#eff6ff' }]}>
             <Text style={[styles.ctText, { color: '#2563eb' }]}>
               {item.subject.toUpperCase()}
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
            <Text style={styles.topicText}>{item.topic || "No Active Topic"}</Text>
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

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 12, marginBottom: 10, marginLeft: 4 },

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