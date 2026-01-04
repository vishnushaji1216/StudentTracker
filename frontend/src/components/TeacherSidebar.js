import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  Alert
} from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api"; // Ensure this points to your axios instance

const SIDEBAR_WIDTH = 280;

export default function TeacherSidebar({ navigation, isOpen, onClose, activeItem }) {
  // Animation State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Data State
  const [profile, setProfile] = useState({
    name: "Loading...",
    code: "...",
    pic: "https://i.pravatar.cc/150?img=5" // Static link as requested
  });

  // 1. Handle Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  // 2. Fetch Data from Backend
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      // Option A: If you stored user details in AsyncStorage during login
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);

      if (parsedUser) {
        // Optimistic update from local storage
        setProfile(prev => ({ ...prev, name: parsedUser.name, code: parsedUser.teacherCode || "T-Code" }));
      }

      // Option B: Fetch fresh data from API
      // Ensure your api.js handles the Authorization header automatically
      const response = await api.get('/teachers/profile');
      
      if (response.data) {
        setProfile({
            name: response.data.name,
            code: response.data.teacherId || "T-Pending", // Fallback if ID is missing
            pic: "https://i.pravatar.cc/150?img=5" 
        });
        
        // Update local storage to keep it fresh
        await AsyncStorage.mergeItem("user", JSON.stringify(response.data));
      }

    } catch (error) {
      console.log("Failed to load profile:", error);
      // Fail silently or show a generic name
    }
  };

  const handleNav = (screen) => {
    onClose();
    if (activeItem !== screen) {
      navigation.navigate(screen);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login", { skipAnimation: true });
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarContainer}>
          <View style={{ flex: 1 }}>
            
            {/* Dynamic Header */}
            <View style={styles.sidebarHeader}>
              <Image source={{ uri: profile.pic }} style={styles.profilePic} />
              <View>
                <Text style={styles.teacherName}>{profile.name}</Text>
                <Text style={styles.teacherCode}>{profile.code}</Text>
              </View>
              <View style={styles.classTag}>
                <Text style={styles.classTagText}>Class Teacher: 9-A</Text>
              </View>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem icon="chart-pie" label="Dashboard" active={activeItem === 'TeacherDash'} onPress={() => handleNav('TeacherDash')} />
              <SidebarItem icon="calendar-check" label="Daily Tasks" active={activeItem === 'DailyTask'} onPress={() => handleNav('DailyTask')} />
              <SidebarItem icon="chalkboard-teacher" label="My Classes" active={activeItem === 'MyClasses'} onPress={() => handleNav('MyClasses')} />
              <SidebarItem icon="users" label="Student Directory" active={activeItem === 'StudentDirectory'} onPress={() => handleNav('StudentDirectory')} />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>CONTENT & GRADING</Text>
              
              <SidebarItem icon="list-ul" label="Quiz Manager" active={activeItem === 'QuizDashboard'} onPress={() => handleNav('QuizDashboard')} />
              <SidebarItem icon="pen-fancy" label="Handwriting Review" active={activeItem === 'HandwritingReview'} onPress={() => handleNav('HandwritingReview')} />
              <SidebarItem icon="headphones" label="Audio Review" active={activeItem === 'AudioReview'} onPress={() => handleNav('AudioReview')} />
              <SidebarItem icon="bullhorn" label="Notice Board" active={activeItem === 'NoticeBoard'} onPress={() => handleNav('NoticeBoard')} />
              <SidebarItem icon="folder-open" label="Resource Library" active={activeItem === 'ResourceLibrary'} onPress={() => handleNav('ResourceLibrary')} />
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => handleNav('TeacherSetting')}>
              <FontAwesome5 name="cog" size={16} color="#64748b" />
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

// Sub-component
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarHeader: { marginBottom: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'column', gap: 12 },
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  teacherCode: { fontSize: 12, color: '#64748b' },
  classTag: { alignSelf: 'flex-start', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 62 },
  classTagText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' },
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  sidebarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
});