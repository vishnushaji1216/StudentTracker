import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock Data matching your design
const TEACHERS = [
  {
    id: "1",
    name: "Priya Sharma",
    code: "T-2025-08",
    avatar: "https://i.pravatar.cc/150?img=5",
    isClassTeacher: true,
    className: "9-A",
    subject: "Mathematics",
    avgScore: "76%",
    trend: "up",
    statusColor: "#22c55e",
  },
  {
    id: "2",
    name: "Rahul Verma",
    code: "T-2025-09",
    avatar: null,
    initials: "RV",
    isClassTeacher: false,
    subject: "Physics",
    avgScore: "58%",
    trend: "down",
    statusColor: "#fb923c",
  },
  {
    id: "3",
    name: "Sarah Jenkins",
    code: "T-2025-10",
    avatar: "https://i.pravatar.cc/150?img=9",
    isClassTeacher: true,
    className: "10-C",
    subject: "English",
    avgScore: "82%",
    trend: "up",
    statusColor: "#22c55e",
  },
];

const SIDEBAR_WIDTH = 280;

export default function TeacherRegistryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");

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

  const renderTeacherCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('TeacherDetail', { teacherId: item.id })}
    >
      {/* TOP ROW: Identity & Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.identityRow}>
          {/* Avatar Logic */}
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{item.initials}</Text>
              </View>
            )}
            {/* Online Status Dot */}
            <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
          </View>

          {/* Name & Code */}
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.code}>Code: {item.code}</Text>
          </View>
        </View>

        {/* Badge: Class Teacher vs Subject Teacher */}
        {item.isClassTeacher ? (
          <View style={styles.classTeacherBadge}>
            <Text style={styles.classTeacherText}>Class Teacher: {item.className}</Text>
          </View>
        ) : (
          <View style={styles.subjectTeacherBadge}>
            <Text style={styles.subjectTeacherText}>Subject Teacher</Text>
          </View>
        )}
      </View>

      {/* BOTTOM ROW: Stats */}
      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          
          {/* Metric 1: Class/Sub Avg */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>
              {item.isClassTeacher ? "CLASS AVG" : "SUB AVG"}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[
                styles.statValue, 
                { color: item.trend === 'up' ? '#16a34a' : '#f97316' } // Green or Orange
              ]}>
                {item.avgScore}
              </Text>
              <FontAwesome5 
                name={item.trend === 'up' ? "arrow-up" : "arrow-down"} 
                size={10} 
                color={item.trend === 'up' ? '#16a34a' : '#f97316'} 
              />
            </View>
          </View>

          {/* Metric 2: Subject */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SUBJECT</Text>
            <Text style={styles.subjectValue}>{item.subject}</Text>
          </View>

        </View>
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
                active // ACTIVE STATE
              />
              <SidebarItem icon="list-ul" label="Student Registry" onPress={() => {
                toggleSidebar();
                navigation.navigate('StudentRegistry');
              }}
              />
              <SidebarItem icon="bullhorn" label="Broadcast" onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar();navigation.navigate('PromotionTool');}}/>
              <SidebarItem icon="shield-alt" label="Security" onPress={() =>{toggleSidebar();navigation.navigate('AdminSetting');}}/>
            </View>
          </View>

          {/* Sidebar Footer */}
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
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Teachers</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>12 Active</Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={14} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or code..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* List */}
          <FlatList
            data={TEACHERS}
            keyExtractor={item => item.id}
            renderItem={renderTeacherCard}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50
  },
  safeArea: {
    flex: 1,
  },
  
  /* --- SIDEBAR STYLES --- */
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  menuButton: {
    padding: 4,
  },
  countBadge: {
    backgroundColor: '#eef2ff', // Indigo-50
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4f46e5',
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
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },

  /* Card Styles */
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
  
  /* Card Top Row */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  /* Avatar */
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },

  /* Names */
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  code: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  /* Badges */
  classTeacherBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  classTeacherText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4f46e5',
    textTransform: 'uppercase',
  },
  subjectTeacherBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  subjectTeacherText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },

  /* Footer Stats */
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subjectValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
});