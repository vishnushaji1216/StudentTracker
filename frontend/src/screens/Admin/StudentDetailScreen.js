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
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api"; // <--- Ensure this path is correct

// Enable LayoutAnimation
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;

export default function StudentDetailScreen({ route, navigation }) {
  // 1. Get studentId from navigation params (passed from Registry)
  const { studentId } = route.params || {}; 

  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Sidebar Animations
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- FETCH DATA FROM API ---
  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    if (!studentId) return;
    try {
      setIsLoading(true);
      // Calls the new endpoint we just created
      const response = await api.get(`/admin/student/${studentId}`);
      setStudentData(response.data);
      
      // Expand the first subject by default if available
      if (response.data.subjects?.length > 0) {
        setExpandedId(response.data.subjects[0].id);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Failed to load student details");
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // --- NAVIGATION HANDLERS ---
  const handleBackNavigation = () => {
    if (isSidebarOpen) {
      toggleSidebar();
      return true;
    }
    navigation.goBack();
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackNavigation);
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

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role"]);
    navigation.replace("Login");
  };

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Loading Profile...</Text>
      </View>
    );
  }

  if (!studentData) return null;

  const { identity, metrics, chart, classTeacher, subjects } = studentData;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* SIDEBAR OVERLAY */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents={isSidebarOpen ? "auto" : "none"}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* SIDEBAR DRAWER */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
         {/* ... Sidebar Content (Same as before) ... */}
         <View style={styles.sidebarContainer}>
           <View>
             <View style={styles.sidebarHeader}>
               <View style={styles.logoBox}><Text style={styles.logoText}>S</Text></View>
               <View>
                 <Text style={styles.sidebarTitle}>Stella Admin</Text>
                 <Text style={styles.sidebarVersion}>v5.0.0</Text>
               </View>
             </View>
             <View style={styles.menuSection}>
               <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => { toggleSidebar(); navigation.navigate('AdminDash'); }} />
               <SidebarItem icon="user-plus" label="Add User" onPress={() => { toggleSidebar(); navigation.navigate('AddUser'); }} />
               <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => { toggleSidebar(); navigation.navigate('TeacherRegistry'); }} />
               <SidebarItem icon="list-ul" label="Student Registry" active onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry'); }} />
               <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
               <SidebarItem icon="graduation-cap" label="Promotion Tool" />
               <SidebarItem icon="shield-alt" label="Security" onPress={() => { toggleSidebar(); navigation.navigate('AdminSetting'); }}/>
             </View>
           </View>
           <View style={styles.sidebarFooter}>
             <View style={styles.footerRow}>
               <TouchableOpacity style={styles.settingsBtn}>
                 <FontAwesome5 name="cog" size={16} color="#64748b" />
                 <Text style={styles.settingsText}>Settings</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
                 <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
               </TouchableOpacity>
             </View>
           </View>
         </View>
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={handleBackNavigation}>
              <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Student Profile</Text>
          </View>
          <TouchableOpacity onPress={toggleSidebar}>
            <FontAwesome5 name="bars" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* 1. IDENTITY CARD */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {identity.profilePic ? (
                 <Image source={{ uri: identity.profilePic }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{identity.initials}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.profileName}>{identity.name}</Text>
              <Text style={styles.profileInfo}>Class {identity.className} • Roll {identity.rollNo}</Text>
              <Text style={styles.grText}>GR: {identity.grNumber}</Text>
            </View>
          </View>

          {/* 2. METRICS GRID */}
          <View style={styles.metricsGrid}>
            <MetricCard label="AVG SCORE" value={metrics.avgScore} color="#2563eb" bgColor="#eff6ff" borderColor="#dbeafe" />
            <MetricCard 
              label="FEE STATUS" 
              value={metrics.feeStatus} 
              color={metrics.feeStatus === 'Clear' ? "#16a34a" : "#dc2626"} 
              bgColor={metrics.feeStatus === 'Clear' ? "#f0fdf4" : "#fef2f2"} 
              borderColor={metrics.feeStatus === 'Clear' ? "#dcfce7" : "#fee2e2"} 
            />
            <MetricCard label="WRITING" value={metrics.writingGrade} color="#9333ea" bgColor="#faf5ff" borderColor="#f3e8ff" />
          </View>

          {/* 3. CLASS TEACHER */}
          {classTeacher && (
            <View style={styles.teacherCard}>
              <Image 
                source={{ uri: classTeacher.pic || "https://ui-avatars.com/api/?name=" + classTeacher.name }} 
                style={styles.teacherImg} 
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.teacherLabel}>CLASS TEACHER</Text>
                <Text style={styles.teacherName}>{classTeacher.name}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert("Call", `Calling ${classTeacher.mobile}`)}>
                <FontAwesome5 name="phone-alt" size={12} color="#4f46e5" />
              </TouchableOpacity>
            </View>
          )}

          {/* 4. PARENT CONTACT */}
          <View style={styles.parentCard}>
            <View>
              <Text style={styles.parentLabel}>PARENT MOBILE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FontAwesome5 name="phone-alt" size={10} color="#64748b" />
                <Text style={styles.parentValue}>{identity.mobile}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.contactIconBtn, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
                <FontAwesome5 name="whatsapp" size={14} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactIconBtn, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}>
                <FontAwesome5 name="phone" size={12} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. CHART (Comparison) */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>OVERALL VS CLASS</Text>
            <View style={styles.barContainer}>
              <View style={styles.barRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.barLabelStudent}>{identity.name.split(' ')[0]}</Text>
                  <Text style={styles.barValStudent}>{chart.studentAvg}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${chart.studentAvg}%`, backgroundColor: '#4f46e5' }]} />
                </View>
              </View>
              <View style={styles.barRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.barLabelClass}>Class Average</Text>
                  <Text style={styles.barValClass}>{chart.classAvg}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${chart.classAvg}%`, backgroundColor: '#cbd5e1' }]} />
                </View>
              </View>
            </View>
            <View style={styles.trendRow}>
              <FontAwesome5 
                name={chart.studentAvg >= chart.classAvg ? "arrow-up" : "arrow-down"} 
                size={10} 
                color={chart.studentAvg >= chart.classAvg ? "#16a34a" : "#dc2626"} 
              />
              <Text style={[styles.trendText, { color: chart.studentAvg >= chart.classAvg ? "#16a34a" : "#dc2626" }]}>
                {chart.trend}
              </Text>
            </View>
          </View>

          {/* 6. SUBJECTS ACCORDION */}
          <Text style={styles.sectionTitle}>SUBJECT BREAKDOWN</Text>
          <View style={styles.subjectList}>
            {subjects.length === 0 ? (
                <Text style={{textAlign:'center', color:'#94a3b8', marginTop:10}}>No subjects found.</Text>
            ) : subjects.map((sub) => (
              <View key={sub.id} style={[styles.subjectCard, { borderColor: expandedId === sub.id ? sub.color : '#e2e8f0' }]}>
                
                {/* Header */}
                <TouchableOpacity 
                  style={[styles.subjectHeader, expandedId === sub.id && { backgroundColor: sub.bgColor }]} 
                  onPress={() => toggleAccordion(sub.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.subjectIconBox, { backgroundColor: sub.bgColor }]}>
                      <Text style={[styles.subjectInitials, { color: sub.color }]}>{sub.initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.subjectName}>{sub.name}</Text>
                      <Text style={styles.subjectTeacher}>{sub.teacher}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {/* Score Badge */}
                    <View style={[styles.scoreBadge, { backgroundColor: sub.bgColor }]}>
                       <Text style={[styles.scoreText, { color: sub.color }]}>{sub.isExamDone ? sub.examScore + '%' : 'N/A'}</Text>
                    </View>
                    <FontAwesome5 name={expandedId === sub.id ? "chevron-up" : "chevron-down"} size={12} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                {/* Body */}
                {expandedId === sub.id && (
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
                        <Text style={styles.gridValue}>{sub.examName}</Text>
                      </View>

                      <View style={[styles.gridItem, { alignItems: 'center' }]}>
                        <Text style={styles.gridLabel}>SCORE</Text>
                        {sub.isExamDone ? (
                          <Text style={[styles.gridValueBig, { color: sub.color }]}>
                            {sub.examScore}<Text style={styles.gridTotal}>/{sub.examTotal}</Text>
                          </Text>
                        ) : (
                          <Text style={styles.notConducted}>Not Conducted</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// --- SUB-COMPONENTS ---
const MetricCard = ({ label, value, color, bgColor, borderColor }) => (
  <View style={[styles.metricCard, { backgroundColor: bgColor, borderColor: borderColor }]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
  </View>
);

const DetailItem = ({ label, value, valueColor = '#334155', icon }) => (
  <View style={styles.gridItem}>
    <Text style={styles.gridLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon && <FontAwesome5 name={icon} size={10} color={valueColor} />}
      <Text style={[styles.gridValue, { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES (Kept consistent with your original file) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoBox: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuSection: { gap: 8 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutIconBtn: { padding: 4 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  scrollContent: { flex: 1, padding: 20 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  profileInfo: { fontSize: 14, color: '#64748b', marginTop: 2 },
  grText: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginTop: 4 },

  metricsGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  metricCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 'bold' },

  teacherCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 12 },
  teacherImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  teacherLabel: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', marginBottom: 2 },
  teacherName: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  callBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e0e7ff' },

  parentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  parentLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 },
  parentValue: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  contactIconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  chartCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  chartTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  barContainer: { gap: 12 },
  barRow: { marginBottom: 4 },
  barLabelStudent: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },
  barValStudent: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  barLabelClass: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  barValClass: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  barTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  trendText: { fontSize: 10, fontWeight: 'bold' },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12 },
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
});