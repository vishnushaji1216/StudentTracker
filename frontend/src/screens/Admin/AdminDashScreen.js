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
  TextInput,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

// --- DUMMY DATA CONTRACT (Swap with API later) ---
const MOCK_DATA = {
  date: "Monday, 24 Oct",
  financial: {
    collectedToday: "42,500",
    isCritical: false
  },
  alerts: {
    lockedUsers: 12,
    pendingApprovals: 4
  }
};

export default function AdminDashScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState("");
  

  // Dashboard State
  const [showFinance, setShowFinance] = useState(false);
  const [searchText, setSearchText] = useState("");

  // --- NAVIGATION & SIDEBAR LOGIC ---
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

  useEffect(() => {
    const date = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    setDisplayDate(date.toLocaleDateString('en-GB', options));
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "role"]);
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR OVERLAY --- */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} pointerEvents={isSidebarOpen ? "auto" : "none"}>
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

            {/* --- USER PROVIDED SIDEBAR SECTION --- */}
            <View style={styles.menuSection}>
              <SidebarItem icon="chart-pie" label="Dashboard" active />
              <SidebarItem icon="user-plus" label="Add User" onPress={() => { toggleSidebar(); navigation.navigate('AddUser');}}/>
              <SidebarItem icon="list-ul" label="Teacher Registry" onPress={() => {toggleSidebar(); navigation.navigate('TeacherRegistry');}}/>
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => { toggleSidebar(); navigation.navigate('StudentRegistry');}}/>
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar();navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Security" onPress={() => {toggleSidebar(); navigation.navigate('AdminSetting');}}/>
            </View>
            {/* -------------------------------------- */}

          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: 12 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSub}>{displayDate}</Text>
          </View>
          <TouchableOpacity onPress={toggleSidebar} style={styles.profileBtn}>
            <FontAwesome5 name="bars" size={20} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* 1. HERO SEARCH BAR */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <FontAwesome5 name="search" size={16} color="#94a3b8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search student, roll no, or teacher..."
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          {/* 2. PRIVACY FINANCE STRIP */}
          <TouchableOpacity 
            style={styles.financeStrip} 
            activeOpacity={0.9} 
            onPress={() => setShowFinance(!showFinance)}
          >
            <View>
              <Text style={styles.finLabel}>COLLECTED TODAY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {showFinance ? (
                  <Text style={styles.finAmount}>₹ {MOCK_DATA.financial.collectedToday}</Text>
                ) : (
                  <View style={styles.hiddenAmount}>
                    <View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} />
                  </View>
                )}
                <TouchableOpacity onPress={() => setShowFinance(!showFinance)}>
                  <FontAwesome5 name={showFinance ? "eye-slash" : "eye"} size={14} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.finAction}>
              <Text style={styles.finActionText}>View Report</Text>
              <FontAwesome5 name="arrow-right" size={10} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 3. CRITICAL ALERTS */}
          <Text style={styles.sectionTitle}>REQUIRES ATTENTION</Text>
          <View style={styles.alertRow}>
            {/* Locked Users Card */}
            <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('StudentRegistry', { filter: 'locked' })}>
              <View style={styles.alertIconBox}>
                <FontAwesome5 name="lock" size={14} color="#dc2626" />
              </View>
              <Text style={styles.alertVal}>{MOCK_DATA.alerts.lockedUsers}</Text>
              <Text style={styles.alertDesc}>Locked Users</Text>
            </TouchableOpacity>

            {/* Audio Submission Defaulters Card */}
            <TouchableOpacity 
              style={[styles.alertCard, styles.alertCardBlue]}
              onPress={() => alert("Opening Defaulter List")}
            >
              <View style={[styles.alertIconBox, styles.iconBoxBlue]}>
                <FontAwesome5 name="microphone-slash" size={14} color="#2563eb" />
              </View>
              <Text style={[styles.alertVal, styles.textBlue]}>
                {/* This value can later be linked to an API for pending submissions */}
                8 
              </Text>
              <Text style={[styles.alertDesc, styles.textBlue]}>Audio Defaulters</Text>
            </TouchableOpacity>
          </View>

          {/* 4. MANAGEMENT GRID */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.gridContainer}>
            
            <ActionCard 
              icon="user-plus" 
              label="New Admission" 
              sub="Student / Teacher"
              color="#4f46e5" 
              bg="#eef2ff"
              onPress={() => navigation.navigate('AddUser')}
            />

            <ActionCard 
              icon="bullhorn" 
              label="Broadcast" 
              sub="Send Notice"
              color="#ea580c" 
              bg="#fff7ed"
              onPress={() => navigation.navigate('Broadcast')}
            />

            <ActionCard 
              icon="file-invoice-dollar" 
              label="Fee Structure" 
              sub="Assign Fees"
              color="#16a34a" 
              bg="#f0fdf4"
              onPress={() => alert("Fee Manager Coming Soon")} 
            />

            <ActionCard 
              icon="unlock-alt" 
              label="Unlock User" 
              sub="One-time Override"
              color="#dc2626" 
              bg="#fef2f2"
              onPress={() => navigation.navigate('StudentRegistry')} 
            />

          </View>

        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="th-large" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Console</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentRegistry')}>
            <FontAwesome5 name="users" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Registry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AddUser')}>
            <FontAwesome5 name="plus-circle" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

// --- SUB COMPONENTS ---

const ActionCard = ({ icon, label, sub, color, bg, onPress }) => (
  <TouchableOpacity style={styles.manageCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconCircle, { backgroundColor: bg }]}>
      <FontAwesome5 name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={styles.cardTxt}>{label}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  </TouchableOpacity>
);

const SidebarItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5" }]}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES ---
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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 20 : 0 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  profileBtn: { width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  /* Content */
  content: { flex: 1 },
  
  /* Search */
  searchContainer: { paddingHorizontal: 24, marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, paddingHorizontal: 16, height: 50, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1e293b' },

  /* Finance Strip */
  financeStrip: { marginHorizontal: 24, marginBottom: 24, backgroundColor: '#1e293b', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#1e293b', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  finLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  finAmount: { fontSize: 22, fontWeight: '700', color: '#fff' },
  hiddenAmount: { flexDirection: 'row', gap: 4, height: 26, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  finAction: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  finActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  /* Alerts */
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginHorizontal: 24, marginBottom: 12, letterSpacing: 0.5 },
  alertRow: { flexDirection: 'row', gap: 12, marginHorizontal: 24, marginBottom: 24 },
  alertCard: { flex: 1, backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fee2e2' },
  alertCardBlue: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
  alertIconBox: { alignSelf: 'flex-start', padding: 6, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
  iconBoxBlue: { backgroundColor: '#fff' },
  alertVal: { fontSize: 20, fontWeight: '800', color: '#b91c1c' },
  alertDesc: { fontSize: 12, fontWeight: '600', color: '#991b1b' },
  textBlue: { color: '#1e40af' },

  /* Grid */
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24 },
  manageCard: { width: (width - 60) / 2, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1, gap: 12 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  cardTxt: { fontSize: 14, fontWeight: '700', color: '#334155' },
  cardSub: { fontSize: 11, color: '#94a3b8' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 25 : 12, justifyContent: 'space-around', alignItems: 'center', position: 'absolute', bottom: 0, width: '100%' },
  navItem: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
});