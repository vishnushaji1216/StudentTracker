import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated // Kept for Toast Animation if needed
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar"; // <--- Import Component

export default function StudentNoticeBoardScreen({ navigation }) {
  // --- STATE: Sidebar ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE: Data ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Student Info for Sidebar
  const [studentInfo, setStudentInfo] = useState({ name: 'Student', className: '', initials: 'ST', profilePic: null });

  // --- API CALLS ---
  const fetchData = async () => {
    try {
      // 1. Fetch Notices
      const noticeRes = await api.get('/student/notices');
      setNotices(noticeRes.data);

      // 2. Fetch Profile/User from Cache or API
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
          const u = JSON.parse(userStr);
          setStudentInfo({
              name: u.name,
              className: u.className, // Ensure backend sends className not class
              initials: u.name ? u.name.substring(0,2).toUpperCase() : 'ST',
              profilePic: u.profilePic
          });
      } else {
          // Fallback if cache is empty
          const profileRes = await api.get('/student/profile');
          const s = profileRes.data.profile;
          setStudentInfo({
              name: s.name,
              className: s.className,
              initials: s.name ? s.name.substring(0,2).toUpperCase() : 'ST',
              profilePic: s.profilePic
          });
      }

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

  // --- ACTIONS ---
  const handleLogout = async () => {
    try {
        await AsyncStorage.multiRemove(["token", "user", "role"]);
        navigation.replace("Login");
    } catch(e) { console.log(e); }
  };

  // --- AUDIO LOGIC FOR SIDEBAR ---
  const handleAudioPress = async () => {
      // Since we don't have dashboard data loaded on this screen by default,
      // we do a quick check or navigate to Dashboard to handle it.
      // Better approach: Quick fetch to check status.
      try {
          const res = await api.get('/student/dashboard');
          const { dailyMission, pendingList } = res.data;
          
          if (dailyMission && dailyMission.type === 'audio') {
              navigation.navigate('AudioRecorder', { 
                  assignmentId: dailyMission.id || dailyMission._id, 
                  taskTitle: dailyMission.title 
              });
              return;
          }
          
          const pendingAudio = pendingList.find(t => t.type === 'audio');
          if (pendingAudio) {
              navigation.navigate('AudioRecorder', { 
                  assignmentId: pendingAudio.id || pendingAudio._id, 
                  taskTitle: pendingAudio.title 
              });
              return;
          }

          // If no tasks, show alert (since we removed Toast from this screen to simplify)
          alert("No active audio tasks found.");
          
      } catch (e) {
          console.error("Audio check failed", e);
      }
  };

  // Back Button Handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);


  // --- FILTER LOGIC ---
  const filteredNotices = notices.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'School') return item.type === 'school'; 
    if (activeFilter === 'Class') return item.type === 'class'; 
    return true;
  });

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

      {/* --- REUSABLE SIDEBAR --- */}
      <StudentSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeRoute="StudentNoticeBoard"
        userInfo={studentInfo}
        onLogout={handleLogout}
        onAudioPress={handleAudioPress}
      />

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
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
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

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