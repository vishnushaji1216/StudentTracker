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
  ActivityIndicator,
  Modal,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const SIDEBAR_WIDTH = 280;
const { height } = Dimensions.get('window');

export default function AdminBroadcastScreen({ navigation }) {
  // --- ANIMATION REFS ---
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(100)).current; 
  
  // Delete Modal Animations
  const deleteScaleAnim = useRef(new Animated.Value(0.8)).current;
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;

  // --- UI STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  // --- FORM STATE ---
  const [target, setTarget] = useState('Everyone');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // --- DATA STATE ---
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // --- 1. FETCH HISTORY ON MOUNT ---
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/broadcast-history');
      setHistoryData(response.data);
    } catch (error) {
      console.error("Fetch History Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SEND BROADCAST ---
  const handleSendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast("Please enter subject and message", "error");
      return;
    }

    setSending(true);
    try {
      const payload = {
        target: target,
        subject: subject,
        message: message,
        isUrgent: isUrgent
      };

      await api.post('/admin/broadcast', payload);

      showToast("Broadcast sent successfully!");
      
      // Reset Form
      setSubject("");
      setMessage("");
      setIsUrgent(false);
      setTarget("Everyone");
      fetchHistory();

    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  // --- 3. DELETE ACTIONS ---
  const confirmDelete = (id) => {
    setNoticeToDelete(id);
    setDeleteModalVisible(true);
    Animated.parallel([
        Animated.spring(deleteScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
        Animated.timing(deleteOpacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const executeDelete = async () => {
    if (!noticeToDelete) return;
    try {
      await api.delete(`/admin/broadcast/${noticeToDelete}`);
      setHistoryData(prev => prev.filter(n => (n._id || n.id) !== noticeToDelete));
      closeDeleteModal();
      showToast("Notice deleted successfully");
    } catch (error) {
      closeDeleteModal();
      showToast("Error deleting notice", "error");
    }
  };

  // --- HELPER FUNCTIONS ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2000);
  };

  const closeDeleteModal = () => {
    Animated.timing(deleteOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setDeleteModalVisible(false);
        setNoticeToDelete(null);
        deleteScaleAnim.setValue(0.8);
    });
  };

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isOpen ? -SIDEBAR_WIDTH : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 0 : 0.5, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsSidebarOpen(!isOpen);
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
              <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => { toggleSidebar(); navigation.navigate('AdminDash'); }} />
              <SidebarItem icon="user-plus" label="Add User" onPress={() => { toggleSidebar(); navigation.navigate('AddUser'); }} />
              <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => { toggleSidebar(); navigation.navigate('TeacherRegistry'); }} />
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry'); }} />
              <SidebarItem icon="bullhorn" label="Broadcast" active />
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar(); navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Settings" onPress={() => {toggleSidebar();navigation.navigate('AdminSetting');}}/>
            </View>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn} onPress={() => {toggleSidebar(); navigation.navigate('AdminSetting');}}>
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
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <FontAwesome5 name="bars" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Broadcast Center</Text>
          <View style={{ width: 20 }} /> 
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. Compose Card */}
            <View style={styles.composeCard}>
              <Text style={styles.sectionTitle}>NEW ANNOUNCEMENT</Text>

              {/* Target Radios */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SEND TO</Text>
                <View style={styles.radioRow}>
                  {['Everyone', 'Teachers', 'Parents'].map((opt) => (
                    <TouchableOpacity 
                      key={opt} 
                      style={[styles.radioBtn, target === opt && styles.radioBtnActive]}
                      onPress={() => setTarget(opt)}
                    >
                      <Text style={[styles.radioText, target === opt && styles.radioTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SUBJECT</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. School Holiday"
                  placeholderTextColor="#cbd5e1"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Message */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MESSAGE</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]}
                  placeholder="Type your announcement here..."
                  placeholderTextColor="#cbd5e1"
                  multiline
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              {/* Urgent Toggle */}
              <TouchableOpacity 
                style={styles.urgentRow} 
                activeOpacity={0.8}
                onPress={() => setIsUrgent(!isUrgent)}
              >
                <View style={[styles.checkbox, isUrgent && styles.checkboxChecked]}>
                  {isUrgent && <FontAwesome5 name="check" size={10} color="#fff" />}
                </View>
                <Text style={styles.urgentText}>Mark as Urgent (Push Notification)</Text>
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity 
                style={[styles.sendBtn, sending && { opacity: 0.7 }]} 
                onPress={handleSendBroadcast}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FontAwesome5 name="paper-plane" size={14} color="#fff" />
                    <Text style={styles.sendBtnText}>Send Broadcast</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* 2. History Section */}
            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>GLOBAL FEED & HISTORY</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
            ) : historyData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 10 }}>No announcements found.</Text>
            ) : (
              historyData.map((item) => {
                const isAdmin = item.sender.role === 'admin';
                return (
                  <View 
                    key={item._id || item.id} 
                    style={[styles.historyCard, item.isUrgent && styles.historyCardUrgent, !isAdmin && styles.historyCardTeacher]}
                  >
                    <View style={styles.historyHeader}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <View style={[styles.tag, item.isUrgent ? styles.tagUrgent : styles.tagNormal]}>
                          <Text style={[styles.tagText, item.isUrgent ? styles.tagTextUrgent : styles.tagTextNormal]}>
                            To: {item.targetAudience === 'Class' ? item.targetClass : item.targetAudience}
                          </Text>
                        </View>
                        {!isAdmin && (
                           <View style={styles.teacherBadge}>
                              <FontAwesome5 name="user-tie" size={8} color="#fff" />
                              <Text style={styles.teacherBadgeText}>{item.sender.name || "Teacher"}</Text>
                           </View>
                        )}
                      </View>
                      
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={[styles.dateText, item.isUrgent && { color: '#f87171' }]}>
                          {new Date(item.createdAt || item.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyTitleRow}>
                      <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                        {item.isUrgent && (
                          <FontAwesome5 name="exclamation-circle" size={14} color="#b91c1c" style={{ marginRight: 6 }} />
                        )}
                        <Text style={[styles.historyTitle, item.isUrgent && { color: '#991b1b' }]}>
                          {item.title}
                        </Text>
                      </View>
                      
                      {/* DELETE BUTTON */}
                      <TouchableOpacity onPress={() => confirmDelete(item._id || item.id)} style={{padding: 4}}>
                         <FontAwesome5 name="trash-alt" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={[styles.historyPreview, item.isUrgent && { color: '#dc2626' }]} numberOfLines={2}>
                      {item.message || item.preview}
                    </Text>
                  </View>
                );
              })
            )}

          </View>
        </ScrollView>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('AdminDash')}
          >
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('AddUser')}
          >
            <FontAwesome5 name="user-plus" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Users</Text>
          </TouchableOpacity>
        </View>

        {/* --- TOAST NOTIFICATION --- */}
        {toast.visible && (
          <Animated.View 
            style={[
              styles.toast, 
              toast.type === 'error' ? styles.toastError : styles.toastSuccess,
              { transform: [{ translateY: toastAnim }] }
            ]}
            pointerEvents="none"
          >
             <FontAwesome5 
                name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} 
                size={16} 
                color="#fff" 
             />
             <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}

      </SafeAreaView>

      {/* --- CUSTOM DELETE MODAL --- */}
      <Modal transparent visible={deleteModalVisible} animationType="none" onRequestClose={closeDeleteModal}>
          <View style={styles.modalBackdrop}>
             <Animated.View style={[styles.deleteModalContainer, { opacity: deleteOpacityAnim, transform: [{ scale: deleteScaleAnim }] }]}>
                
                <View style={styles.deleteIconContainer}>
                    <FontAwesome5 name="trash-alt" size={24} color="#ef4444" />
                </View>

                <Text style={styles.deleteModalTitle}>Delete Broadcast?</Text>
                <Text style={styles.deleteModalSub}>
                    Are you sure you want to remove this announcement? It will be removed for all users.
                </Text>

                <View style={styles.deleteModalActions}>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={closeDeleteModal}>
                        <Text style={styles.cancelModalText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.confirmDeleteBtn} onPress={executeDelete}>
                        <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
                    </TouchableOpacity>
                </View>

             </Animated.View>
          </View>
      </Modal>

    </View>
  );
}

/* --- SUB-COMPONENTS --- */

const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
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

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Content */
  scrollContent: { flex: 1, backgroundColor: '#F8FAFC' },
  contentPadding: { padding: 20 },

  /* Compose Card */
  composeCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 16, textTransform: 'uppercase' },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  textArea: { height: 100 },
  
  /* Radio Buttons */
  radioRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radioBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  radioBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  radioText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  radioTextActive: { color: '#fff' },

  /* Urgent Toggle */
  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  urgentText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },

  /* Send Button */
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* History Items */
  historyCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  historyCardUrgent: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  historyCardTeacher: { borderColor: '#cbd5e1', borderLeftWidth: 4, borderLeftColor: '#64748b' }, // Visual distinction for teacher posts
  
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  tagNormal: { backgroundColor: '#f1f5f9', borderColor: '#f1f5f9' },
  tagUrgent: { backgroundColor: '#fff', borderColor: '#fee2e2' },
  tagText: { fontSize: 10, fontWeight: 'bold' },
  tagTextNormal: { color: '#64748b' },
  tagTextUrgent: { color: '#ef4444' },
  
  teacherBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#64748b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  teacherBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },

  dateText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  historyTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  historyPreview: { fontSize: 12, color: '#64748b' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  /* --- TOAST STYLES --- */
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* --- MODAL STYLES --- */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  deleteIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  deleteModalSub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  deleteModalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelModalText: { color: '#64748b', fontWeight: 'bold' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontWeight: 'bold' },
});