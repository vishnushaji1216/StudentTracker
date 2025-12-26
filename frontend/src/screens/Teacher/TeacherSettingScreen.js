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
  Switch,
  TextInput,
  LayoutAnimation,
  UIManager,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SIDEBAR_WIDTH = 280;

export default function TeacherSettingScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Settings State
  const [isNotifications, setIsNotifications] = useState(true);
  
  // Password Change State
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

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

  const togglePasswordSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPasswordExpanded(!isPasswordExpanded);
  };

  const handleUpdatePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    // API Call logic here
    Alert.alert("Success", "Password updated successfully!");
    setIsPasswordExpanded(false);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Feature to update phone/photo coming soon.");
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
              <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.contentPadding}>
            
            {/* 1. Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.largeAvatar} />
                <TouchableOpacity style={styles.editIcon} onPress={handleEditProfile}>
                  <FontAwesome5 name="camera" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.profileNameLarge}>Priya Sharma</Text>
              <Text style={styles.profileRole}>Senior Math Teacher</Text>
              
              <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Account Settings */}
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.settingGroup}>
              
              <View style={styles.settingItemBorder}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                    <FontAwesome5 name="phone-alt" size={14} color="#2563eb" />
                  </View>
                  <Text style={styles.settingLabel}>Phone Number</Text>
                </View>
                <Text style={styles.settingValue}>98765 43210</Text>
              </View>

              {/* Expandable Password Section */}
              <View style={styles.passwordContainer}>
                <TouchableOpacity style={styles.settingItem} onPress={togglePasswordSection} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                      <FontAwesome5 name="lock" size={14} color="#ea580c" />
                    </View>
                    <Text style={styles.settingLabel}>Change Password</Text>
                  </View>
                  <FontAwesome5 
                    name={isPasswordExpanded ? "chevron-up" : "chevron-right"} 
                    size={12} 
                    color="#cbd5e1" 
                  />
                </TouchableOpacity>

                {/* Inline Form */}
                {isPasswordExpanded && (
                  <View style={styles.passwordForm}>
                    <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                    <TextInput 
                      style={styles.input} 
                      secureTextEntry 
                      placeholder="Enter current password"
                      value={currentPass}
                      onChangeText={setCurrentPass}
                    />

                    <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                    <TextInput 
                      style={styles.input} 
                      secureTextEntry 
                      placeholder="Enter new password"
                      value={newPass}
                      onChangeText={setNewPass}
                    />

                    <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                    <TextInput 
                      style={styles.input} 
                      secureTextEntry 
                      placeholder="Retype new password"
                      value={confirmPass}
                      onChangeText={setConfirmPass}
                    />

                    <TouchableOpacity style={styles.updateBtn} onPress={handleUpdatePassword}>
                      <Text style={styles.updateBtnText}>Update Password</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </View>

            {/* 3. Preferences (Dark Mode Removed) */}
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <View style={styles.settingGroup}>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#faf5ff' }]}>
                    <FontAwesome5 name="bell" size={14} color="#9333ea" />
                  </View>
                  <Text style={styles.settingLabel}>Notifications</Text>
                </View>
                <Switch
                  trackColor={{ false: "#e2e8f0", true: "#4f46e5" }}
                  thumbColor={"#fff"}
                  ios_backgroundColor="#e2e8f0"
                  onValueChange={setIsNotifications}
                  value={isNotifications}
                />
              </View>

            </View>

            {/* 4. Support */}
            <Text style={styles.sectionTitle}>SUPPORT</Text>
            <View style={styles.settingGroup}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                    <FontAwesome5 name="question-circle" size={14} color="#dc2626" />
                  </View>
                  <Text style={styles.settingLabel}>Help & FAQ</Text>
                </View>
                <FontAwesome5 name="external-link-alt" size={12} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Stella App v5.0.0</Text>

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Profile Card */
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  avatarRow: { position: 'relative', marginBottom: 12 },
  largeAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#f1f5f9' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4f46e5', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileNameLarge: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  profileRole: { fontSize: 12, color: '#64748b', marginTop: 2 },
  editProfileBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#eef2ff', borderRadius: 20 },
  editProfileText: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },

  /* Sections */
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  settingGroup: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, overflow: 'hidden' },
  
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingItemBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  settingValue: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  /* Password Form */
  passwordContainer: { overflow: 'hidden' },
  passwordForm: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  updateBtn: { marginTop: 16, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* Logout */
  signOutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  signOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  versionText: { textAlign: 'center', fontSize: 10, color: '#94a3b8' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});