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
  Linking,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import TeacherSidebar from "../../components/TeacherSidebar"; 
import api from "../../services/api"; 

// Enable LayoutAnimation
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function TStudentDetailScreen({ navigation, route }) {
  // --- STATE ---
  const { studentId } = route.params || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [expandedId, setExpandedId] = useState(null); 

  // --- FETCH DATA ---
  useEffect(() => {
    if(!studentId) {
        Alert.alert("Error", "No student selected");
        navigation.goBack();
        return;
    }
    fetchReport();
  }, [studentId]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/teacher/student/${studentId}/report`);
      setStudent(response.data.student);
      setSubjects(response.data.subjects);
      
      // Auto-expand the first subject if available
      if(response.data.subjects.length > 0) {
          setExpandedId(response.data.subjects[0].id);
      }
    } catch (error) {
      console.error("Fetch Report Error:", error);
      Alert.alert("Error", "Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCallParent = () => {
    if (student?.mobile) {
        Linking.openURL(`tel:${student.mobile}`);
    } else {
        Alert.alert("No Number", "Parent contact number not found.");
    }
  };

  const handleBackNavigation = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
      return true;
    }
    navigation.navigate('StudentDirectory');
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackNavigation
    );
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- HELPER: GENERATE SUBJECT STYLES ---
  const getSubjectStyle = (name) => {
    const n = name.toLowerCase();
    if(n.includes('math')) return { color: '#4f46e5', bg: '#eef2ff' }; // Indigo
    if(n.includes('science') || n.includes('physics')) return { color: '#ea580c', bg: '#fff7ed' }; // Orange
    if(n.includes('english')) return { color: '#2563eb', bg: '#eff6ff' }; // Blue
    if(n.includes('social') || n.includes('history')) return { color: '#b45309', bg: '#fffbeb' }; // Yellow
    return { color: '#64748b', bg: '#f8fafc' }; // Gray/Default
  };

  if (loading) {
      return (
          <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
              <ActivityIndicator size="large" color="#4f46e5" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR --- */}
      <TeacherSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeItem="StudentDirectory"
      />

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={handleBackNavigation}>
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Student Profile</Text>
          </View>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)}>
            <FontAwesome5 name="bars" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* 1. Identity */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: student?.avatar }} 
                style={styles.avatarImage} 
              />
            </View>
            <View>
              <Text style={styles.profileName}>{student?.name}</Text>
              <Text style={styles.profileInfo}>Class {student?.className} • Roll No. {student?.rollNo}</Text>
            </View>
          </View>

          {/* 2. Parent Contact Card */}
          <View style={styles.parentCard}>
            <View>
              <Text style={styles.parentLabel}>PARENT MOBILE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FontAwesome5 name="phone-alt" size={10} color="#64748b" />
                <Text style={styles.parentValue}>{student?.mobile || "N/A"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.contactIconBtn, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
                <FontAwesome5 name="whatsapp" size={14} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.contactIconBtn, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}
                onPress={handleCallParent}
              >
                <FontAwesome5 name="phone" size={12} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Subjects (Accordion) */}
          <Text style={styles.sectionTitle}>ACADEMIC REPORT</Text>
          <View style={styles.subjectList}>
            {subjects.length > 0 ? subjects.map((sub) => {
                const style = getSubjectStyle(sub.name);
                const isExpanded = expandedId === sub.id;

                return (
                  <View key={sub.id} style={[styles.subjectCard, { borderColor: isExpanded ? style.color : '#e2e8f0' }]}>
                    
                    {/* Header */}
                    <TouchableOpacity 
                      style={[styles.subjectHeader, isExpanded && { backgroundColor: style.bg }]} 
                      onPress={() => toggleAccordion(sub.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.subjectIconBox, { backgroundColor: style.bg }]}>
                          <Text style={[styles.subjectInitials, { color: style.color }]}>{sub.initials}</Text>
                        </View>
                        <View>
                          <Text style={styles.subjectName}>{sub.name}</Text>
                          <Text style={styles.subjectTeacher}>{sub.teacher}</Text>
                        </View>
                      </View>
                      
                      {/* Score Badge (Only visible if exam done) */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {sub.isExamDone && (
                            <View style={[styles.scoreBadge, { backgroundColor: '#f0fdf4' }]}>
                                <Text style={[styles.scoreText, { color: '#16a34a' }]}>{sub.examScore}</Text>
                            </View>
                        )}
                        <FontAwesome5 name={isExpanded ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>

                    {/* Body */}
                    {isExpanded && (
                      <View style={styles.subjectBody}>
                        <View style={styles.detailsGrid}>
                          
                          <DetailItem label="CURRENT CH" value={sub.chapter} />
                          
                          <DetailItem 
                            label="NOTEBOOK" 
                            value={sub.notebook} 
                            valueColor={sub.notebook === 'Checked' ? '#16a34a' : '#f97316'}
                            icon={sub.notebook === 'Checked' ? 'check' : 'clock'}
                          />
                          
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>LATEST EXAM</Text>
                            <Text style={styles.gridValue} numberOfLines={1}>{sub.examName}</Text>
                          </View>

                          <View style={[styles.gridItem, { alignItems: 'center' }]}>
                            <Text style={styles.gridLabel}>SCORE</Text>
                            {sub.isExamDone ? (
                              <Text style={[styles.gridValueBig, { color: style.color }]}>
                                {sub.examScore}<Text style={styles.gridTotal}>/{sub.examTotal}</Text>
                              </Text>
                            ) : (
                              <Text style={styles.notConducted}>No Exams Yet</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
            }) : (
                <Text style={styles.emptyText}>No subjects assigned to this student yet.</Text>
            )}
          </View>
          
          {/* TEACHER ACTIONS */}
          <View style={styles.teacherActionsContainer}>
            <Text style={styles.actionSectionTitle}>TEACHER ACTIONS</Text>
            <View style={styles.actionRow}>
               <TouchableOpacity style={[styles.actionBtn, styles.actionBtnBlue]} onPress={handleCallParent}>
                  <FontAwesome5 name="phone-alt" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Call Parent</Text>
               </TouchableOpacity>
               
               <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOrange]}>
                  <FontAwesome5 name="star" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Log Behavior</Text>
               </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        {/* FIXED BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyClasses')}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Classes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDirectory')}>
            <FontAwesome5 name="users" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Students</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */

const DetailItem = ({ label, value, valueColor = '#334155', icon }) => (
  <View style={styles.gridItem}>
    <Text style={styles.gridLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon && <FontAwesome5 name={icon} size={10} color={valueColor} />}
      <Text style={[styles.gridValue, { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  scrollContent: { flex: 1, padding: 20 },

  /* 1. Profile */
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  profileInfo: { fontSize: 14, color: '#64748b', marginTop: 2 },

  /* 2. Parent Contact */
  parentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  parentLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  parentValue: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  contactIconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  /* 3. Subjects */
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  subjectList: { gap: 12 },
  subjectCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  subjectIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  subjectInitials: { fontSize: 12, fontWeight: 'bold' },
  subjectName: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  subjectTeacher: { fontSize: 10, color: '#64748b' },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scoreText: { fontSize: 10, fontWeight: 'bold' },
  
  subjectBody: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  gridLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginBottom: 2 },
  gridValue: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  gridValueBig: { fontSize: 18, fontWeight: 'bold' },
  gridTotal: { fontSize: 12, fontWeight: 'normal', color: '#94a3b8' },
  notConducted: { fontSize: 10, fontStyle: 'italic', color: '#94a3b8', marginTop: 4 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 13, marginTop: 10 },

  /* Teacher Actions */
  teacherActionsContainer: { marginTop: 24 },
  actionSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  actionBtnBlue: { backgroundColor: '#4f46e5' },
  actionBtnOrange: { backgroundColor: '#f59e0b' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});