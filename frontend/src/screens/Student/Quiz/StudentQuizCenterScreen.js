import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
const ACTIVE_QUIZZES = [
  {
    id: '1',
    title: 'Weekly Math Test',
    subject: 'Math',
    topic: 'Ch 5 Arithmetic',
    duration: '30 Mins',
    status: 'LIVE',
    timeLeft: 'Ends in 45m',
    progress: 0.6,
    initials: 'MA',
    color: '#4f46e5',
    bg: '#eef2ff'
  },
  {
    id: '2',
    title: 'Physics Pop Quiz',
    subject: 'Physics',
    topic: 'Optics',
    duration: '15 Mins',
    status: 'SCHEDULED',
    startTime: 'Tomorrow, 10:00 AM',
    initials: 'PH',
    color: '#ea580c',
    bg: '#fff7ed'
  }
];

const COMPLETED_QUIZZES = [
  {
    id: '101',
    title: 'History Ch 4',
    subject: 'History',
    date: 'Yesterday',
    score: '18/20',
    percent: '90%',
    initials: 'HI',
    color: '#64748b',
    bg: '#f1f5f9'
  },
  {
    id: '102',
    title: 'Science Unit 2',
    subject: 'Science',
    date: '2 Days ago',
    score: '4/10',
    percent: '40%',
    initials: 'SC',
    color: '#0284c7',
    bg: '#f0f9ff'
  }
];

export default function StudentQuizCenterScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student Info (Mock)
  const [studentName, setStudentName] = useState("Arjun");
  const [className, setClassName] = useState("Class 9-A");

  // Tab State
  const [activeTab, setActiveTab] = useState('Active');

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.navigate('StudentDash');
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      // navigation.replace("Login", { skipAnimation: true });
      console.log("Logged out");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  // Render Item for Active Tab
  const renderActiveItem = ({ item }) => (
    <View style={[styles.card, item.status === 'LIVE' ? styles.cardLive : styles.cardScheduled]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
            <Text style={[styles.iconText, { color: item.color }]}>{item.initials}</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.topic} • {item.duration}</Text>
          </View>
        </View>
        
        {item.status === 'LIVE' ? (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.schedBadge}>
            <Text style={styles.schedText}>Scheduled</Text>
          </View>
        )}
      </View>

      {item.status === 'LIVE' ? (
        <View>
          <View style={styles.footerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <FontAwesome5 name="clock" size={10} color="#ef4444" />
              <Text style={styles.timerText}>{item.timeLeft}</Text>
            </View>
            <TouchableOpacity 
              style={styles.startBtn}
              onPress={() => navigation.navigate('QuizInstruction')}
            >
              <Text style={styles.startBtnText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.scheduledInfo}>
          <FontAwesome5 name="calendar-alt" size={10} color="#f97316" />
          <Text style={styles.schedInfoText}>Starts {item.startTime}</Text>
        </View>
      )}
    </View>
  );

  // Render Item for Completed Tab
  const renderCompletedItem = ({ item }) => (
    <TouchableOpacity style={styles.historyCard} activeOpacity={0.7} onPress={() => navigation.navigate('StudentQuizResult')}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
          <Text style={[styles.iconText, { color: item.color }]}>{item.initials}</Text>
        </View>
        <View>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historySub}>Submitted {item.date}</Text>
        </View>
      </View>
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{item.score}</Text>
      </View>
    </TouchableOpacity>
  );

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
                        
                        <SidebarItem icon="list-ol" label="Quiz Center" active onPress={() => toggleSidebar()}/>
                        <SidebarItem icon="microphone" label="Daily Audio" onPress={() => handleNav('AudioRecord')} />
                        <SidebarItem icon="bullhorn" label="Notice" onPress={() => handleNav('StudentNoticBoard')} />
                        
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
              <Text style={styles.headerTitle}>Quiz Center</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'Active' && styles.tabBtnActive]}
              onPress={() => setActiveTab('Active')}
            >
              <Text style={[styles.tabText, activeTab === 'Active' && styles.tabTextActive]}>Active (2)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'Completed' && styles.tabBtnActive]}
              onPress={() => setActiveTab('Completed')}
            >
              <Text style={[styles.tabText, activeTab === 'Completed' && styles.tabTextActive]}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {activeTab === 'Active' && (
            <View>
              <Text style={styles.sectionTitle}>LIVE NOW</Text>
              <FlatList
                data={ACTIVE_QUIZZES}
                keyExtractor={item => item.id}
                renderItem={renderActiveItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {activeTab === 'Completed' && (
            <View>
              <Text style={styles.sectionTitle}>PAST RESULTS</Text>
              <FlatList
                data={COMPLETED_QUIZZES}
                keyExtractor={item => item.id}
                renderItem={renderCompletedItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
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
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  
  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Content */
  contentContainer: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },

  /* Active Card */
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLive: { borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  cardScheduled: { borderLeftWidth: 4, borderLeftColor: '#ea580c', opacity: 0.9 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 12, fontWeight: 'bold' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { fontSize: 11, color: '#64748b' },
  
  liveBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#dcfce7' },
  liveText: { fontSize: 9, fontWeight: 'bold', color: '#16a34a' },
  schedBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5' },
  schedText: { fontSize: 9, fontWeight: 'bold', color: '#ea580c' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  timerText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  startBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, shadowColor: '#4f46e5', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  startBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  scheduledInfo: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', padding: 8, borderRadius: 8 },
  schedInfoText: { fontSize: 10, fontWeight: 'bold', color: '#c2410c' },

  /* History Card */
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', opacity: 0.8 },
  historyTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  historySub: { fontSize: 10, color: '#94a3b8' },
  scoreBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreText: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});