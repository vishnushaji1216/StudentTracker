import React, { useState, useRef, useEffect, useCallback } from "react";
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
  FlatList,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

export default function StudentNoticeBoardScreen({ navigation }) {
  // --- STATE: Sidebar ---
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE: Data ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Student Info for Sidebar
  const [studentInfo, setStudentInfo] = useState({ name: 'Student', class: '', initials: 'ST' });

  // --- API CALLS ---
  const fetchData = async () => {
    try {
      // 1. Fetch Notices
      const noticeRes = await api.get('/student/notices');
      setNotices(noticeRes.data);

      // 2. Fetch Profile (to show name in sidebar)
      // If you store this in Context, you can remove this call
      const profileRes = await api.get('/student/profile');
      const s = profileRes.data.profile;
      setStudentInfo({
          name: s.name,
          class: s.className,
          initials: s.name ? s.name.substring(0,2).toUpperCase() : 'ST'
      });

    } catch (error) {
      console.error("Failed to load notices", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- FILTER LOGIC ---
  const filteredNotices = notices.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'School') return item.type === 'school'; // Admin/Parents/Everyone
    if (activeFilter === 'Class') return item.type === 'class';   // Teacher/Class
    return true;
  });

  // --- SIDEBAR HANDLERS (Safe Animation) ---
  const toggleSidebar = () => {
    if (isSidebarOpen) {
      // Closing: Animate -> Then unmount
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setIsSidebarOpen(false));
    } else {
      // Opening: Mount -> Then animate
      setIsSidebarOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNav = (screen) => {
    toggleSidebar();
    setTimeout(() => navigation.navigate(screen), 50);
  };

  const handleLogout = async () => {
    try {
        await AsyncStorage.multiRemove(["token", "user", "role"]);
        navigation.replace("Login");
    } catch(e) { console.log(e); }
  };

  // Back Button Handler
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


  // --- RENDER ITEM ---
  const renderNoticeItem = ({ item }) => {
    const isUrgent = item.priority === 'urgent';
    
    return (
      <View style={[styles.card, isUrgent && styles.cardUrgent]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex:1 }}>
            
            {/* Icon Box */}
            <View style={[styles.iconBox, { backgroundColor: item.bgIcon, borderColor: isUrgent ? '#fee2e2' : '#f1f5f9' }]}>
              <FontAwesome5 name={item.icon} size={14} color={item.iconColor} />
            </View>
            
            {/* Sender Info */}
            <View style={{flex:1}}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={[styles.senderRole, isUrgent && { color: '#7f1d1d' }]}>
                    {item.role}
                </Text>
                <Text style={[styles.dateText, isUrgent && { color: '#ef4444' }]}>{item.date}</Text>
              </View>
              
              <Text style={styles.senderName}>
                {isUrgent ? (
                  <Text style={{ color: '#ef4444', fontWeight:'bold' }}>
                    {item.type === 'school' ? "Urgent Alert" : item.sender}
                  </Text>
                ) : (
                  item.sender
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, isUrgent && { color: '#991b1b' }]}>{item.title}</Text>
          <Text style={[styles.cardMessage, isUrgent && { color: '#b91c1c' }]}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ======================================================= */}
      {/* 1. MAIN CONTENT (Top Layer for Sidebar Fix) */}
      {/* ======================================================= */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Announcements</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.tabContainer}>
            {['All', 'School', 'Class'].map(tab => (
              <TouchableOpacity 
                key={tab}
                style={[styles.tabBtn, activeFilter === tab && styles.tabBtnActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.tabText, activeFilter === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content List */}
        <View style={styles.contentContainer}>
          {loading ? (
             <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                 <ActivityIndicator size="large" color="#4f46e5" />
             </View>
          ) : (
            <FlatList
                data={filteredNotices}
                keyExtractor={item => item.id.toString()}
                renderItem={renderNoticeItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <FontAwesome5 name="clipboard-check" size={30} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyText}>No notices posted yet.</Text>
                    </View>
                )}
            />
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

      {/* ======================================================= */}
      {/* 2. SIDEBAR & OVERLAY (Bottom of Return for Z-Index) */}
      {/* ======================================================= */}
      {isSidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
           <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
        </Animated.View>
      )}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.sidebarSafeArea}>
            <View style={styles.sidebarContainer}>
                <View style={{flex: 1}}>
                    {/* Sidebar Header */}
                    <View style={styles.sidebarHeader}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                            <View style={styles.avatarLarge}>
                                <Text style={styles.avatarTextLarge}>{studentInfo.initials}</Text>
                            </View>
                            <View>
                                <Text style={styles.sidebarName}>{studentInfo.name}</Text>
                                <Text style={styles.sidebarClass}>{studentInfo.class}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={toggleSidebar} style={{padding:5}}>
                            <FontAwesome5 name="times" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView style={styles.menuScroll} contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                        <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
                        <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')} />
                        <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')} />
                        <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')}/>
                        <SidebarItem icon="microphone" label="Daily Audio" onPress={() => handleNav('AudioRecorder')} />
                        <SidebarItem icon="bullhorn" label="Notice" active />
                    </ScrollView>
                </View>

                {/* Footer */}
                <View style={styles.sidebarFooter}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
      </Animated.View>

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
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 101, elevation: 20 },
  sidebarSafeArea: { flex: 1, backgroundColor: '#fff' },
  sidebarContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', marginTop: 20, marginBottom: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  avatarTextLarge: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  sidebarName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sidebarClass: { fontSize: 12, color: '#64748b' },
  menuScroll: { marginTop: 10 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, marginBottom: 2 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 8 },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },

  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Content */
  contentContainer: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  /* Notices */
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.02, shadowRadius:4, elevation:1 },
  cardUrgent: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444', borderColor: '#fee2e2' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  senderRole: { fontSize: 10, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase' },
  senderName: { fontSize: 11, color: '#64748b' },
  dateText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },

  cardBody: { marginTop: 4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  cardMessage: { fontSize: 12, color: '#64748b', lineHeight: 20 },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});