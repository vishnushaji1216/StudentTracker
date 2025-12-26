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
  Dimensions,
  UIManager,
  FlatList,
  Alert,
  LayoutAnimation
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

// Mock Resources
const ALL_RESOURCES = [
  { id: '1', name: 'Ch 5 - Formulas.pdf', size: '2.4 MB', date: 'Today', type: 'pdf', icon: 'file-pdf', color: '#ef4444', bg: '#fef2f2', subject: 'Math' },
  { id: '2', name: 'Poem Recitation.mp3', size: '5.1 MB', date: 'Yesterday', type: 'audio', icon: 'music', color: '#a855f7', bg: '#f3e8ff', subject: 'English' },
  { id: '3', name: 'Diagram_Atom.png', size: '1.2 MB', date: '2 days ago', type: 'image', icon: 'image', color: '#3b82f6', bg: '#eff6ff', subject: 'Science' },
  { id: '4', name: 'Assignment_3.docx', size: '0.5 MB', date: '3 days ago', type: 'doc', icon: 'file-word', color: '#4f46e5', bg: '#eef2ff', subject: 'Math' },
  { id: '5', name: 'History_Map.jpg', size: '3.1 MB', date: 'Last Week', type: 'image', icon: 'image', color: '#3b82f6', bg: '#eff6ff', subject: 'History' },
];

const FILTERS = ['All', 'Math', 'Science', 'English'];

export default function StudentResourceScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student Info (Mock)
  const [studentName, setStudentName] = useState("Arjun");
  const [className, setClassName] = useState("Class 9-A");

  // Screen State
  const [activeFilter, setActiveFilter] = useState('All');
  const [resources, setResources] = useState(ALL_RESOURCES);

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      // navigation.replace("Login", { skipAnimation: true });
      console.log("Logged out");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
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
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>AK</Text>
                        </View>
                        <View>
                            <Text style={styles.sidebarName}>{studentName}</Text>
                            <Text style={styles.sidebarClass}>{className}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.menuScroll} contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                        <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
                        <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')} />
                        <SidebarItem icon="folder-open" label="Resource Library" active onPress={() => toggleSidebar()} />
                        
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
            <Text style={styles.headerTitle}>Library</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <FontAwesome5 name="search" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            
            {/* Filter Chips */}
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
  avatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  avatarTextLarge: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  sidebarName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sidebarClass: { fontSize: 12, color: '#64748b' },
  
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