import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  Image,
  UIManager,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const SIDEBAR_WIDTH = 280;
const { height } = Dimensions.get('window');

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function NoticeBoardScreen({ navigation }) {
  // --- ANIMATION REFS ---
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const composeAnim = useRef(new Animated.Value(height)).current;
  const toastAnim = useRef(new Animated.Value(100)).current; 
  const deleteScaleAnim = useRef(new Animated.Value(0.8)).current;
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;

  // --- UI STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Admin', 'Sent'
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  // --- DATA STATE ---
  const [profile, setProfile] = useState({ name: 'Loading...', code: '...', mainClass: '' });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myClasses, setMyClasses] = useState([]);

  // --- FORM STATE ---
  const [targetClass, setTargetClass] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [creating, setCreating] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchProfileAndClasses();
    fetchNotices();
  }, []);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isComposeOpen) {
        closeCompose();
        return true;
      }
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen, isComposeOpen]);

  // --- API FUNCTIONS ---

  const fetchProfileAndClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      
      // FIXED: Access data from response.data.profile and response.data.classes
      const profileData = response.data.profile;
      const classesData = response.data.classes;

      setProfile({
        name: profileData?.name || "Teacher",
        code: profileData?.teacherCode || "T-XXXX",
        mainClass: profileData?.classTeachership || "N/A"
      });

      // Extract unique class IDs from the classes array
      const classList = classesData.map(c => c.id);
      
      // Remove duplicates just in case
      const uniqueClasses = [...new Set(classList)];
      
      setMyClasses(uniqueClasses);
      if (uniqueClasses.length > 0) setTargetClass(uniqueClasses[0]);

    } catch (error) {
      console.error("Fetch Profile Error:", error);
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teacher/notices');
      setNotices(response.data);
    } catch (error) {
      console.error("Fetch Notices Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePostNotice = async () => {
    if (!title.trim() || !message.trim()) {
      showToast("Please fill all fields", "error");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title,
        message,
        target: 'Class', 
        targetClass: targetClass,
        isUrgent
      };

      await api.post('/teacher/notices', payload);
      
      showToast("Notice posted successfully!");
      closeCompose();
      setTitle('');
      setMessage('');
      setIsUrgent(false);
      fetchNotices();
      setActiveTab('Sent');

    } catch (error) {
      showToast("Failed to post notice", "error");
    } finally {
      setCreating(false);
    }
  };

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
      await api.delete(`/teacher/notices/${noticeToDelete}`);
      setNotices(prev => prev.filter(n => n._id !== noticeToDelete));
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

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const openCompose = () => {
    setIsComposeOpen(true);
    Animated.spring(composeAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 90 }).start();
  };

  const closeCompose = () => {
    Animated.timing(composeAnim, { toValue: height, duration: 200, useNativeDriver: true }).start(() => setIsComposeOpen(false));
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // --- FILTER LOGIC (This was missing!) ---
  const filteredNotices = notices.filter(item => {
    // Safety check for data integrity
    if (!item || !item.sender) return false;

    const isAdmin = item.sender.role === 'admin';
    const isMe = !isAdmin; // Logic for 'Sent' tab

    if (activeTab === 'All') return true;
    if (activeTab === 'Admin') return isAdmin;
    if (activeTab === 'Sent') return isMe;
    return true;
  });

  // --- RENDER NOTICE ITEM ---
  const renderNoticeItem = ({ item }) => {
    // Safety Check
    if (!item || !item.sender) return null;

    const isAdmin = item.sender.role === 'admin';
    const isMe = !isAdmin; 

    return (
      <View style={[styles.card, item.isUrgent && styles.cardUrgent]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.avatarBox, isAdmin ? styles.avatarAdmin : styles.avatarMe]}>
              <FontAwesome5 
                name={isAdmin ? "shield-alt" : "user"} 
                size={12} 
                color={isAdmin ? "#ef4444" : "#4f46e5"} 
              />
            </View>
            <View>
              <Text style={styles.senderName}>{isAdmin ? "Admin Broadcast" : "You"}</Text>
              <Text style={styles.targetText}>
                 To: {item.targetAudience === 'Class' ? item.targetClass : item.targetAudience}
              </Text>
            </View>
          </View>
          
          <View style={{alignItems: 'flex-end'}}>
             <Text style={[styles.dateText, item.isUrgent && { color: '#ef4444' }]}>
                {new Date(item.createdAt).toLocaleDateString()}
             </Text>
             {isMe && (
               <TouchableOpacity onPress={() => confirmDelete(item._id)} style={{marginTop: 8, padding: 4}}>
                  <FontAwesome5 name="trash-alt" size={12} color="#ef4444" />
               </TouchableOpacity>
             )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, item.isUrgent && { color: '#b91c1c' }]}>
            {item.isUrgent && <FontAwesome5 name="exclamation-circle" size={12} color="#ef4444" style={{marginRight: 6}} />} 
            {item.title}
          </Text>
          <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
        </View>

        {/* Footer (Only for Sent items) */}
        {!isAdmin && (
           <View style={styles.cardFooter}>
             <View style={styles.readStatus}>
               <FontAwesome5 name="check-double" size={10} color="#cbd5e1" />
               <Text style={[styles.readText, {color: '#94a3b8'}]}>Sent</Text>
             </View>
           </View>
        )}
      </View>
    );
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
            {/* Dynamic Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <Image 
                source={{ uri: "https://i.pravatar.cc/150?img=5" }} 
                style={styles.profilePic} 
              />
              <View>
                <Text style={styles.teacherName}>{profile.name}</Text>
                <Text style={styles.teacherCode}>{profile.code}</Text>
              </View>
              <View style={styles.classTag}>
                <Text style={styles.classTagText}>Class Teacher: {profile.mainClass || 'N/A'}</Text>
              </View>
            </View>

            {/* FULL Navigation Menu */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => handleNav('TeacherDash')} />
              <SidebarItem icon="calendar-check" label="Daily Tasks" onPress={() => handleNav('DailyTask')} />
              <SidebarItem icon="chalkboard-teacher" label="My Classes" onPress={() => handleNav('MyClasses')} />
              <SidebarItem icon="users" label="Student Directory" onPress={() => handleNav('StudentDirectory')} />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>CONTENT & GRADING</Text>

              <SidebarItem icon="list-ul" label="Quiz Manager" onPress={() => handleNav('QuizDashboard')} />
              <SidebarItem icon="pen-fancy" label="Handwriting Review" onPress={() => handleNav('HandwritingReview')} />
              <SidebarItem icon="headphones" label="Audio Review" onPress={() => handleNav('AudioReview')} />
              <SidebarItem icon="bullhorn" label="Notice Board" onPress={() => handleNav('NoticeBoard')} active={true} />
              <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('ResourceLibrary')} />
              
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
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notice Board</Text>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabRow}>
            {['All', 'Admin', 'Sent'].map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notice List */}
        <View style={styles.contentContainer}>
          {loading ? (
             <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
          ) : (
             <FlatList
               data={filteredNotices}
               keyExtractor={item => item._id}
               renderItem={renderNoticeItem}
               contentContainerStyle={{ paddingBottom: 100 }}
               showsVerticalScrollIndicator={false}
               refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchNotices();}} />}
               ListEmptyComponent={
                 <Text style={{textAlign:'center', color:'#94a3b8', marginTop: 20}}>No notices found.</Text>
               }
             />
          )}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCompose}>
          <FontAwesome5 name="pen" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Bottom Nav */}
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
            <FontAwesome5 name="users" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Students</Text>
          </TouchableOpacity>
        </View>

        {/* Toast Notification */}
        {toast.visible && (
          <Animated.View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: toastAnim }] }]}>
             <FontAwesome5 name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} size={16} color="#fff" />
             <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}

      </SafeAreaView>

      {/* --- COMPOSE MODAL (SLIDE UP) --- */}
      {isComposeOpen && (
        <View style={styles.composeOverlay}>
           <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={closeCompose} />
           
           <Animated.View style={[styles.composePanel, { transform: [{ translateY: composeAnim }] }]}>
              
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>NEW ANNOUNCEMENT</Text>
                <TouchableOpacity onPress={closeCompose} style={{ padding: 4 }}>
                   <FontAwesome5 name="times" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Target Class */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SEND TO</Text>
                <View style={styles.radioRow}>
                   {myClasses.length > 0 ? myClasses.map(opt => (
                      <TouchableOpacity 
                        key={opt} 
                        style={[styles.radioBtn, targetClass === opt && styles.radioBtnActive]}
                        onPress={() => setTargetClass(opt)}
                      >
                        <Text style={[styles.radioText, targetClass === opt && styles.radioTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                   )) : (
                      <Text style={{color:'#94a3b8', fontSize:12}}>No classes available</Text>
                   )}
                </View>
              </View>

              {/* Subject */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SUBJECT</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. School Holiday"
                  placeholderTextColor="#cbd5e1"
                  value={title}
                  onChangeText={setTitle}
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
                style={[styles.sendBtn, creating && {opacity: 0.7}]} 
                onPress={handlePostNotice}
                disabled={creating}
              >
                {creating ? (
                   <ActivityIndicator color="#fff" />
                ) : (
                   <>
                     <FontAwesome5 name="paper-plane" size={14} color="#fff" />
                     <Text style={styles.sendBtnText}>Send Broadcast</Text>
                   </>
                )}
              </TouchableOpacity>

           </Animated.View>
        </View>
      )}

      {/* --- CUSTOM DELETE MODAL --- */}
      <Modal transparent visible={deleteModalVisible} animationType="none" onRequestClose={closeDeleteModal}>
          <View style={styles.modalBackdrop}>
             <Animated.View style={[styles.deleteModalContainer, { opacity: deleteOpacityAnim, transform: [{ scale: deleteScaleAnim }] }]}>
                
                <View style={styles.deleteIconContainer}>
                    <FontAwesome5 name="trash-alt" size={24} color="#ef4444" />
                </View>

                <Text style={styles.deleteModalTitle}>Delete Notice?</Text>
                <Text style={styles.deleteModalSub}>
                    Are you sure you want to remove this notice? This action cannot be undone.
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

const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarHeader: { marginBottom: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'column', gap: 12 },
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  teacherCode: { fontSize: 12, color: '#64748b' },
  classTag: { marginTop: 0, alignSelf: 'flex-start',  backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 62 },
  classTagText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },
  
  /* Menu */
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  
  /* Sidebar Footer */
  sidebarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  /* Header */
  header: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  /* Tabs */
  tabRow: { flexDirection: 'row', marginTop: 12, backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Content */
  contentContainer: { flex: 1, padding: 20 },

  /* Cards */
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardUrgent: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  avatarBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarAdmin: { backgroundColor: '#fee2e2' },
  avatarMe: { backgroundColor: '#eef2ff' },
  senderName: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  targetText: { fontSize: 10, color: '#64748b' },
  dateText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  cardBody: { marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  cardMessage: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  
  /* Card Footer */
  cardFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, flexDirection: 'row', justifyContent: 'flex-end' },
  readStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  /* FAB */
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  /* Compose Modal */
  composeOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'flex-end' },
  composePanel: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  radioRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radioBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  radioBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  radioText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  radioTextActive: { color: '#fff' },

  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  urgentText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },

  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  /* Toast */
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* Modal Styles */
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