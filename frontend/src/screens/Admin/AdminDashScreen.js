import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280; // Matches standard drawer width

export default function AdminDashScreen({ navigation }) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isSidebarOpen) {
          toggleSidebar();
          return true;
        }
        return false;
      }
    );
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    const isOpen = isSidebarOpen;
    // Animate Sidebar
    Animated.timing(slideAnim, {
      toValue: isOpen ? -SIDEBAR_WIDTH : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate Overlay
    Animated.timing(overlayAnim, {
      toValue: isOpen ? 0 : 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start();

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* DARK OVERLAY */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={isSidebarOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
      </Animated.View>

      {/* SIDEBAR DRAWER */}
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

            {/* Navigation Items */}
            <View style={styles.menuSection}>
              <SidebarItem icon="chart-pie" label="Dashboard" active />
              <SidebarItem icon="user-plus" label="Add User" onPress={() => { toggleSidebar(); navigation.navigate('AddUser');}}/>
              <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => {toggleSidebar(); navigation.navigate('TeacherRegistry');}}/>
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry');}}/>
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar();navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Security" onPress={() => {toggleSidebar(); navigation.navigate('AdminSetting');}}/>
            </View>
          </View>

          {/* Footer: Settings (Left) + Logout Icon (Right) */}
          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn} onPress={() => console.log("Settings pressed")}>
                <FontAwesome5 name="cog" size={16} color="#64748b" />
                <Text style={styles.settingsText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* MAIN CONTENT */}
      <SafeAreaView style={styles.mainContent} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <FontAwesome5 name="bars" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={{ width: 20 }} /> 
        </View>

        {/* Scrollable Body */}
        <ScrollView 
          style={styles.scrollBody} 
          contentContainerStyle={{ paddingBottom: 100 }} // Padding for bottom nav
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL STUDENTS</Text>
                <Text style={styles.statValue}>450</Text>
              </View>

              <TouchableOpacity style={styles.statCardActive}>
                <View style={styles.statCardHeader}>
                  <Text style={styles.statLabelActive}>DAILY ACTIVE</Text>
                  <FontAwesome5 name="users" size={12} color="rgba(255,255,255,0.5)" />
                </View>
                <Text style={styles.statValueActive}>380<Text style={styles.statTotal}>/450</Text></Text>
                
                <View style={styles.viewDefaultersBtn}>
                  <FontAwesome5 name="eye" size={10} color="#fff" />
                  <Text style={styles.viewDefaultersText}>View Defaulters</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Red Flags Section */}
            <View style={styles.redFlagContainer}>
              <View style={styles.redFlagHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FontAwesome5 name="exclamation-triangle" size={12} color="#b91c1c" />
                  <Text style={styles.redFlagTitle}>RED FLAGS</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>2 Classes</Text>
                </View>
              </View>

              <View style={styles.redFlagItem}>
                <View>
                  <Text style={styles.redFlagClass}>Class 5-C</Text>
                  <Text style={styles.redFlagReason}>Low Audio</Text>
                </View>
                <Text style={styles.redFlagValueRed}>12%</Text>
              </View>

              <View style={[styles.redFlagItem, { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={styles.redFlagClass}>Class 9-A</Text>
                  <Text style={styles.redFlagReason}>Low Performance</Text>
                </View>
                <Text style={styles.redFlagValueOrange}>Avg 62%</Text>
              </View>
            </View>

          </View>
        </ScrollView>

        {/* FIXED BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="chart-pie" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Dash</Text>
          </TouchableOpacity>

          {/* Bottom Nav Link to Add User */}
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('AddUser')}
          >
            <FontAwesome5 name="user-plus" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Add User</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */

// UPDATED: SidebarItem now accepts and uses onPress
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
  // ... Copy your existing styles from the previous file here ...
  // Make sure to include all styles provided previously
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50
  },
  
  /* Overlay */
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 50,
  },

  /* Sidebar */
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    zIndex: 51,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  sidebarContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  sidebarTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e293b',
  },
  sidebarVersion: {
    fontSize: 11,
    color: '#94a3b8',
  },
  menuSection: {
    gap: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: '#eef2ff',
  },
  sidebarItemText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  logoutIconBtn: {
    padding: 4,
  },

  /* Main Area */
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scrollBody: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },

  /* Stats Cards */
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statCardActive: {
    flex: 1,
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabelActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#c7d2fe',
  },
  statValueActive: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTotal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  viewDefaultersBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDefaultersText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* Red Flags */
  redFlagContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    overflow: 'hidden',
  },
  redFlagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
  },
  redFlagTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  badge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  redFlagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  redFlagClass: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  redFlagReason: {
    fontSize: 11,
    color: '#64748b',
  },
  redFlagValueRed: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  redFlagValueOrange: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f97316',
  },

  /* BOTTOM NAVIGATION (The Sticky Part) */
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10, // Safe area handling
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
});