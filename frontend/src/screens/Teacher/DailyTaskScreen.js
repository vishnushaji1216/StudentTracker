import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
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
const { height } = Platform.OS === 'ios' ? require('react-native').Dimensions.get('window') : { height: 800 };

// Mock Data
const TASKS = [
  { 
    id: '1', 
    type: 'audio', 
    title: 'Recite Poem 4', 
    class: 'Class 9-A • English', 
    status: 'Active', 
    progress: '18/42 Submitted', 
    percent: '42%',
    icon: 'microphone',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#4f46e5'
  },
  { 
    id: '2', 
    type: 'homework', 
    title: 'Solve Exercise 5.2', 
    class: 'Class 10-B • Physics', 
    status: 'Due 5 PM', 
    pending: '+35',
    icon: 'pen-fancy',
    color: '#f97316',
    bg: '#fff7ed',
    border: '#f97316'
  },
  { 
    id: '3', 
    type: 'quiz', 
    title: 'Weekly Quiz', 
    class: 'Class 9-A • Math', 
    status: 'Scheduled', 
    icon: 'list-check',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#cbd5e1'
  }
];

const DATES = [
  { day: 'Mon', num: '26', active: false },
  { day: 'Tue', num: '27', active: true },
  { day: 'Wed', num: '28', active: false },
  { day: 'Thu', num: '29', active: false },
  { day: 'Fri', num: '30', active: false },
];

export default function DailyTaskScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createPanelAnim = useRef(new Animated.Value(height)).current;
  
  // Form State
  const [taskType, setTaskType] = useState('audio'); // audio, homework
  const [selectedClass, setSelectedClass] = useState('Class 9-A');
  const [taskTitle, setTaskTitle] = useState('');

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isCreateOpen) {
        closeCreatePanel();
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
  }, [isSidebarOpen, isCreateOpen]);

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

  const openCreatePanel = () => {
    setIsCreateOpen(true);
    Animated.spring(createPanelAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90
    }).start();
  };

  const closeCreatePanel = () => {
    Animated.timing(createPanelAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true
    }).start(() => setIsCreateOpen(false));
  };

  const handleAssign = () => {
    Alert.alert("Success", `${taskType === 'audio' ? 'Audio' : 'Homework'} task assigned to ${selectedClass}!`);
    closeCreatePanel();
    setTaskTitle('');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const renderTaskCard = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: item.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
            <FontAwesome5 name={item.icon} size={14} color={item.color} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.class}</Text>
          </View>
        </View>
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge, 
          item.status === 'Active' ? styles.statusActive : 
          item.status === 'Scheduled' ? styles.statusScheduled : styles.statusDue
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Active' ? { color: '#16a34a' } : 
            item.status === 'Scheduled' ? { color: '#64748b' } : { color: '#64748b' }
          ]}>{item.status}</Text>
        </View>
      </View>

      {/* Conditional Content based on Type */}
      {item.type === 'audio' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>{item.progress}</Text>
            <Text style={styles.progressText}>{item.percent}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: item.percent, backgroundColor: item.color }]} />
          </View>
        </View>
      )}

      {item.type === 'homework' && (
        <View style={styles.avatarsRow}>
          <View style={styles.avatarGroup}>
            <View style={[styles.miniAvatar, { backgroundColor: '#e2e8f0' }]} />
            <View style={[styles.miniAvatar, { backgroundColor: '#cbd5e1', marginLeft: -8 }]} />
            <View style={[styles.miniAvatarCounter, { marginLeft: -8 }]}>
              <Text style={styles.miniAvatarText}>{item.pending}</Text>
            </View>
          </View>
          <Text style={styles.pendingLabel}>students pending</Text>
        </View>
      )}
    </View>
  );

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
                active={true}
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
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Daily Planner</Text>
            </View>
            {/* <TouchableOpacity style={styles.calendarIconBtn}>
                <FontAwesome5 name="calendar-alt" size={16} color="#4f46e5" />
            </TouchableOpacity> */}
          </View>

          {/* Date Strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {DATES.map((date, index) => (
                <TouchableOpacity 
                    key={index} 
                    style={[styles.dateItem, date.active && styles.dateItemActive]}
                >
                    <Text style={[styles.dateDay, date.active && styles.textWhite]}>{date.day}</Text>
                    <Text style={[styles.dateNum, date.active && styles.textWhite]}>{date.num}</Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.contentContainer}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
             <Text style={styles.sectionTitle}>ASSIGNED FOR TODAY</Text>
             <Text style={styles.taskCount}>3 Tasks</Text>
          </View>

          <FlatList
            data={TASKS}
            keyExtractor={item => item.id}
            renderItem={renderTaskCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* FAB (Create Task) */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCreatePanel}>
          <FontAwesome5 name="plus" size={20} color="#fff" />
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

      {/* --- CREATE TASK MODAL (SLIDE UP) --- */}
      {isCreateOpen && (
        <View style={styles.createOverlay}>
           <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={closeCreatePanel} />
           
           <Animated.View style={[styles.createPanel, { transform: [{ translateY: createPanelAnim }] }]}>
              
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>ASSIGN NEW TASK</Text>
                <TouchableOpacity onPress={closeCreatePanel}>
                   <FontAwesome5 name="times" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Task Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TASK TYPE</Text>
                <View style={styles.typeRow}>
                   <TouchableOpacity 
                      style={[styles.typeBtn, taskType === 'audio' && styles.typeBtnActive]}
                      onPress={() => setTaskType('audio')}
                   >
                      <FontAwesome5 name="microphone" size={14} color={taskType === 'audio' ? '#fff' : '#64748b'} />
                      <Text style={[styles.typeText, taskType === 'audio' && styles.textWhite]}>Audio</Text>
                   </TouchableOpacity>

                   <TouchableOpacity 
                      style={[styles.typeBtn, taskType === 'homework' && styles.typeBtnActive]}
                      onPress={() => setTaskType('homework')}
                   >
                      <FontAwesome5 name="pen-fancy" size={14} color={taskType === 'homework' ? '#fff' : '#64748b'} />
                      <Text style={[styles.typeText, taskType === 'homework' && styles.textWhite]}>Homework</Text>
                   </TouchableOpacity>
                </View>
              </View>

              {/* Class Select */}
              <View style={styles.inputGroup}>
                 <Text style={styles.label}>ASSIGN TO</Text>
                 <View style={styles.dropdown}>
                    <Text style={styles.dropdownText}>{selectedClass}</Text>
                    <FontAwesome5 name="chevron-down" size={12} color="#64748b" />
                 </View>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                 <Text style={styles.label}>TITLE / DESCRIPTION</Text>
                 <TextInput 
                    style={styles.input}
                    placeholder={taskType === 'audio' ? "e.g. Recite Poem 5" : "e.g. Solve pg 42"}
                    placeholderTextColor="#cbd5e1"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                 />
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                 <FontAwesome5 name="info-circle" size={12} color="#ca8a04" />
                 <Text style={styles.infoText}>
                    Quizzes are assigned automatically via the Quiz Manager.
                 </Text>
              </View>

              <TouchableOpacity style={styles.assignBtn} onPress={handleAssign}>
                 <Text style={styles.assignBtnText}>Assign Task</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  calendarIconBtn: { backgroundColor: '#eef2ff', padding: 8, borderRadius: 8 },
  
  /* Date Strip */
  dateItem: { width: 50, height: 64, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dateItemActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  dateDay: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' },
  dateNum: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
  textWhite: { color: '#fff' },

  /* Content */
  contentContainer: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  taskCount: { fontSize: 10, color: '#94a3b8' },

  /* Card */
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { fontSize: 10, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusActive: { backgroundColor: '#f0fdf4' },
  statusScheduled: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  statusDue: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 9, fontWeight: 'bold' },

  /* Progress */
  progressContainer: { marginTop: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },

  /* Avatars */
  avatarsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  avatarGroup: { flexDirection: 'row' },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  miniAvatarCounter: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#64748b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  miniAvatarText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  pendingLabel: { fontSize: 10, color: '#94a3b8' },

  /* FAB */
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  /* Create Modal */
  createOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'flex-end' },
  createPanel: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  typeBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  typeText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  textWhite: { color: '#fff' },
  
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12 },
  dropdownText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#fefce8', padding: 12, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 11, color: '#ca8a04', flex: 1, lineHeight: 16 },
  
  assignBtn: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});