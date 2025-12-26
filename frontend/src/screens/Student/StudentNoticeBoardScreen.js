import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  Dimensions,
  UIManager,
  FlatList
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

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

// Mock Data
const NOTICES = [
  {
    id: '1',
    type: 'school', // School/Admin
    priority: 'urgent',
    sender: "Principal's Desk",
    icon: 'school',
    iconColor: '#ef4444',
    bgIcon: '#fef2f2',
    title: 'School Closed Tomorrow',
    message: 'Due to heavy rainfall forecast, the school will remain closed on 29th Nov. Please stay safe indoors.',
    date: '8:30 AM',
  },
  {
    id: '2',
    type: 'class', // Teacher
    priority: 'normal',
    sender: "Mrs. Priya Sharma",
    role: "Class Teacher",
    icon: 'chalkboard-teacher',
    iconColor: '#4f46e5',
    bgIcon: '#eef2ff',
    title: 'Math Quiz Syllabus',
    message: 'Chapter 5 (Arithmetic) and Chapter 6 (Geometry) will be covered in Monday\'s test. Revise formulas on pg 42.',
    date: 'Yesterday',
  },
  {
    id: '3',
    type: 'class',
    priority: 'normal',
    sender: "Mr. Rahul Verma",
    role: "Physics Dept",
    icon: 'flask',
    iconColor: '#f97316',
    bgIcon: '#fff7ed',
    title: 'Practical Record Submission',
    message: 'Reminder to submit your Physics practical records by this Friday. Late submissions will lose 2 marks.',
    date: '2 Days Ago',
  }
];

export default function StudentNoticeBoardScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student Info (Mock)
  const [studentName, setStudentName] = useState("Arjun");
  const [className, setClassName] = useState("Class 9-A");

  // Filter State
  const [activeFilter, setActiveFilter] = useState('All');

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    setIsSidebarOpen(!isOpen);

    Animated.parallel([
      Animated.timing(slideAnim, { 
        toValue: isOpen ? -SIDEBAR_WIDTH : 0, 
        duration: 300, 
        useNativeDriver: true 
      }),
      Animated.timing(overlayAnim, { 
        toValue: isOpen ? 0 : 0.5, 
        duration: 300, 
        useNativeDriver: true 
      }),
    ]).start();
  };

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      // navigation.replace("Login", { skipAnimation: true });
      console.log("Logged out");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // Filter Logic
  const filteredNotices = NOTICES.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'School') return item.type === 'school';
    if (activeFilter === 'Class') return item.type === 'class';
    return true;
  });

  const renderNoticeItem = ({ item }) => {
    const isUrgent = item.priority === 'urgent';
    
    return (
      <View style={[styles.card, isUrgent && styles.cardUrgent]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={[styles.iconBox, { backgroundColor: item.bgIcon, borderColor: isUrgent ? '#fee2e2' : '#f1f5f9' }]}>
              <FontAwesome5 name={item.icon} size={12} color={item.iconColor} />
            </View>
            <View>
              <Text style={[styles.senderRole, isUrgent && { color: '#7f1d1d' }]}>
                {item.type === 'school' ? item.sender : item.role}
              </Text>
              <Text style={styles.senderName}>
                {item.type === 'school' ? (
                  <Text style={[styles.urgentBadge, { color: '#ef4444' }]}>Urgent</Text>
                ) : (
                  item.sender
                )}
              </Text>
            </View>
          </View>
          <Text style={[styles.dateText, isUrgent && { color: '#ef4444' }]}>{item.date}</Text>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, isUrgent && { color: '#991b1b' }]}>{item.title}</Text>
          <Text style={[styles.cardMessage, isUrgent && { color: '#b91c1c' }]}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View
        style={[
          styles.overlay, 
          { 
            opacity: overlayAnim,
            transform: [{ translateX: isSidebarOpen ? 0 : -width }] 
          }
        ]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.sidebarSafeArea}>
            <View style={styles.sidebarContainer}>
                {/* Top Section (Header + Menu) */}
                <View style={styles.sidebarContentWrapper}>
                    <View style={styles.sidebarHeader}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>AK</Text>
                        </View>
                        <View>
                            <Text style={styles.sidebarName}>{studentName}</Text>
                            <Text style={styles.sidebarClass}>{className}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.menuScroll} contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                        <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
                        <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')} />
                        <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')} />
                        
                        {/* <View style={styles.menuDivider} />
                        <Text style={styles.menuSectionLabel}>ACADEMICS</Text> */}
                        
                        <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')}/>
                        <SidebarItem icon="microphone" label="Daily Audio" onPress={() => handleNav('AudioRecorder')} />
                        <SidebarItem icon="bullhorn" label="Notice" active onPress={() => toggleSidebar()} />
                        
                        <View style={styles.menuDivider} />
                        <SidebarItem icon="question-circle" label="Help & Support" />
                    </ScrollView>
                </View>

                {/* Bottom Footer */}
                <View style={styles.sidebarFooter}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Announcements</Text>
            </View>
            {/* <View style={styles.bellContainer}>
              <FontAwesome5 name="bell" size={20} color="#fff" />
              <View style={styles.dot} />
            </View> */}
          </View>

          {/* Filters */}
          <View style={styles.tabContainer}>
            {['All', 'School', 'Class'].map(tab => (
              <TouchableOpacity 
                key={tab}
                style={[styles.tabBtn, activeFilter === tab && styles.tabBtnActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.tabText, activeFilter === tab && styles.tabTextActive]}>{tab}</Text>
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

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('StudentDash')}
          >
            <FontAwesome5 name="home" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('StudentProfile')}
          >
            <FontAwesome5 name="user" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <View style={{ width: 30, alignItems: 'center' }}>
        <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} />
    </View>
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 101, elevation: 20, shadowColor: "#000", shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  sidebarSafeArea: { flex: 1, backgroundColor: '#fff' },
  sidebarContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarContentWrapper: { flex: 1 }, 
  
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  avatarTextLarge: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  sidebarName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sidebarClass: { fontSize: 12, color: '#64748b' },
  
  menuScroll: { marginTop: 10 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, marginBottom: 2 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 8 },
  
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },

  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  bellContainer: { position: 'relative' },
  dot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#fff' },

  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Content */
  contentContainer: { flex: 1, padding: 20 },

  /* Notices */
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.02, shadowRadius:4, elevation:1 },
  cardUrgent: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444', borderColor: '#fee2e2' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  senderRole: { fontSize: 10, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase' },
  senderName: { fontSize: 11, color: '#64748b' },
  urgentBadge: { color: '#ef4444', fontWeight: 'bold', fontSize: 10 },
  dateText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },

  cardBody: { marginTop: 4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  cardMessage: { fontSize: 12, color: '#64748b', lineHeight: 18 },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});