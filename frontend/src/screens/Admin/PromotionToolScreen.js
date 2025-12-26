import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  BackHandler,
  FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;

// Mock Data for Promotion
const INITIAL_STUDENTS = [
  { id: '101', name: 'Aarav Patel', rollNo: '101', selected: true },
  { id: '102', name: 'Ananya Gupta', rollNo: '102', selected: true },
  { id: '103', name: 'Caleb Thomas', rollNo: '103', selected: false }, // Retained example
  { id: '104', name: 'Diya Singh', rollNo: '104', selected: true },
  { id: '105', name: 'Eshan Khan', rollNo: '105', selected: true },
  { id: '106', name: 'Fatima Z.', rollNo: '106', selected: true },
  { id: '107', name: 'Gaurav M.', rollNo: '107', selected: true },
];

export default function PromotionToolScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Promotion State
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [fromClass, setFromClass] = useState("9-A");
  const [toClass, setToClass] = useState("10-A");

  // Derived Stats
  const totalStudents = students.length;
  const selectedCount = students.filter(s => s.selected).length;
  const retainedCount = totalStudents - selectedCount;
  const isAllSelected = selectedCount === totalStudents;

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      return false;
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // Toggle Single Student
  const toggleStudent = (id) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, selected: !student.selected } : student
    ));
  };

  // Toggle All
  const toggleSelectAll = () => {
    const newState = !isAllSelected;
    setStudents(prev => prev.map(s => ({ ...s, selected: newState })));
  };

  const renderStudentRow = ({ item }) => (
    <TouchableOpacity 
      style={[styles.studentCard, !item.selected && styles.studentCardRetained]}
      onPress={() => toggleStudent(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        {/* Custom Checkbox */}
        <View style={[styles.checkbox, item.selected && styles.checkboxChecked]}>
          {item.selected && <FontAwesome5 name="check" size={10} color="#fff" />}
        </View>
        
        {/* Avatar Placeholder */}
        <View style={[styles.avatarBox, !item.selected && { backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1 }]}>
          <Text style={[styles.avatarText, !item.selected && { color: '#94a3b8' }]}>{item.rollNo.slice(-2)}</Text>
        </View>

        <View>
          <Text style={[styles.studentName, !item.selected && { color: '#64748b' }]}>{item.name}</Text>
          <Text style={styles.rollNo}>Roll No. {item.rollNo}</Text>
        </View>
      </View>

      {item.selected ? (
        <View style={styles.statusBadgePromote}>
          <Text style={styles.statusTextPromote}>Promoting</Text>
        </View>
      ) : (
        <View style={styles.statusBadgeRetain}>
          <Text style={styles.statusTextRetain}>Retain</Text>
        </View>
      )}
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
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View>
            <View style={styles.sidebarHeader}>
              <View style={styles.logoBox}><Text style={styles.logoText}>S</Text></View>
              <View>
                <Text style={styles.sidebarTitle}>Stella Admin</Text>
                <Text style={styles.sidebarVersion}>v5.0.0</Text>
              </View>
            </View>

            <View style={styles.menuSection}>
              <SidebarItem icon="chart-pie" label="Dashboard" onPress={() => { toggleSidebar(); navigation.navigate('AdminDash'); }} />
              <SidebarItem icon="user-plus" label="Add User" onPress={() => { toggleSidebar(); navigation.navigate('AddUser'); }} />
              <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => { toggleSidebar(); navigation.navigate('TeacherRegistry'); }} />
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry'); }} />
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" active />
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

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Promotion Tool</Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          
          {/* 1. Configuration Panel */}
          <View style={styles.configPanel}>
            <Text style={styles.sectionTitle}>MIGRATION SETTINGS</Text>
            
            <View style={styles.migrationRow}>
              {/* FROM */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>FROM CLASS</Text>
                <TouchableOpacity style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{fromClass}</Text>
                  <FontAwesome5 name="chevron-down" size={10} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <FontAwesome5 name="arrow-right" size={14} color="#cbd5e1" />
              </View>

              {/* TO */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: '#4f46e5' }]}>TO CLASS</Text>
                <TouchableOpacity style={[styles.dropdown, { borderColor: '#c7d2fe', backgroundColor: '#eef2ff' }]}>
                  <Text style={[styles.dropdownText, { color: '#4f46e5' }]}>{toClass}</Text>
                  <FontAwesome5 name="chevron-down" size={10} color="#6366f1" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoBox}>
              <FontAwesome5 name="info-circle" size={12} color="#ca8a04" style={{ marginTop: 2 }} />
              <Text style={styles.infoText}>
                Students will be moved to the new class structure. Uncheck students to retain them in current grade.
              </Text>
            </View>
          </View>

          {/* 2. Bulk Selection Bar */}
          <View style={styles.selectionBar}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll}>
              <View style={[styles.checkbox, isAllSelected && styles.checkboxChecked]}>
                {isAllSelected && <FontAwesome5 name="check" size={10} color="#fff" />}
              </View>
              <Text style={styles.selectAllText}>SELECT ALL ({totalStudents})</Text>
            </TouchableOpacity>
            <Text style={styles.retainedText}>{retainedCount} Retained</Text>
          </View>

          {/* 3. Student List */}
          <FlatList
            data={students}
            keyExtractor={item => item.id}
            renderItem={renderStudentRow}
            contentContainerStyle={{ paddingBottom: 100 }} // Space for FAB
            showsVerticalScrollIndicator={false}
          />

          {/* Floating Action Button */}
          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fab}>
              <Text style={styles.fabText}>Confirm Promotion ({selectedCount})</Text>
              <FontAwesome5 name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

        </View>

        {/* Bottom Nav */}
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
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Sidebar (Standard) */
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Main Container */
  mainContainer: { flex: 1, padding: 16 },

  /* 1. Config Panel */
  configPanel: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  migrationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  inputLabel: { fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10 },
  dropdownText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  arrowContainer: { paddingTop: 14, alignItems: 'center', justifyContent: 'center' },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#fefce8', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fef9c3' },
  infoText: { fontSize: 10, color: '#a16207', flex: 1, lineHeight: 14 },

  /* 2. Selection Bar */
  selectionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  selectAllText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  retainedText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },

  /* 3. Student List */
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e0e7ff', marginBottom: 8, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  studentCardRetained: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', opacity: 0.8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  rollNo: { fontSize: 10, color: '#94a3b8' },
  statusBadgePromote: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#dcfce7' },
  statusTextPromote: { fontSize: 9, fontWeight: 'bold', color: '#16a34a' },
  statusBadgeRetain: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  statusTextRetain: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8' },

  /* FAB */
  fabContainer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  fab: { backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, shadowColor: '#4f46e5', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});