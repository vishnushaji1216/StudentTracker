import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

/**
 * AddUserScreen Component
 * Finalized version for Android with typeable class/subject assignments.
 */
export default function AddUserScreen({ navigation }) {
  const [activeRole, setActiveRole] = useState("teacher"); 

  // Sidebar Animations
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form States - Teacher
  const [teacherName, setTeacherName] = useState("");
  const [teacherMobile, setTeacherMobile] = useState("");
  const [teacherClassTeachership, setTeacherClassTeachership] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  
  // Teaching Assignment Logic (Linked Class & Subject as typing inputs)
  const [tempClass, setTempClass] = useState("");
  const [tempSubject, setTempSubject] = useState("");
  const [teachingAssignments, setTeachingAssignments] = useState([
    { class: "9-A", subject: "Math" },
    { class: "10-B", subject: "Physics" }
  ]);

  // Form States - Student
  const [studentName, setStudentName] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Handle Android Back Button to close sidebar first
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isSidebarOpen) {
          toggleSidebar();
          return true;
        }
        return false;
      }
    );
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

  // Logic to add a linked assignment (Class + Subject)
  const addAssignment = () => {
    if (tempClass.trim() && tempSubject.trim()) {
      setTeachingAssignments([...teachingAssignments, { 
        class: tempClass.trim(), 
        subject: tempSubject.trim() 
      }]);
      setTempClass("");
      setTempSubject("");
    }
  };

  const removeAssignment = (index) => {
    setTeachingAssignments(teachingAssignments.filter((_, i) => i !== index));
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      if (navigation) navigation.replace("Login");
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

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.sidebarContainer}>
          <View>
            <View style={styles.sidebarHeader}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <View>
                <Text style={styles.sidebarTitle}>Stella Admin</Text>
                <Text style={styles.sidebarVersion}>v5.0.0</Text>
              </View>
            </View>

            <View style={styles.menuSection}>
              <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => { toggleSidebar(); navigation?.navigate('AdminDash'); }} />
              <SidebarItem icon="user-plus" label="Add User" active />
              <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => { toggleSidebar(); navigation?.navigate('TeacherRegistry'); }} />
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => { toggleSidebar(); navigation?.navigate('StudentRegistry'); }} />
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => { toggleSidebar(); navigation?.navigate('Broadcast'); }}/>
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

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Onboard Users</Text>
          </View>
          <TouchableOpacity>
            <FontAwesome5 name="ellipsis-v" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentPadding}>
              
              {/* Role Toggle Tabs */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, activeRole === 'teacher' && styles.toggleBtnActive]}
                  onPress={() => setActiveRole('teacher')}
                >
                  <Text style={[styles.toggleText, activeRole === 'teacher' && styles.toggleTextActive]}>Teacher</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, activeRole === 'student' && styles.toggleBtnActive]}
                  onPress={() => setActiveRole('student')}
                >
                  <Text style={[styles.toggleText, activeRole === 'student' && styles.toggleTextActive]}>Student</Text>
                </TouchableOpacity>
              </View>

              {/* ================= TEACHER FORM ================= */}
              {activeRole === 'teacher' && (
                <View style={styles.formSection}>
                  <View style={styles.imageUploadRow}>
                    <TouchableOpacity style={styles.imageUploadCircle}>
                      <FontAwesome5 name="camera" size={24} color="#94a3b8" />
                      <Text style={styles.imageUploadText}>ADD PHOTO</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="e.g. Priya Sharma" 
                      placeholderTextColor="#cbd5e1"
                      value={teacherName}
                      onChangeText={setTeacherName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>MOBILE NUMBER</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="9876543210" 
                      placeholderTextColor="#cbd5e1"
                      keyboardType="phone-pad"
                      value={teacherMobile}
                      onChangeText={setTeacherMobile}
                    />
                  </View>

                  {/* Class Teachership (Now a standard typing input) */}
                  <View style={styles.cardInput}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <FontAwesome5 name="star" size={10} color="#818cf8" />
                      <Text style={[styles.label, { marginBottom: 0, color: '#818cf8' }]}>CLASS TEACHERSHIP</Text>
                    </View>
                    <TextInput 
                      style={[styles.input, { backgroundColor: '#fff', color: '#4f46e5' }]} 
                      placeholder="Type Main Class (e.g. 10-A)" 
                      placeholderTextColor="#a5b4fc"
                      value={teacherClassTeachership}
                      onChangeText={setTeacherClassTeachership}
                    />
                    <Text style={styles.helperText}>This class will appear on their main dashboard.</Text>
                  </View>

                  {/* Teaching Assignments (Linked Class & Subject with Typing) */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>TEACHING ASSIGNMENTS</Text>
                    <View style={styles.assignmentEntryRow}>
                      <TextInput 
                        style={[styles.input, { flex: 1.5, fontSize: 12 }]} 
                        placeholder="Class (9-A)" 
                        placeholderTextColor="#cbd5e1"
                        value={tempClass}
                        onChangeText={setTempClass}
                      />
                      <TextInput 
                        style={[styles.input, { flex: 1.5, fontSize: 12 }]} 
                        placeholder="Subject (Math)" 
                        placeholderTextColor="#cbd5e1"
                        value={tempSubject}
                        onChangeText={setTempSubject}
                      />
                      <TouchableOpacity style={styles.addBtn} onPress={addAssignment}>
                        <Text style={styles.addBtnText}>ADD</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tagContainer}>
                      {teachingAssignments.map((item, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{item.class}: {item.subject}</Text>
                          <TouchableOpacity onPress={() => removeAssignment(index)}>
                            <FontAwesome5 name="times" size={10} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>TEACHER CODE</Text>
                      <View style={styles.readOnlyInput}>
                        <Text style={styles.readOnlyText}>T-2025-08</Text>
                        <FontAwesome5 name="lock" size={10} color="#94a3b8" />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>SET PASSWORD</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Password" 
                        placeholderTextColor="#cbd5e1"
                        secureTextEntry
                        value={teacherPassword}
                        onChangeText={setTeacherPassword}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Create Teacher</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ================= STUDENT FORM ================= */}
              {activeRole === 'student' && (
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>STUDENT NAME</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="e.g. Rahul Kumar" 
                      placeholderTextColor="#cbd5e1"
                      value={studentName}
                      onChangeText={setStudentName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PARENT MOBILE NUMBER</Text>
                    <View style={styles.iconInputContainer}>
                      <FontAwesome5 name="phone-alt" size={14} color="#94a3b8" style={{ marginLeft: 12 }} />
                      <TextInput 
                        style={styles.iconInput} 
                        placeholder="9876543210" 
                        placeholderTextColor="#cbd5e1"
                        keyboardType="phone-pad"
                        value={parentMobile}
                        onChangeText={setParentMobile}
                      />
                    </View>
                  </View>

                  {/* Assign Class (TextInput) & Roll No */}
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 2 }]}>
                      <Text style={styles.label}>ASSIGN CLASS</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="e.g. 9-A" 
                        placeholderTextColor="#cbd5e1"
                        value={studentClass}
                        onChangeText={setStudentClass}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>ROLL NO.</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="01" 
                        placeholderTextColor="#cbd5e1"
                        keyboardType="numeric"
                        value={studentRoll}
                        onChangeText={setStudentRoll}
                      />
                    </View>
                  </View>

                  <View style={styles.credentialsBox}>
                    <Text style={[styles.label, { marginBottom: 12 }]}>LOGIN SETUP</Text>
                    <View style={styles.credentialRow}>
                      <View style={styles.credentialIconBox}><FontAwesome5 name="id-card" size={14} color="#94a3b8" /></View>
                      <View>
                        <Text style={styles.credentialLabel}>LOGIN ID</Text>
                        <Text style={styles.credentialValue}>Mobile Number <Text style={{ fontWeight: '400', color: '#94a3b8' }}>OR</Text> Roll No</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.label}>SET PERMANENT PASSWORD</Text>
                      <View style={styles.iconInputContainerWhite}>
                        <FontAwesome5 name="key" size={12} color="#94a3b8" style={{ marginLeft: 12 }} />
                        <TextInput 
                          style={styles.iconInput} 
                          placeholder="Create password" 
                          placeholderTextColor="#cbd5e1"
                          secureTextEntry
                          value={studentPassword}
                          onChangeText={setStudentPassword}
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Add Student</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.bulkLink}>
                    <FontAwesome5 name="layer-group" size={12} color="#4f46e5" />
                    <Text style={styles.bulkLinkText}>Bulk Upload Students?</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('AdminDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="user-plus" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Add User</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
    <FontAwesome5 
      name={icon} 
      size={16} 
      color={active ? "#4f46e5" : "#64748b"} 
      style={{ width: 24 }} 
    />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  scrollContent: { flex: 1, backgroundColor: '#fff' },
  contentPadding: { padding: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  toggleTextActive: { color: '#4f46e5' },
  formSection: { gap: 20 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  inputGroup: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  helperText: { fontSize: 10, color: '#94a3b8', marginTop: 4, marginLeft: 4 },
  imageUploadRow: { alignItems: 'center', marginBottom: 8 },
  imageUploadCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  imageUploadText: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  cardInput: { backgroundColor: '#eef2ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  assignmentEntryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  tagText: { fontSize: 11, fontWeight: 'bold', color: '#1d4ed8' },
  readOnlyInput: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readOnlyText: { fontSize: 12, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#475569' },
  iconInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12 },
  iconInputContainerWhite: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12 },
  iconInput: { flex: 1, padding: 12, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  credentialsBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  credentialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  credentialIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  credentialLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  credentialValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  primaryBtn: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 4, marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  bulkLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, marginTop: 8 },
  bulkLinkText: { color: '#4f46e5', fontSize: 12, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});