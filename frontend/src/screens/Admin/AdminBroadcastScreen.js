import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  BackHandler
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SIDEBAR_WIDTH = 280;

// Mock History Data
const HISTORY_DATA = [
  {
    id: '1',
    to: 'Everyone',
    date: 'Today, 10:00 AM',
    title: 'Server Maintenance',
    preview: 'The app will be down for 1 hour tonight for upgrades...',
    isUrgent: false,
  },
  {
    id: '2',
    to: 'Parents',
    date: 'Yesterday',
    title: 'Heavy Rain Alert',
    preview: 'School will remain closed tomorrow due to heavy rainfall...',
    isUrgent: true,
  },
];

export default function AdminBroadcastScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form State
  const [target, setTarget] = useState('Everyone'); // Everyone, Teachers, Parents
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isSidebarOpen) {
          toggleSidebar();
          return true;
        }
        navigation.goBack();
        return true;
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

            {/* Navigation Items */}
            <View style={styles.menuSection}>
              <SidebarItem 
                icon="chart-pie" 
                label="Dashboard" 
                onPress={() => { toggleSidebar(); navigation.navigate('AdminDash'); }}
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
                onPress={() => {
                  toggleSidebar();
                  navigation.navigate('StudentRegistry');
                }}
              />
              
              <SidebarItem icon="bullhorn" label="Broadcast" active onPress={() => {toggleSidebar();navigation.navigate('Broadcast');}}/>
              
              <SidebarItem icon="graduation-cap" label="Promotion Tool" onPress={() => {toggleSidebar(); navigation.navigate('PromotionTool');}}/>
              
              <SidebarItem icon="shield-alt" label="Settings" onPress={() => {toggleSidebar();navigation.navigate('AdminSetting');}}/>
            </View>
          </View>

          <View style={styles.sidebarFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.settingsBtn} onPress={() => {toggleSidebar(); navigation.navigate('AdminSetting');}}>
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
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <FontAwesome5 name="bars" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Broadcast Center</Text>
          <View style={{ width: 20 }} /> 
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. Compose Card */}
            <View style={styles.composeCard}>
              <Text style={styles.sectionTitle}>NEW ANNOUNCEMENT</Text>

              {/* Target Radios */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SEND TO</Text>
                <View style={styles.radioRow}>
                  {['Everyone', 'Teachers', 'Parents'].map((opt) => (
                    <TouchableOpacity 
                      key={opt} 
                      style={[styles.radioBtn, target === opt && styles.radioBtnActive]}
                      onPress={() => setTarget(opt)}
                    >
                      <Text style={[styles.radioText, target === opt && styles.radioTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SUBJECT</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. School Holiday"
                  placeholderTextColor="#cbd5e1"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Message */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MESSAGE</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]}
                  placeholder="Type your announcement here..."
                  placeholderTextColor="#cbd5e1"
                  multiline
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              {/* Urgent Toggle */}
              <TouchableOpacity 
                style={styles.urgentRow} 
                activeOpacity={0.8}
                onPress={() => setIsUrgent(!isUrgent)}
              >
                <View style={[styles.checkbox, isUrgent && styles.checkboxChecked]}>
                  {isUrgent && <FontAwesome5 name="check" size={10} color="#fff" />}
                </View>
                <Text style={styles.urgentText}>Mark as Urgent (Push Notification)</Text>
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity style={styles.sendBtn}>
                <FontAwesome5 name="paper-plane" size={14} color="#fff" />
                <Text style={styles.sendBtnText}>Send Broadcast</Text>
              </TouchableOpacity>
            </View>

            {/* 2. History Section */}
            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>RECENT HISTORY</Text>
            
            {HISTORY_DATA.map((item) => (
              <View 
                key={item.id} 
                style={[styles.historyCard, item.isUrgent && styles.historyCardUrgent]}
              >
                <View style={styles.historyHeader}>
                  <View style={[styles.tag, item.isUrgent ? styles.tagUrgent : styles.tagNormal]}>
                    <Text style={[styles.tagText, item.isUrgent ? styles.tagTextUrgent : styles.tagTextNormal]}>
                      To: {item.to}
                    </Text>
                  </View>
                  <Text style={[styles.dateText, item.isUrgent && { color: '#f87171' }]}>{item.date}</Text>
                </View>
                
                <View style={styles.historyTitleRow}>
                  {item.isUrgent && <FontAwesome5 name="exclamation-circle" size={14} color="#b91c1c" style={{ marginRight: 6 }} />}
                  <Text style={[styles.historyTitle, item.isUrgent && { color: '#991b1b' }]}>{item.title}</Text>
                </View>
                
                <Text style={[styles.historyPreview, item.isUrgent && { color: '#dc2626' }]} numberOfLines={1}>
                  {item.preview}
                </Text>
              </View>
            ))}

          </View>
        </ScrollView>

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
            <Text style={styles.navLabel}>Users</Text>
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
    <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} style={{ width: 24 }} />
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

/* --- STYLES --- */
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
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  logoutIconBtn: { padding: 4 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Content */
  scrollContent: { flex: 1, backgroundColor: '#F8FAFC' },
  contentPadding: { padding: 20 },

  /* Compose Card */
  composeCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 16, textTransform: 'uppercase' },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  textArea: { height: 100 },
  
  /* Radio Buttons */
  radioRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radioBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  radioBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  radioText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  radioTextActive: { color: '#fff' },

  /* Urgent Toggle */
  urgentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  urgentText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },

  /* Send Button */
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* History Items */
  historyCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  historyCardUrgent: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  tagNormal: { backgroundColor: '#f1f5f9', borderColor: '#f1f5f9' },
  tagUrgent: { backgroundColor: '#fff', borderColor: '#fee2e2' },
  tagText: { fontSize: 10, fontWeight: 'bold' },
  tagTextNormal: { color: '#64748b' },
  tagTextUrgent: { color: '#ef4444' },
  dateText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  historyTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  historyPreview: { fontSize: 12, color: '#64748b' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});