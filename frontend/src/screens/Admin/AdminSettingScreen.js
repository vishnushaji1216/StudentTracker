import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Switch,
  Animated,
  BackHandler,
  Platform,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;

export default function SettingsScreen({ navigation }) {
  // State for Toggles
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [academicYear, setAcademicYear] = useState("2025 - 2026");

  // Sidebar Animations
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isSidebarOpen) {
          toggleSidebar();
          return true;
        }
        // If sidebar is closed, go back to Dashboard
        navigation.navigate('AdminDash');
        return true;
      }
    );
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? -SIDEBAR_WIDTH : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 0 : 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
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

  // Mock function for changing things
  const handleChangeCode = () => {
    Alert.alert("Security", "Enter current Master Code to continue.");
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
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <View>
                <Text style={styles.sidebarTitle}>Stella Admin</Text>
                <Text style={styles.sidebarVersion}>v5.0.0</Text>
              </View>
            </View>

            {/* Sidebar Menu Items */}
            <View style={styles.menuSection}>
              <SidebarItem 
                icon="chart-pie" 
                label="Dashboard" 
                onPress={() => { toggleSidebar(); navigation.navigate('AdminDash'); }} 
              />
              <SidebarItem 
                icon="user-plus" 
                label="Add User" 
                onPress={() => { toggleSidebar(); navigation.navigate('AddUser'); }} 
              />
              <SidebarItem 
                icon="list-ul" 
                label="Teacher Registry" 
                onPress={() => { toggleSidebar(); navigation.navigate('TeacherRegistry'); }} 
              />
              <SidebarItem 
                icon="list-ul" 
                label="Student Registry" 
                onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry'); }} 
              />
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar();navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Security" />
            </View>
          </View>

          {/* Sidebar Footer */}
          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn}>
                <FontAwesome5 name="cog" size={16} color="#4f46e5" />
                <Text style={[styles.settingsText, { color: '#4f46e5' }]}>Settings</Text>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 20 }} /> 
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>S</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>Stella Admin</Text>
                <Text style={styles.profileRole}>System Architect</Text>
                <TouchableOpacity>
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 1: Configuration */}
            <Text style={styles.sectionTitle}>CONFIGURATION</Text>
            <View style={styles.cardContainer}>
              
              <View style={styles.rowItemBorder}>
                <View style={styles.iconRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                    <FontAwesome5 name="school" size={12} color="#2563eb" />
                  </View>
                  <Text style={styles.rowLabel}>School Name</Text>
                </View>
                <Text style={styles.rowValue}>St. Xavier's High</Text>
              </View>

              <View style={styles.rowItem}>
                <View style={styles.iconRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#faf5ff' }]}>
                    <FontAwesome5 name="calendar-alt" size={12} color="#9333ea" />
                  </View>
                  <Text style={styles.rowLabel}>Academic Year</Text>
                </View>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{academicYear}</Text>
                  <FontAwesome5 name="chevron-down" size={10} color="#334155" />
                </TouchableOpacity>
              </View>

            </View>

            {/* Section 2: Appearance */}
            <Text style={styles.sectionTitle}>APPEARANCE</Text>
            <View style={styles.cardContainer}>
              <View style={styles.rowItem}>
                <View style={styles.iconRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
                    <FontAwesome5 name="moon" size={12} color="#4f46e5" />
                  </View>
                  <View>
                    <Text style={styles.rowLabel}>Dark Mode</Text>
                    <Text style={styles.rowSubtext}>Switch app theme</Text>
                  </View>
                </View>
                <Switch
                  trackColor={{ false: "#e2e8f0", true: "#4f46e5" }}
                  thumbColor={"#fff"}
                  ios_backgroundColor="#e2e8f0"
                  onValueChange={() => setIsDarkMode(!isDarkMode)}
                  value={isDarkMode}
                />
              </View>
            </View>

            {/* Section 3: Security */}
            <Text style={styles.sectionTitle}>SECURITY</Text>
            <View style={styles.cardContainer}>
              <View style={styles.rowItem}>
                <View style={styles.iconRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                    <FontAwesome5 name="shield-alt" size={12} color="#ea580c" />
                  </View>
                  <View>
                    <Text style={styles.rowLabel}>Master Code</Text>
                    <Text style={styles.rowSubtext}>Used for Admin Login</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.changeBtn} onPress={handleChangeCode}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 4: System Controls */}
            <Text style={styles.sectionTitle}>SYSTEM CONTROLS</Text>
            <View style={styles.cardContainer}>
              <View style={styles.rowItem}>
                <View style={styles.iconRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                    <FontAwesome5 name="power-off" size={12} color="#dc2626" />
                  </View>
                  <View>
                    <Text style={styles.rowLabel}>Maintenance Mode</Text>
                    <Text style={styles.rowSubtext}>Block all user logins</Text>
                  </View>
                </View>
                <Switch
                  trackColor={{ false: "#e2e8f0", true: "#dc2626" }}
                  thumbColor={"#fff"}
                  ios_backgroundColor="#e2e8f0"
                  onValueChange={() => setIsMaintenance(!isMaintenance)}
                  value={isMaintenance}
                />
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Stella Admin v5.0.0 (Build 104)</Text>

          </View>
        </ScrollView>

        {/* Bottom Nav - Settings Active */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('AdminDash')}
          >
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="cog" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Settings</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
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
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Profile Card */
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  profileRole: { fontSize: 12, color: '#64748b' },
  editProfileText: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5', marginTop: 4 },

  /* Sections */
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  cardContainer: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, overflow: 'hidden' },
  
  /* Rows */
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowItemBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  rowSubtext: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  rowValue: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  /* Controls */
  dropdown: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  changeBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },

  /* Logout */
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  signOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  versionText: { textAlign: 'center', fontSize: 10, color: '#94a3b8' },

  /* Bottom Nav */
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});