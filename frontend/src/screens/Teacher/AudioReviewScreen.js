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
  Dimensions,
  Easing
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable LayoutAnimation
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;

// Mock Data
const AUDIO_QUEUE = [
  {
    id: '1',
    name: 'Diya Singh',
    initials: 'DS',
    avatarColor: '#f1f5f9',
    textColor: '#64748b',
    title: 'Poem 4',
    duration: '0:45 min',
    status: 'pending'
  },
  {
    id: '2',
    name: 'Arjun Kumar',
    initials: 'AK',
    avatarColor: '#e0e7ff',
    textColor: '#4f46e5',
    title: 'Recitation: The Daffodils',
    duration: '1:30 min',
    status: 'playing', // This one will be expanded by default logic if needed
    isOnline: true
  },
  {
    id: '3',
    name: 'Karan Vohra',
    initials: 'KV',
    avatarColor: '#eff6ff',
    textColor: '#3b82f6',
    title: 'Poem 4',
    duration: '1:10 min',
    status: 'pending'
  }
];

export default function AudioReviewScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Screen State
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedId, setExpandedId] = useState('2'); // Default open Arjun
  const [isPlaying, setIsPlaying] = useState(false); // For waveform animation toggle

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

  const handleCardPress = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === id) {
      setExpandedId(null); // Collapse if already open
      setIsPlaying(false);
    } else {
      setExpandedId(id); // Expand new one
      setIsPlaying(true); // Auto-start "simulation"
    }
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
                active={true}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 16 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Audio Queue</Text>
              <Text style={styles.headerSub}>CLASS 9-A ONLY</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending (12)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentPadding}>
            
            {AUDIO_QUEUE.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                
                {/* --- EXPANDED CARD (ACTIVE PLAYER) --- */}
                {expandedId === item.id ? (
                  <View style={styles.expandedCard}>
                    
                    {/* Header */}
                    <TouchableOpacity style={styles.expandedHeader} onPress={() => handleCardPress(item.id)} activeOpacity={1}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={styles.avatarWrapper}>
                          <View style={[styles.avatarBox, { backgroundColor: item.avatarColor }]}>
                            <Text style={[styles.avatarText, { color: item.textColor }]}>{item.initials}</Text>
                          </View>
                          {item.isOnline && <View style={styles.onlineDot} />}
                        </View>
                        <View>
                          <Text style={styles.studentNameBig}>{item.name}</Text>
                          <Text style={styles.poemTitle}>{item.title}</Text>
                        </View>
                      </View>
                      <View style={styles.playingBadge}>
                        <Text style={styles.playingText}>PLAYING</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Player Controls */}
                    <View style={styles.playerBody}>
                      
                      {/* Simulated Waveform */}
                      <View style={styles.waveformContainer}>
                        {[...Array(15)].map((_, i) => (
                          <WaveBar key={i} index={i} isPlaying={isPlaying} />
                        ))}
                      </View>
                      
                      <View style={styles.timeRow}>
                        <Text style={styles.timeText}>0:24</Text>
                        
                        <View style={styles.controls}>
                          <TouchableOpacity>
                            <FontAwesome5 name="backward" size={14} color="#94a3b8" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.playPauseBtn} onPress={() => setIsPlaying(!isPlaying)}>
                            <FontAwesome5 name={isPlaying ? "pause" : "play"} size={14} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity>
                            <FontAwesome5 name="forward" size={14} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.timeText}>{item.duration.split(' ')[0]}</Text>
                      </View>

                      {/* Feedback Buttons */}
                      <View style={styles.feedbackRow}>
                        <TouchableOpacity style={styles.feedbackBtn}>
                          <FontAwesome5 name="microphone" size={12} color="#4f46e5" />
                          <Text style={styles.feedbackText}>Voice Note</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackBtn}>
                          <FontAwesome5 name="comment-dots" size={12} color="#4f46e5" />
                          <Text style={styles.feedbackText}>Comment</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Decision Buttons */}
                      <View style={styles.decisionRow}>
                        <TouchableOpacity style={styles.redoBtn}>
                          <FontAwesome5 name="redo" size={12} color="#ef4444" />
                          <Text style={styles.redoText}>Request Redo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.verifyBtn}>
                          <FontAwesome5 name="check" size={12} color="#16a34a" />
                          <Text style={styles.verifyText}>Approve</Text>
                        </TouchableOpacity>
                      </View>

                    </View>
                  </View>
                ) : (
                  
                  /* --- COLLAPSED CARD (PENDING) --- */
                  <TouchableOpacity 
                    style={styles.collapsedCard} 
                    onPress={() => handleCardPress(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.avatarBox, { backgroundColor: item.avatarColor }]}>
                        <Text style={[styles.avatarText, { color: item.textColor }]}>{item.initials}</Text>
                      </View>
                      <View>
                        <Text style={styles.studentName}>{item.name}</Text>
                        <Text style={styles.miniDetails}>{item.title} • {item.duration}</Text>
                      </View>
                    </View>
                    <FontAwesome5 name="play" size={14} color="#4f46e5" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

          </View>
        </ScrollView>

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
    </View>
  );
}

/* --- WAVEFORM COMPONENT --- */
const WaveBar = ({ isPlaying, index }) => {
  const heightAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heightAnim, {
            toValue: Math.random() * 20 + 10,
            duration: 200 + index * 10, // Stagger effect
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(heightAnim, {
            toValue: 10,
            duration: 200 + index * 10,
            easing: Easing.linear,
            useNativeDriver: false,
          })
        ])
      ).start();
    } else {
      heightAnim.stopAnimation();
      heightAnim.setValue(10);
    }
  }, [isPlaying]);

  return (
    <Animated.View
      style={{
        width: 3,
        height: heightAnim,
        backgroundColor: isPlaying ? '#4f46e5' : '#c7d2fe',
        borderRadius: 2,
        marginHorizontal: 1.5
      }}
    />
  );
};

/* --- SIDEBAR COMPONENT --- */
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

  /* Header */
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  
  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  cardWrapper: { marginBottom: 16 },

  /* Collapsed Card */
  collapsedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  miniDetails: { fontSize: 11, color: '#94a3b8' },

  /* Expanded Card */
  expandedCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  avatarWrapper: { position: 'relative' },
  avatarBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: '#22c55e', borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  studentNameBig: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  poemTitle: { fontSize: 11, color: '#64748b' },
  playingBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  playingText: { fontSize: 9, fontWeight: 'bold', color: '#4f46e5' },
  
  /* Player Area */
  playerBody: { padding: 16, backgroundColor: '#f8fafc' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 8 },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  playPauseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  
  /* Feedback */
  feedbackRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  feedbackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 10, borderRadius: 12 },
  feedbackText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  
  /* Decision */
  decisionRow: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  redoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2', paddingVertical: 12, borderRadius: 12 },
  redoText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  verifyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7', paddingVertical: 12, borderRadius: 12 },
  verifyText: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },

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

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});