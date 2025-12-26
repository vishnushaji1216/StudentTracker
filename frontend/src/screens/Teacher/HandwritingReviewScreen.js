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
  TextInput
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
const { width, height } = Dimensions.get('window');

// Mock Data
const STUDENTS_QUEUE = [
  { id: '1', name: 'Arjun Kumar', roll: '24', initials: 'AK', color: '#4f46e5', bg: '#eef2ff', status: 'pending' },
  { id: '2', name: 'Diya Singh', roll: '25', initials: 'DS', color: '#64748b', bg: '#f1f5f9', status: 'pending' },
  { id: '3', name: 'Karan Vohra', roll: '26', initials: 'KV', color: '#16a34a', bg: '#f0fdf4', status: 'logged', rating: 4 },
  { id: '4', name: 'Rahul Singh', roll: '03', initials: 'RS', color: '#64748b', bg: '#f1f5f9', status: 'pending' },
  { id: '5', name: 'Fatima Z.', roll: '27', initials: 'FZ', color: '#64748b', bg: '#f1f5f9', status: 'pending' },
];

const FEEDBACK_TAGS = ["Neat Work", "Improve Spacing", "Incomplete", "Check Spelling"];

export default function HandwritingReviewScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Screen State
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedStudentId, setSelectedStudentId] = useState('1'); // For the top ribbon

  // Capture Modal State
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureStage, setCaptureStage] = useState('camera'); // 'camera' or 'grading'
  const [currentStudent, setCurrentStudent] = useState(null);
  
  // Grading Form State
  const [selectedTags, setSelectedTags] = useState(['Neat Work']);
  const [rating, setRating] = useState(0);

  // Animation for Grading Panel
  const panelAnim = useRef(new Animated.Value(height)).current;

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isCaptureOpen) {
        // If in grading stage, go back to camera
        if (captureStage === 'grading') {
          resetCapture();
          return true;
        }
        // If in camera, close modal
        closeCapture();
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
  }, [isSidebarOpen, isCaptureOpen, captureStage]);

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // --- CAPTURE LOGIC ---
  const openCapture = (student) => {
    setCurrentStudent(student);
    setCaptureStage('camera');
    setIsCaptureOpen(true);
  };

  const takePhoto = () => {
    // Simulate Capture
    setCaptureStage('grading');
    // Animate panel up
    Animated.spring(panelAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90
    }).start();
  };

  const resetCapture = () => {
    // Animate panel down first
    Animated.timing(panelAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setCaptureStage('camera');
    });
  };

  const closeCapture = () => {
    setIsCaptureOpen(false);
    setCaptureStage('camera');
    panelAnim.setValue(height); // Reset position
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter List
  const filteredList = STUDENTS_QUEUE.filter(item => 
    activeTab === 'pending' ? item.status === 'pending' : item.status === 'logged'
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
                active={true}
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
              <View>
                <Text style={styles.headerTitle}>Handwriting Queue</Text>
                <Text style={styles.headerSub}>CLASS 9-A • WEEK 42</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending (38)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'logged' && styles.tabBtnActive]}
              onPress={() => setActiveTab('logged')}
            >
              <Text style={[styles.tabText, activeTab === 'logged' && styles.tabTextActive]}>Logged (4)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentPadding}>
            
            {/* Student Ribbon (Horizontal Scroll) */}
            <Text style={styles.sectionLabel}>QUICK SELECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ribbonScroll}>
              {STUDENTS_QUEUE.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.ribbonItem, selectedStudentId === item.id && styles.ribbonItemActive]}
                  onPress={() => setSelectedStudentId(item.id)}
                >
                  <View style={[styles.ribbonAvatar, { backgroundColor: item.bg }, selectedStudentId === item.id && styles.ribbonAvatarActive]}>
                    <Text style={[styles.ribbonText, { color: item.color }]}>{item.initials}</Text>
                  </View>
                  <Text style={[styles.ribbonName, selectedStudentId === item.id && styles.ribbonNameActive]}>
                    {item.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.ribbonItem}>
                <View style={[styles.ribbonAvatar, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={[styles.ribbonText, { color: '#94a3b8' }]}>+38</Text>
                </View>
                <Text style={styles.ribbonName}>More</Text>
              </View>
            </ScrollView>

            <View style={{ height: 20 }} />

            {/* List */}
            {filteredList.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.card, item.status === 'logged' && styles.cardLogged]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.avatarBox, { backgroundColor: item.bg, borderColor: item.status === 'logged' ? '#bbf7d0' : 'transparent', borderWidth: item.status === 'logged' ? 1 : 0 }]}>
                    <Text style={[styles.avatarText, { color: item.status === 'logged' ? '#16a34a' : item.color }]}>{item.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.status === 'logged' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <FontAwesome5 name="star" size={10} color="#fbbf24" solid />
                        <Text style={styles.cardStatusGreen}>Good Job</Text>
                      </View>
                    ) : (
                      <Text style={styles.cardStatus}>Roll {item.roll} • Not Logged</Text>
                    )}
                  </View>
                </View>

                {item.status === 'pending' ? (
                  <TouchableOpacity 
                    style={styles.cameraBtn}
                    onPress={() => openCapture(item)}
                  >
                    <FontAwesome5 name="camera" size={14} color="#64748b" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.editBtn}>
                    <FontAwesome5 name="pen" size={12} color="#16a34a" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
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
          <TouchableOpacity style={styles.navItem} >
            <FontAwesome5 name="pen-fancy" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Review</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* ================================================== */}
      {/* CAPTURE & GRADE MODAL */}
      {/* ================================================== */}
      {isCaptureOpen && (
        <View style={styles.captureModal}>
          <StatusBar hidden={true} />
          
          {/* 1. IMAGE BACKGROUND */}
          <View style={styles.cameraPreview}>
            <Image 
              source={{ uri: "https://placehold.co/400x800/1e293b/475569?text=Camera+Preview" }} 
              style={[styles.previewImage, captureStage === 'camera' && { opacity: 0.6 }]}
            />
            {captureStage === 'camera' && (
              <View style={styles.viewfinder}>
                <View style={styles.viewfinderBox} />
                <Text style={styles.alignText}>ALIGN PAGE HERE</Text>
              </View>
            )}
          </View>

          {/* 2. HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={closeCapture} style={styles.closeBtn}>
                <FontAwesome5 name="arrow-left" size={16} color="#fff" />
              </TouchableOpacity>
              <View>
                <Text style={styles.modalName}>{currentStudent?.name}</Text>
                <Text style={styles.modalRoll}>Roll No. {currentStudent?.roll}</Text>
              </View>
            </View>
            
            {captureStage === 'grading' && (
              <TouchableOpacity style={styles.retakeBtn} onPress={resetCapture}>
                <FontAwesome5 name="sync-alt" size={12} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. SHUTTER BUTTON (Camera Mode) */}
          {captureStage === 'camera' && (
            <View style={styles.shutterContainer}>
              <TouchableOpacity onPress={takePhoto} style={styles.shutterOuter}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          )}

          {/* 4. GRADING PANEL (Grading Mode) */}
          <Animated.View 
            style={[
              styles.gradingPanel, 
              { transform: [{ translateY: panelAnim }] }
            ]}
          >
            <View style={styles.dragHandle} />

            <View style={styles.ratingRow}>
              <Text style={styles.panelLabel}>QUALITY RATING</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <FontAwesome5 
                      name="star" 
                      solid={star <= rating} 
                      size={24} 
                      color={star <= rating ? "#fbbf24" : "#e2e8f0"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={styles.panelLabel}>FEEDBACK TAGS</Text>
              <View style={styles.tagRow}>
                {FEEDBACK_TAGS.map((tag) => (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, selectedTags.includes(tag) && { color: '#4f46e5', fontWeight: 'bold' }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.commentBox}>
              <FontAwesome5 name="pen" size={14} color="#94a3b8" />
              <TextInput 
                placeholder="Add a specific note..."
                placeholderTextColor="#94a3b8"
                style={styles.commentInput}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.redoBtn} onPress={closeCapture}>
                <FontAwesome5 name="redo" size={14} color="#ef4444" style={{ marginRight: 8 }} />
                <Text style={styles.redoBtnText}>Redo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={closeCapture}>
                <FontAwesome5 name="check" size={14} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.approveBtnText}>Approve & Next</Text>
              </TouchableOpacity>
            </View>

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
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  menuButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },

  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Ribbon */
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 },
  ribbonScroll: { marginBottom: 20 },
  ribbonItem: { alignItems: 'center', marginRight: 16, opacity: 0.6, transform: [{ scale: 0.9 }] },
  ribbonItemActive: { opacity: 1, transform: [{ scale: 1 }] },
  ribbonAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 2, borderColor: 'transparent' },
  ribbonAvatarActive: { borderColor: '#4f46e5' },
  ribbonText: { fontWeight: 'bold', fontSize: 14 },
  ribbonName: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  ribbonNameActive: { color: '#4f46e5', fontWeight: 'bold' },

  /* List */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  cardLogged: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  cardName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  cardStatus: { fontSize: 11, color: '#94a3b8' },
  cardStatusGreen: { fontSize: 11, color: '#16a34a', fontWeight: 'bold' },
  cameraBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  /* --- MODAL STYLES --- */
  captureModal: { position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 100 },
  cameraPreview: { flex: 1, backgroundColor: '#000', position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  viewfinder: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },
  viewfinderBox: { width: 250, height: 350, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderStyle: 'dashed' },
  alignText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', marginTop: 16, letterSpacing: 1 },
  
  modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalName: { color: '#fff', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:0, height:1}, textShadowRadius: 2 },
  modalRoll: { color: '#cbd5e1', fontSize: 11 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  retakeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  shutterContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  shutterOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  /* Grading Panel */
  gradingPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  tagChipSelected: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  tagText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  commentBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 20 },
  commentInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },
  actionRow: { flexDirection: 'row', gap: 12 },
  redoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2', paddingVertical: 14, borderRadius: 12 },
  redoBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12 },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});