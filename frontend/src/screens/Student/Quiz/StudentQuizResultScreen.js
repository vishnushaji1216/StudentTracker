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
  UIManager
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

const SIDEBAR_WIDTH = 280;
const { width } = Dimensions.get('window');

export default function StudentQuizResultScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      navigation.navigate('StudentQuizCenter'); // Go back to quiz center
      return true;
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

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

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
              <View style={styles.logoBox}><Text style={styles.logoText}>AK</Text></View>
              <View>
                <Text style={styles.sidebarTitle}>Arjun Kumar</Text>
                <Text style={styles.sidebarVersion}>Class 9-A</Text>
              </View>
            </View>

            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
              <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')} />
              <SidebarItem icon="folder-open" label="Resource Library" />
              
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>ACADEMICS</Text>
              
              <SidebarItem icon="microphone" label="Daily Audio" />
              <SidebarItem icon="pen-fancy" label="Handwriting" />
              <SidebarItem icon="list-check" label="Quiz Center" active onPress={() => handleNav('StudentQuizCenter')} />

              <View style={styles.menuDivider} />
              <SidebarItem icon="circle-question" label="Help & Support" />
            </ScrollView>
          </View>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <View style={styles.mainContent}>
        
        {/* Full Screen Success Content */}
        <View style={styles.successContainer}>
            
            <View style={styles.trophyContainer}>
                <View style={styles.trophyCircle}>
                    <FontAwesome5 name="trophy" size={40} color="#facc15" />
                </View>
            </View>

            <Text style={styles.successTitle}>Quiz Completed!</Text>
            <Text style={styles.successSub}>Weekly Math Test</Text>

            <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                <Text style={styles.scoreValue}>18<Text style={styles.scoreTotal}>/20</Text></Text>
                
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumGreen}>18</Text>
                        <Text style={styles.statLabel}>CORRECT</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumRed}>2</Text>
                        <Text style={styles.statLabel}>WRONG</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumSlate}>90%</Text>
                        <Text style={styles.statLabel}>ACCURACY</Text>
                    </View>
                </View>
            </View>

        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
            <TouchableOpacity style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>Review Answers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('StudentDash')}>
                <Text style={styles.homeBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4f46e5" }, // Indigo Background
  mainContent: { flex: 1 },

  /* Sidebar */
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 51, elevation: 20 },
  sidebarContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, justifyContent: 'space-between', paddingBottom: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoBox: { width: 40, height: 40, backgroundColor: '#4f46e5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  sidebarTitle: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
  sidebarVersion: { fontSize: 11, color: '#94a3b8' },
  menuScroll: { marginTop: 20, flex: 1 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  menuSectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  sidebarItemActive: { backgroundColor: '#eef2ff' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, width: '100%' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },

  /* Success Content */
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  trophyContainer: { marginBottom: 24 },
  trophyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#c7d2fe', marginBottom: 32 },

  /* Score Card */
  scoreCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  scoreLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  scoreValue: { fontSize: 48, fontWeight: '900', color: '#4f46e5' },
  scoreTotal: { fontSize: 24, color: '#cbd5e1' },

  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '100%', backgroundColor: '#f1f5f9' },
  statNumGreen: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  statNumRed: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  statNumSlate: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
  statLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginTop: 2 },

  /* Footer */
  footer: { padding: 24, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  reviewBtn: { backgroundColor: '#eef2ff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  reviewBtnText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 14 },
  homeBtn: { paddingVertical: 12, alignItems: 'center' },
  homeBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
});