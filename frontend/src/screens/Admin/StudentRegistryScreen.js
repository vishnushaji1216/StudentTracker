import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Animated,
  BackHandler,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock Data based on student_registry_v2.html
const STUDENTS = [
  {
    id: "1",
    name: "Arjun Kumar",
    rollNo: "24",
    className: "9-A",
    initials: "AK",
    avatarColor: "#e0e7ff", // Indigo-100
    textColor: "#4f46e5", // Indigo-600
    status: "Active",
    performance: "78%",
    diff: "+12%",
    isGood: true,
    parentMobile: "98765 12345"
  },
  {
    id: "2",
    name: "Diya Singh",
    rollNo: "25",
    className: "9-A",
    initials: "DS",
    avatarColor: "#f1f5f9", // Slate-100
    textColor: "#64748b", // Slate-500
    status: "Inactive",
    performance: "45%",
    diff: "-8%",
    isGood: false,
    parentMobile: "98765 67890"
  },
  {
    id: "3",
    name: "Karan Vohra",
    rollNo: "26",
    className: "9-A",
    initials: "KV",
    avatarColor: "#eff6ff", // Blue-50
    textColor: "#3b82f6", // Blue-500
    status: "Active",
    performance: "65%",
    diff: "--",
    isAverage: true,
    parentMobile: "98765 11223"
  },
];

const SIDEBAR_WIDTH = 280;

export default function StudentRegistryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 9-A");

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
        return false;
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

  const renderStudentCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, item.status === 'Inactive' && styles.cardInactive]} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
    >
      {/* Top Row: Identity & Performance */}
      <View style={styles.cardHeader}>
        
        {/* Identity */}
        <View style={styles.identityRow}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={[styles.avatarText, { color: item.textColor }]}>{item.initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.roll}>Roll No. {item.rollNo}</Text>
          </View>
        </View>

        {/* Performance Badge */}
        <View style={styles.performanceBox}>
          <Text style={styles.perfLabel}>PERFORMANCE</Text>
          <View style={styles.perfRow}>
            <Text style={[
              styles.perfScore, 
              item.isGood ? { color: '#16a34a' } : 
              item.isAverage ? { color: '#475569' } : { color: '#f97316' }
            ]}>
              {item.performance}
            </Text>
            
            <View style={[
              styles.diffBadge,
              item.isGood ? { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' } :
              item.isAverage ? { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' } : { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }
            ]}>
              <Text style={[
                styles.diffText,
                item.isGood ? { color: '#16a34a' } :
                item.isAverage ? { color: '#64748b' } : { color: '#f97316' }
              ]}>
                {item.diff}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer: Parent Mobile */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerLabel}>PARENT MOBILE</Text>
        <Text style={styles.footerValue}>{item.parentMobile}</Text>
      </View>
    </TouchableOpacity>
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

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.sidebarContainer}>
          <View>
            <View style={styles.sidebarHeader}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <View>
                <Text style={styles.sidebarTitle}>Stella Admin</Text>
                <Text style={styles.sidebarVersion}>v5.0.0</Text>
              </View>
            </View>

            {/* Sidebar Navigation */}
            <View style={styles.menuSection}>
              <SidebarItem 
                icon="chart-pie" 
                label="Dashboard" 
                onPress={() => {
                  toggleSidebar();
                  navigation.navigate('AdminDash');
                }} 
              />
              <SidebarItem 
                icon="user-plus" 
                label="Add User" 
                onPress={() => {
                  toggleSidebar();
                  navigation.navigate('AddUser');
                }} 
              />
              <SidebarItem 
                icon="list-ul" 
                label="Teacher Registry" 
                onPress={() => {
                  toggleSidebar();
                  navigation.navigate('TeacherRegistry');
                }} 
              />
              <SidebarItem 
                icon="list-ul" 
                label="Student Registry" 
                active // Active State
              />
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar();navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Security" onPress={() =>{toggleSidebar();navigation.navigate('AdminSetting');}}/>
            </View>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn}>
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

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* HEADER with Class Filter */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Students</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>450 Total</Text>
            </View>
          </View>

          {/* Class Dropdown Filter */}
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{selectedClass}</Text>
            <FontAwesome5 name="chevron-down" size={12} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={14} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* List */}
          <FlatList
            data={STUDENTS}
            keyExtractor={item => item.id}
            renderItem={renderStudentCard}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />

        </View>

        {/* FIXED BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('AdminDash')}
          >
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>

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

const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
    <FontAwesome5 
      name={icon} 
      size={16} 
      color={active ? "#4f46e5" : "#64748b"} 
      style={{ width: 24 }} 
    />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    flex: 1,
  },
  
  /* Sidebar (Consistent) */
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 50,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    zIndex: 51,
    elevation: 20,
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
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuSection: { gap: 8 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutIconBtn: { padding: 4 },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  menuButton: { padding: 4 },
  countBadge: {
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },

  /* Content */
  contentContainer: {
    flex: 1,
    padding: 20,
  },

  /* Search */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.75,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roll: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },

  /* Performance */
  performanceBox: {
    alignItems: 'flex-end',
  },
  perfLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 2,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perfScore: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* Card Footer */
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

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