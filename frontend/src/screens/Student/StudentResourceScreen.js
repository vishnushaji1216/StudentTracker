import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  BackHandler,
  Platform,
  Dimensions,
  UIManager,
  FlatList,
  Alert,
  LayoutAnimation,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar"; // <--- Import Component

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get('window');

// Mock Resources (Ideally fetch from API)
const ALL_RESOURCES = [
  { id: '1', name: 'Ch 5 - Formulas.pdf', size: '2.4 MB', date: 'Today', type: 'pdf', icon: 'file-pdf', color: '#ef4444', bg: '#fef2f2', subject: 'Math' },
  { id: '2', name: 'Poem Recitation.mp3', size: '5.1 MB', date: 'Yesterday', type: 'audio', icon: 'music', color: '#a855f7', bg: '#f3e8ff', subject: 'English' },
  { id: '3', name: 'Diagram_Atom.png', size: '1.2 MB', date: '2 days ago', type: 'image', icon: 'image', color: '#3b82f6', bg: '#eff6ff', subject: 'Science' },
  { id: '4', name: 'Assignment_3.docx', size: '0.5 MB', date: '3 days ago', type: 'doc', icon: 'file-word', color: '#4f46e5', bg: '#eef2ff', subject: 'Math' },
  { id: '5', name: 'History_Map.jpg', size: '3.1 MB', date: 'Last Week', type: 'image', icon: 'image', color: '#3b82f6', bg: '#eff6ff', subject: 'History' },
];

const FILTERS = ['All', 'Math', 'Science', 'English'];

export default function StudentResourceScreen({ navigation }) {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [resources, setResources] = useState(ALL_RESOURCES);
  
  // Student Info for Sidebar
  const [studentInfo, setStudentInfo] = useState({ name: 'Student', className: '', initials: 'ST', profilePic: null });

  // --- EFFECTS ---
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.navigate('StudentDash');
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- DATA LOADING ---
  const loadUserData = async () => {
    try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
            const u = JSON.parse(userStr);
            setStudentInfo({
                name: u.name,
                className: u.className || "Class",
                initials: u.name ? u.name.substring(0, 2).toUpperCase() : "ST",
                profilePic: u.profilePic
            });
        }
    } catch (e) {
        console.log("Error loading user data", e);
    }
  };

  // --- ACTIONS ---
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleAudioPress = async () => {
      // Quick check for active audio task
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
          
          alert("No active audio tasks found.");
      } catch (e) {
          console.error("Audio check failed", e);
      }
  };

  const handleFilter = (filter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
    if (filter === 'All') {
      setResources(ALL_RESOURCES);
    } else {
      setResources(ALL_RESOURCES.filter(item => item.subject === filter));
    }
  };

  const handleFileAction = (item) => {
    let action = "Opening";
    if (item.type === 'pdf' || item.type === 'doc') action = "Downloading";
    if (item.type === 'audio') action = "Playing";
    
    Alert.alert(action, `${item.name}`);
  };

  // --- RENDER ITEM ---
  const renderResourceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.fileCard} 
      activeOpacity={0.7}
      onPress={() => handleFileAction(item)}
    >
      <View style={styles.fileLeft}>
        <View style={[styles.iconBox, { backgroundColor: item.bg, borderColor: item.color + '30' }]}>
          <FontAwesome5 name={item.icon} size={20} color={item.color} />
        </View>
        <View>
          <Text style={styles.fileName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{item.subject}</Text>
            </View>
            <Text style={styles.fileInfo}>{item.size} • {item.date}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.actionBtn}
        onPress={() => handleFileAction(item)}
      >
        <FontAwesome5 
            name={item.type === 'audio' ? 'play' : item.type === 'image' ? 'eye' : 'download'} 
            size={12} 
            color="#4f46e5" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- REUSABLE SIDEBAR --- */}
      <StudentSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeRoute="StudentResource"
        userInfo={studentInfo}
        onLogout={handleLogout}
        onAudioPress={handleAudioPress}
      />

      {/* --- MAIN CONTENT --- */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Library</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <FontAwesome5 name="search" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            
            {/* Filter Chips */}
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 20 }}>
                    {FILTERS.map((filter) => (
                        <TouchableOpacity 
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                            onPress={() => handleFilter(filter)}
                        >
                            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* File List */}
            <FlatList
                data={resources}
                keyExtractor={item => item.id}
                renderItem={renderResourceItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="folder-open" size={32} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No files found for {activeFilter}</Text>
                    </View>
                }
            />

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  searchBtn: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 },

  /* Content */
  contentContainer: { flex: 1, padding: 20 },
  
  /* Filters */
  filterScroll: { flexGrow: 0, marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  filterText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  filterTextActive: { color: '#fff' },

  /* Cards */
  fileCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  fileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  fileName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  subjectBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  subjectText: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  fileInfo: { fontSize: 10, color: '#94a3b8' },
  
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },

  /* Empty State */
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#94a3b8', fontSize: 14 },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});