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
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

const CLASS_LIST = [
  "Nursery", "KG1", "KG2", 
  "1-A", "1-B", "2-A", "2-B", "3-A", "3-B", 
  "4-A", "4-B", "5-A", "5-B", "6-A", "6-B", 
  "7-A", "7-B", "8-A", "8-B", "9-A", "9-B", "10-A", "10-B"
];

export default function AddUserScreen({ navigation }) {
  const [activeRole, setActiveRole] = useState("teacher"); 
  const [loading, setLoading] = useState(false);

  // Sidebar Animations
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toast Animation State
  const toastAnim = useRef(new Animated.Value(100)).current; 
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success', password: '' });

  // Form States - Teacher
  const [teacherName, setTeacherName] = useState("");
  const [teacherMobile, setTeacherMobile] = useState("");
  const [teacherClassTeachership, setTeacherClassTeachership] = useState("");
  const [tempClass, setTempClass] = useState("");
  const [tempSubject, setTempSubject] = useState("");
  const [teachingAssignments, setTeachingAssignments] = useState([]);

  // Form States - Student
  const [studentName, setStudentName] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [grNumber, setGrNumber] = useState("");
  const [isClassModalVisible, setClassModalVisible] = useState(false);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) { toggleSidebar(); return true; }
      return false;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // Toast Logic
  const showToast = (message, type = 'success', password = '') => {
    setToast({ visible: true, message, type, password });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();

    const duration = password ? 6000 : 2500;
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
      });
    }, duration);
  };

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isOpen ? -SIDEBAR_WIDTH : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 0 : 0.5, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsSidebarOpen(!isOpen);
  };

  // ADDED: Missing Logout Logic
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      if (navigation) navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const addAssignment = () => {
    if (tempClass.trim() && tempSubject.trim()) {
      setTeachingAssignments([...teachingAssignments, { class: tempClass.trim(), subject: tempSubject.trim() }]);
      setTempClass(""); setTempSubject("");
    }
  };

  const removeAssignment = (index) => {
    setTeachingAssignments(teachingAssignments.filter((_, i) => i !== index));
  };

  const handleOnboard = async () => {
    if (activeRole === 'teacher') {
      if (!teacherName) return showToast("Please enter Teacher Name", "error");
      if (!teacherMobile) return showToast("Please enter Mobile Number", "error");
      if (teacherMobile.length !== 10) return showToast("Mobile must be 10 digits", "error");
    } else {
      if (!studentName) return showToast("Please enter Student Name", "error");
      if (!parentMobile) return showToast("Please enter Parent Mobile", "error");
      if (parentMobile.length !== 10) return showToast("Mobile must be 10 digits", "error");
      if (!grNumber) return showToast("Please enter GR Number", "error");
      if (!studentClass) return showToast("Please select a Class", "error");
      if (!studentRoll) return showToast("Please enter Roll Number", "error");
    }

    setLoading(true);
    try {
      const payload = activeRole === 'teacher' ? {
        role: 'teacher', name: teacherName, mobile: teacherMobile,
        classTeachership: teacherClassTeachership, assignments: teachingAssignments,
      } : {
        role: 'student', name: studentName, mobile: parentMobile,
        className: studentClass, rollNo: studentRoll, grNumber: grNumber,
      };

      const response = await api.post('/admin/onboard', payload);
      
      showToast(
        `${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} registered successfully!`,
        'success',
        response.data.generatedPassword
      );

      if (activeRole === 'teacher') {
        setTeacherName(""); setTeacherMobile(""); setTeacherClassTeachership(""); setTeachingAssignments([]);
      } else {
        setStudentName(""); setParentMobile(""); setStudentClass(""); setStudentRoll(""); setGrNumber("");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Connection failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* SIDEBAR OVERLAY */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents={isSidebarOpen ? "auto" : "none"}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* SIDEBAR DRAWER */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
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
              <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => { toggleSidebar(); navigation.navigate('AdminDash');}} />
              <SidebarItem icon="user-plus" label="Add User" active />
              <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => {toggleSidebar(); navigation.navigate('TeacherRegistry');}}/>
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry');}}/>
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar();navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Security" onPress={() => {toggleSidebar(); navigation.navigate('AdminSetting');}}/>
            </View>
          </View>
          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn} onPress={() => {toggleSidebar(); navigation.navigate('AdminSetting');}}>
                <FontAwesome5 name="cog" size={16} color="#64748b" />
                <Text style={styles.settingsText}>Settings</Text>
              </TouchableOpacity>
              {/* handleLogout reference here */}
              <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Onboard Users</Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <View style={styles.contentPadding}>
              
              <View style={styles.toggleContainer}>
                <TouchableOpacity style={[styles.toggleBtn, activeRole === 'teacher' && styles.toggleBtnActive]} onPress={() => setActiveRole('teacher')}>
                  <Text style={[styles.toggleText, activeRole === 'teacher' && styles.toggleTextActive]}>Teacher</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, activeRole === 'student' && styles.toggleBtnActive]} onPress={() => setActiveRole('student')}>
                  <Text style={[styles.toggleText, activeRole === 'student' && styles.toggleTextActive]}>Student</Text>
                </TouchableOpacity>
              </View>

              {activeRole === 'teacher' ? (
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput style={styles.input} placeholder="e.g. Priya Sharma" placeholderTextColor="#cbd5e1" value={teacherName} onChangeText={setTeacherName} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>MOBILE NUMBER</Text>
                    <TextInput style={styles.input} placeholder="9876543210" placeholderTextColor="#cbd5e1" keyboardType="phone-pad" value={teacherMobile} onChangeText={setTeacherMobile} />
                  </View>
                  <View style={styles.cardInput}>
                    <Text style={[styles.label, { color: '#818cf8' }]}>CLASS TEACHERSHIP</Text>
                    <TextInput style={[styles.input, { backgroundColor: '#fff', color: '#4f46e5' }]} placeholder="Main Class (e.g. 10-A)" placeholderTextColor="#a5b4fc" value={teacherClassTeachership} onChangeText={setTeacherClassTeachership} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>TEACHING ASSIGNMENTS</Text>
                    <View style={styles.assignmentEntryRow}>
                      <TextInput style={[styles.input, { flex: 1.5 }]} placeholder="9-A" placeholderTextColor="#cbd5e1" value={tempClass} onChangeText={setTempClass} />
                      <TextInput style={[styles.input, { flex: 1.5 }]} placeholder="Math" placeholderTextColor="#cbd5e1" value={tempSubject} onChangeText={setTempSubject} />
                      <TouchableOpacity style={styles.addBtn} onPress={addAssignment}><Text style={styles.addBtnText}>ADD</Text></TouchableOpacity>
                    </View>
                    <View style={styles.tagContainer}>
                      {teachingAssignments.map((item, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{item.class}: {item.subject}</Text>
                          <TouchableOpacity onPress={() => removeAssignment(index)}><FontAwesome5 name="times" size={10} color="#ef4444" /></TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleOnboard} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Teacher</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>STUDENT NAME</Text>
                    <TextInput style={styles.input} placeholder="e.g. Rahul Kumar" placeholderTextColor="#cbd5e1" value={studentName} onChangeText={setStudentName} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PARENT MOBILE</Text>
                    <View style={styles.iconInputContainer}>
                      <FontAwesome5 name="phone-alt" size={12} color="#94a3b8" style={{ marginLeft: 12 }} />
                      <TextInput style={styles.iconInput} placeholder="9876543210" placeholderTextColor="#cbd5e1" keyboardType="phone-pad" value={parentMobile} onChangeText={setParentMobile} />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>GR NUMBER</Text>
                    <View style={styles.iconInputContainer}>
                      <FontAwesome5 name="hashtag" size={12} color="#94a3b8" style={{ marginLeft: 12 }} />
                      <TextInput style={styles.iconInput} placeholder="GR-9088" placeholderTextColor="#cbd5e1" value={grNumber} onChangeText={setGrNumber} />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.label}>ASSIGN CLASS</Text>
                      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setClassModalVisible(true)}>
                        <Text style={[styles.dropdownTriggerText, !studentClass && { color: '#cbd5e1' }]}>{studentClass || "Select"}</Text>
                        <FontAwesome5 name="chevron-down" size={10} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>ROLL NO.</Text>
                      <TextInput style={styles.input} placeholder="01" placeholderTextColor="#cbd5e1" keyboardType="numeric" value={studentRoll} onChangeText={setStudentRoll} />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleOnboard} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Add Student</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* TOAST NOTIFICATION */}
        {toast.visible && (
          <Animated.View style={[
            styles.toastContainer, 
            { transform: [{ translateY: toastAnim }], backgroundColor: toast.type === 'error' ? '#fee2e2' : '#ecfdf5' }
          ]}>
            <View style={styles.toastContent}>
              <FontAwesome5 
                name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} 
                size={18} 
                color={toast.type === 'error' ? '#ef4444' : '#10b981'} 
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.toastMessage, { color: toast.type === 'error' ? '#b91c1c' : '#065f46' }]}>
                  {toast.message}
                </Text>
                {toast.password && (
                  <Text style={styles.toastPassword}>Default Password: <Text style={{ fontWeight: 'bold' }}>{toast.password}</Text></Text>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* CLASS MODAL */}
        <Modal visible={isClassModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Class</Text>
                <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                  <FontAwesome5 name="times" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {CLASS_LIST.map((item) => (
                  <TouchableOpacity key={item} style={styles.modalItem} onPress={() => { setStudentClass(item); setClassModalVisible(false); }}>
                    <Text style={[styles.modalItemText, studentClass === item && { color: '#4f46e5', fontWeight: 'bold' }]}>{item}</Text>
                    {studentClass === item && <FontAwesome5 name="check" size={14} color="#4f46e5" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* BOTTOM NAV */}
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
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
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
  cardInput: { backgroundColor: '#eef2ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff' },
  assignmentEntryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  tagText: { fontSize: 11, fontWeight: 'bold', color: '#1d4ed8' },
  iconInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12 },
  iconInput: { flex: 1, padding: 12, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, height: 48 },
  dropdownTriggerText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  primaryBtn: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 4, marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  toastContainer: { position: 'absolute', bottom: 90, left: 20, right: 20, padding: 16, borderRadius: 16, elevation: 10, zIndex: 1000, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  toastContent: { flexDirection: 'row', alignItems: 'center' },
  toastMessage: { fontSize: 14, fontWeight: 'bold' },
  toastPassword: { fontSize: 12, marginTop: 2, color: '#065f46' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalItemText: { fontSize: 16, color: '#475569' },
});