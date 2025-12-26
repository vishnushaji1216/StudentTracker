import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Image,
  BackHandler,
  Platform,
  Linking,
  Dimensions,
  UIManager,
  LayoutAnimation,
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

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

// Mock Data
const MOCK_TEACHERS = [
  { id: '1', name: 'Mrs. Priya Sharma', role: 'Class Teacher', subject: null, color: '#4f46e5', bg: '#eef2ff', phone: '9876543210' },
  { id: '2', name: 'Mr. Rahul Verma', role: 'Subject Teacher', subject: 'Physics', color: '#ea580c', bg: '#fff7ed', phone: '9876543211' }
];

const MOCK_SIBLINGS = [
  { id: '1', name: 'Arjun Kumar', class: 'Class 9-A', initials: 'AK', color: '#4f46e5', bg: '#eef2ff' },
  { id: '2', name: 'Diya Singh', class: 'Class 10-B', initials: 'DS', color: '#64748b', bg: '#f1f5f9' }
];

export default function StudentProfileScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile State
  const [currentStudentId, setCurrentStudentId] = useState('1');

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

  const handleSwitchAccount = (siblingId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStudentId(siblingId);
    // In a real app, this would refresh the user context
  };

  const openWhatsApp = (phone) => {
    let url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  const openDialer = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Get current student data
  const currentStudent = MOCK_SIBLINGS.find(s => s.id === currentStudentId);
  const otherSiblings = MOCK_SIBLINGS.filter(s => s.id !== currentStudentId);

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
                        <View style={styles.logoBox}>
                            <Text style={styles.logoText}>{currentStudent.initials}</Text>
                        </View>
                        <View>
                            <Text style={styles.sidebarTitle}>{currentStudent.name}</Text>
                            <Text style={styles.sidebarVersion}>{currentStudent.class}</Text>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>{currentStudent.initials}</Text>
              </View>
              <Text style={styles.profileName}>{currentStudent.name}</Text>
              <Text style={styles.profileClass}>{currentStudent.class} • Roll No. 24</Text>
            </View>

            {/* 2. Sibling Switcher */}
            <Text style={styles.sectionTitle}>SWITCH ACCOUNT</Text>
            <View style={styles.siblingCard}>
              {/* Current Active */}
              <View style={styles.siblingRowActive}>
                <View style={styles.siblingLeft}>
                  <View style={[styles.miniAvatar, { backgroundColor: '#e0e7ff' }]}>
                    <Text style={[styles.miniAvatarText, { color: '#4f46e5' }]}>{currentStudent.initials}</Text>
                  </View>
                  <Text style={styles.siblingNameActive}>{currentStudent.name} (You)</Text>
                </View>
                <FontAwesome5 name="check-circle" solid size={16} color="#4f46e5" />
              </View>

              {/* Other Siblings */}
              {otherSiblings.map((sibling) => (
                <TouchableOpacity 
                  key={sibling.id} 
                  style={styles.siblingRow}
                  onPress={() => handleSwitchAccount(sibling.id)}
                >
                  <View style={styles.siblingLeft}>
                    <View style={[styles.miniAvatar, { backgroundColor: '#f1f5f9' }]}>
                      <Text style={[styles.miniAvatarText, { color: '#64748b' }]}>{sibling.initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.siblingName}>{sibling.name}</Text>
                      <Text style={styles.siblingClass}>{sibling.class}</Text>
                    </View>
                  </View>
                  <View style={styles.switchBadge}>
                    <Text style={styles.switchText}>Switch</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. My Teachers */}
            <Text style={styles.sectionTitle}>MY TEACHERS</Text>
            <View style={styles.teacherList}>
              {MOCK_TEACHERS.map((teacher) => (
                <View key={teacher.id} style={styles.teacherCard}>
                  <View style={styles.teacherLeft}>
                    <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.teacherImg} />
                    <View>
                      <Text style={styles.teacherNameCard}>{teacher.name}</Text>
                      {teacher.role === 'Class Teacher' ? (
                        <View style={styles.ctBadge}>
                          <Text style={styles.ctText}>CLASS TEACHER</Text>
                        </View>
                      ) : (
                        <Text style={styles.stText}>{teacher.subject}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.contactRow}>
                    <TouchableOpacity 
                      style={[styles.contactBtn, styles.waBtn]}
                      onPress={() => openWhatsApp(teacher.phone)}
                    >
                      <FontAwesome5 name="whatsapp" size={14} color="#16a34a" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.contactBtn, styles.callBtn]}
                      onPress={() => openDialer(teacher.phone)}
                    >
                      <FontAwesome5 name="phone-alt" size={12} color="#4f46e5" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* 4. Logout */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
               <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
               <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Stella App v5.0.0</Text>

          </View>
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('StudentDash')}
          >
            <FontAwesome5 name="home" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="user" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Profile</Text>
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
  logoBox: { width: 40, height: 40, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e7ff', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 14 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Profile Card */
  profileCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 4, borderColor: '#eef2ff' },
  avatarTextLarge: { fontSize: 28, fontWeight: 'bold', color: '#4f46e5' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  profileClass: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  /* Section Title */
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },

  /* Sibling Switcher */
  siblingCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, overflow: 'hidden' },
  siblingRowActive: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#eef2ff', borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  siblingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  siblingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontSize: 12, fontWeight: 'bold' },
  siblingNameActive: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  siblingName: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  siblingClass: { fontSize: 10, color: '#94a3b8' },
  switchBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  switchText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },

  /* Teacher List */
  teacherList: { gap: 12, marginBottom: 24 },
  teacherCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e0e7ff', shadowColor: '#4f46e5', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  teacherLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  teacherNameCard: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  ctBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 2 },
  ctText: { fontSize: 8, fontWeight: 'bold', color: '#4f46e5' },
  stText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  
  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  waBtn: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  callBtn: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },

  /* Logout */
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  signOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  versionText: { textAlign: 'center', fontSize: 10, color: '#94a3b8' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});