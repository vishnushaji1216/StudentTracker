import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  BackHandler,
  Platform,
  Linking,
  UIManager,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar"; 

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function StudentProfileScreen({ navigation }) {
  // --- STATE: Sidebar ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE: Data ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState({
    profile: { name: "", className: "", rollNo: "", initials: "", profilePic: null, fees: [], isFeeLocked: false },
    siblings: [],
    teachers: []
  });

  // Handle Android Back Button
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

  // Fetch Data on Focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      const data = response.data;
      
      data.profile.initials = data.profile.name ? data.profile.name.substring(0, 2).toUpperCase() : "ST";
      
      if (data.siblings) {
        data.siblings = data.siblings.map(s => ({
            ...s,
            initials: s.name ? s.name.substring(0, 2).toUpperCase() : "SB"
        }));
      }

      setProfileData(data);
    } catch (error) {
      console.log("Profile fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
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
      // Audio logic placeholder
      alert("Check Dashboard for Audio Tasks");
  };

  const handleSwitchAccount = async (siblingId) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/switch', { targetId: siblingId });
      const { token, user } = response.data;

      await AsyncStorage.multiSet([
        ["token", token],
        ["user", JSON.stringify(user)],
        ["role", user.role || 'parent']
      ]);

      navigation.reset({
        index: 0,
        routes: [{ name: 'StudentDash' }],
      });
      
    } catch (error) {
      console.error("Switching Failed:", error);
      Alert.alert("Error", "Failed to switch account. Please try again.");
      setLoading(false);
    }
  };

  const openWhatsApp = (phone) => {
    let url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  const openDialer = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: "#F8FAFC"}}>
          <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const { profile, siblings, teachers } = profileData;
  const pendingFees = profile.fees || [];
  const totalDue = pendingFees.reduce((sum, item) => sum + item.remainingAmount, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- REUSABLE SIDEBAR --- */}
      <StudentSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeRoute="" 
        userInfo={profile}
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
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.contentPadding}>
            
            {/* 1. Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>{profile.initials}</Text>
              </View>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileClass}>{profile.className} • Roll No. {profile.rollNo}</Text>
              
              {/* App Lock Status Indicator */}
              {profile.isFeeLocked && (
                  <View style={styles.lockedBadge}>
                      <FontAwesome5 name="lock" size={10} color="#dc2626" />
                      <Text style={styles.lockedText}>APP ACCESS RESTRICTED</Text>
                  </View>
              )}
            </View>

            {/* 2. FEE STATUS SECTION (NEW) */}
            <Text style={styles.sectionTitle}>FINANCIAL STATUS</Text>
            {pendingFees.length > 0 ? (
                <View style={styles.feeCard}>
                    <View style={styles.feeHeader}>
                        <Text style={styles.feeLabel}>TOTAL DUE</Text>
                        <Text style={styles.feeTotal}>₹{totalDue.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.feeDivider} />
                    
                    {pendingFees.map((fee, index) => (
                        <View key={index} style={styles.feeRow}>
                            <View style={{flex: 1}}>
                                <Text style={styles.feeTitle}>{fee.title}</Text>
                                <Text style={styles.feeDate}>Due: {new Date(fee.dueDate).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.feeAmount}>₹{fee.remainingAmount}</Text>
                        </View>
                    ))}

                    <View style={styles.warningBox}>
                        <FontAwesome5 name="exclamation-circle" size={12} color="#b45309" />
                        <Text style={styles.warningText}>Please clear dues to avoid interruptions.</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.feeCleanCard}>
                    <FontAwesome5 name="check-circle" size={24} color="#10b981" />
                    <View>
                        <Text style={styles.feeCleanTitle}>All Clear!</Text>
                        <Text style={styles.feeCleanSub}>No pending fees at this moment.</Text>
                    </View>
                </View>
            )}

            {/* 3. Sibling Switcher */}
            {siblings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>SWITCH ACCOUNT</Text>
                <View style={styles.siblingCard}>
                  {/* Current Active */}
                  <View style={styles.siblingRowActive}>
                    <View style={styles.siblingLeft}>
                      <View style={[styles.miniAvatar, { backgroundColor: '#e0e7ff' }]}>
                        <Text style={[styles.miniAvatarText, { color: '#4f46e5' }]}>{profile.initials}</Text>
                      </View>
                      <Text style={styles.siblingNameActive}>{profile.name} (You)</Text>
                    </View>
                    <FontAwesome5 name="check-circle" solid size={16} color="#4f46e5" />
                  </View>

                  {/* Other Siblings */}
                  {siblings.map((sibling) => (
                    <TouchableOpacity 
                      key={sibling._id} 
                      style={styles.siblingRow}
                      onPress={() => handleSwitchAccount(sibling._id)}
                    >
                      <View style={styles.siblingLeft}>
                        <View style={[styles.miniAvatar, { backgroundColor: '#f1f5f9' }]}>
                          <Text style={[styles.miniAvatarText, { color: '#64748b' }]}>{sibling.initials}</Text>
                        </View>
                        <View>
                          <Text style={styles.siblingName}>{sibling.name}</Text>
                          <Text style={styles.siblingClass}>{sibling.className}</Text>
                        </View>
                      </View>
                      <View style={styles.switchBadge}>
                        <Text style={styles.switchText}>Switch</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* 4. My Teachers */}
            <Text style={styles.sectionTitle}>MY TEACHERS</Text>
            <View style={styles.teacherList}>
              {teachers.length > 0 ? teachers.map((teacher) => (
                <View key={teacher.id} style={styles.teacherCard}>
                  <View style={styles.teacherLeft}>
                    <View style={[styles.teacherImg, { backgroundColor: '#f1f5f9', justifyContent:'center', alignItems:'center' }]}>
                          <FontAwesome5 name="user" size={16} color="#94a3b8" />
                    </View>
                    <View>
                      <Text style={styles.teacherNameCard}>{teacher.name}</Text>
                      {teacher.role === 'Class Teacher' ? (
                        <View style={styles.ctBadge}>
                          <Text style={styles.ctText}>CLASS TEACHER</Text>
                        </View>
                      ) : (
                        <Text style={styles.stText}>{teacher.subject}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.contactRow}>
                    <TouchableOpacity 
                      style={[styles.contactBtn, styles.waBtn]}
                      onPress={() => openWhatsApp(teacher.mobile)}
                    >
                      <FontAwesome5 name="whatsapp" size={14} color="#16a34a" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.contactBtn, styles.callBtn]}
                      onPress={() => openDialer(teacher.mobile)}
                    >
                      <FontAwesome5 name="phone-alt" size={12} color="#4f46e5" />
                    </TouchableOpacity>
                  </View>
                </View>
              )) : (
                 <Text style={styles.emptyText}>No teachers assigned yet.</Text>
              )}
            </View>

            {/* 5. Logout */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
               <FontAwesome5 name="sign-out-alt" size={14} color="#ef4444" />
               <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Stella App v1.0.0</Text>

          </View>
        </ScrollView>

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

  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },

  /* Profile Card */
  profileCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 4, borderColor: '#eef2ff' },
  avatarTextLarge: { fontSize: 28, fontWeight: 'bold', color: '#4f46e5' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  profileClass: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
  lockedText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },

  /* Section Title */
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },

  /* NEW: FEE STATUS STYLES */
  feeCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 24 },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feeLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  feeTotal: { fontSize: 18, fontWeight: '800', color: '#dc2626' },
  feeDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  feeTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  feeDate: { fontSize: 11, color: '#94a3b8' },
  feeAmount: { fontSize: 14, fontWeight: 'bold', color: '#dc2626' },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', padding: 10, borderRadius: 8, marginTop: 4 },
  warningText: { fontSize: 11, color: '#b45309', fontWeight: '500', flex: 1 },
  
  feeCleanCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#f0fdf4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#dcfce7', marginBottom: 24 },
  feeCleanTitle: { fontSize: 14, fontWeight: 'bold', color: '#15803d' },
  feeCleanSub: { fontSize: 12, color: '#166534' },

  /* Sibling Switcher */
  siblingCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, overflow: 'hidden' },
  siblingRowActive: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#eef2ff', borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  siblingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  siblingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontSize: 12, fontWeight: 'bold' },
  siblingNameActive: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  siblingName: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  siblingClass: { fontSize: 10, color: '#94a3b8' },
  switchBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  switchText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },

  /* Teacher List */
  teacherList: { gap: 12, marginBottom: 24 },
  teacherCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e0e7ff', shadowColor: '#4f46e5', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  teacherLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  teacherNameCard: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  ctBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 2 },
  ctText: { fontSize: 8, fontWeight: 'bold', color: '#4f46e5' },
  stText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  
  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  waBtn: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  callBtn: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  
  emptyText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 12 },

  /* Logout */
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  signOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  versionText: { textAlign: 'center', fontSize: 10, color: '#94a3b8' },
});