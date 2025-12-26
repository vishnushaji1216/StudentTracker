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
const { height } = Dimensions.get('window');
import { Dimensions } from "react-native";

// Mock Data
const NOTICES = [
  { 
    id: '1', 
    sender: 'Admin', 
    title: 'School Closed Tomorrow', 
    message: 'Due to heavy rainfall forecast, the school will remain closed on 29th Nov. Online classes will resume as scheduled.', 
    date: 'Today, 8:30 AM', 
    priority: 'Urgent',
    target: 'All Staff & Students'
  },
  { 
    id: '2', 
    sender: 'Me', 
    title: 'Math Quiz Syllabus', 
    message: 'Chapter 5 and 6 will be covered in the upcoming Monday test. Please revise thoroughly.', 
    date: 'Yesterday', 
    priority: 'Normal',
    target: 'Class 9-A',
    readCount: '40/42'
  },
  { 
    id: '3', 
    sender: 'Admin', 
    title: 'Staff Meeting Rescheduled', 
    message: 'The monthly staff meeting is moved to Friday, 4 PM. Please bring your updated registers.', 
    date: '2 days ago', 
    priority: 'Normal',
    target: 'Teachers Only'
  },
  { 
    id: '4', 
    sender: 'Me', 
    title: 'Bring Geometry Box', 
    message: 'Do not forget your geometry instruments for tomorrow\'s practical.', 
    date: '3 days ago', 
    priority: 'Normal',
    target: 'Class 10-B',
    readCount: '35/38'
  },
];

export default function NoticeBoardScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Screen State
  const [activeTab, setActiveTab] = useState('All'); // All, Admin, Sent
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  // Compose Form State
  const [targetClass, setTargetClass] = useState('Class 9-A');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Compose Panel Animation
  const composeAnim = useRef(new Animated.Value(height)).current;

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
    Animated.spring(composeAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90
    }).start();
  };

  const closeCompose = () => {
    Animated.timing(composeAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setIsComposeOpen(false);
    });
  };

  const handleSend = () => {
    if (!subject || !message) {
      Alert.alert("Missing Info", "Please add a subject and message.");
      return;
    }
    Alert.alert("Sent", `Broadcast sent to ${targetClass}!`);
    setSubject("");
    setMessage("");
    setIsUrgent(false);
    closeCompose();
    setActiveTab('Sent'); // Switch to sent tab to see it (simulated)
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // Filter Logic
  const filteredNotices = NOTICES.filter(item => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Admin') return item.sender === 'Admin';
    if (activeTab === 'Sent') return item.sender === 'Me';
    return true;
  });

  const renderNoticeItem = ({ item }) => {
    const isAdmin = item.sender === 'Admin';
    const isUrgent = item.priority === 'Urgent';

    return (
      <View style={[styles.card, isUrgent && styles.cardUrgent]}>
        {/* Header: Sender & Date */}
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
              <Text style={styles.senderName}>{isAdmin ? "School Admin" : "You"}</Text>
              <Text style={styles.targetText}>To: {item.target}</Text>
            </View>
          </View>
          <Text style={[styles.dateText, isUrgent && { color: '#ef4444' }]}>{item.date}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, isUrgent && { color: '#b91c1c' }]}>
            {isUrgent && <FontAwesome5 name="exclamation-circle" size={12} color="#ef4444" style={{marginRight: 6}} />} 
            {item.title}
          </Text>
          <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
        </View>

        {/* Footer (Actions/Stats) */}
        {!isAdmin && (
           <View style={styles.cardFooter}>
             <View style={styles.readStatus}>
               <FontAwesome5 name="check-double" size={10} color="#16a34a" />
               <Text style={styles.readText}>{item.readCount} Read</Text>
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
                active={true}
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

        <View style={styles.contentContainer}>
          <FlatList
            data={filteredNotices}
            keyExtractor={item => item.id}
            renderItem={renderNoticeItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Floating Action Button (Compose) */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCompose}>
          <FontAwesome5 name="pen" size={18} color="#fff" />
        </TouchableOpacity>

        {/* BOTTOM NAV */}
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

      </SafeAreaView>

      {/* --- COMPOSE MODAL (SLIDE UP) --- */}
      {isComposeOpen && (
        <View style={styles.composeOverlay}>
           {/* Dark Backdrop */}
           <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={closeCompose} />
           
           {/* Slide Up Panel */}
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
                   {['Class 9-A', 'Class 10-B', 'Parents'].map(opt => (
                      <TouchableOpacity 
                        key={opt} 
                        style={[styles.radioBtn, targetClass === opt && styles.radioBtnActive]}
                        onPress={() => setTargetClass(opt)}
                      >
                        <Text style={[styles.radioText, targetClass === opt && styles.radioTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                   ))}
                </View>
              </View>

              {/* Subject */}
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
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <FontAwesome5 name="paper-plane" size={14} color="#fff" />
                <Text style={styles.sendBtnText}>Send Broadcast</Text>
              </TouchableOpacity>

           </Animated.View>
        </View>
      )}

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
});