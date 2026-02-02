import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Dimensions 
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

export default function StudentSidebar({
  isOpen,
  onClose,
  navigation,
  activeRoute, // e.g. 'StudentDash', 'StudentStats'
  userInfo,    // { name, className, initials, profilePic }
  onLogout,
  onAudioPress // Callback for the "Daily Audio" button
}) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // --- ANIMATION LOGIC ---
  useEffect(() => {
    if (isOpen) {
      // OPEN
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      // CLOSE
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleNav = (screen) => {
    onClose();
    // Small delay to allow sidebar to start closing before navigation transition
    setTimeout(() => navigation.navigate(screen), 100);
  };

  return (
    <>
      {/* --- OVERLAY --- */}
      <Animated.View 
        pointerEvents={isOpen ? "auto" : "none"}
        style={[
          styles.overlay, 
          { opacity: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }
        ]}
      >
         <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.sidebarSafeArea}>
            <View style={styles.sidebarContainer}>
                <View style={{flex: 1}}>
                    
                    {/* Header */}
                    <View style={styles.sidebarHeader}>
                        {userInfo?.profilePic ? (
                          <Image source={{ uri: userInfo.profilePic }} style={styles.avatarLarge} />
                        ) : (
                          <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>{userInfo?.initials || 'ST'}</Text>
                          </View>
                        )}
                        <View>
                            <Text style={styles.sidebarName}>{userInfo?.name || 'Student'}</Text>
                            <Text style={styles.sidebarClass}>{userInfo?.className || 'Class'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto', padding: 5 }}>
                           <FontAwesome5 name="times" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView style={styles.menuScroll} contentContainerStyle={{paddingBottom: 20}}>
                        <SidebarItem 
                            icon="home" 
                            label="Home" 
                            active={activeRoute === 'StudentDash'}
                            onPress={() => handleNav('StudentDash')} 
                        />
                        <SidebarItem 
                            icon="chart-bar" 
                            label="Academic Stats" 
                            active={activeRoute === 'StudentStats'}
                            onPress={() => handleNav('StudentStats')}
                        />
                        <SidebarItem 
                            icon="folder-open" 
                            label="Resource Library" 
                            active={activeRoute === 'StudentResource'}
                            onPress={() => handleNav('StudentResource')} 
                        />
                        <SidebarItem 
                            icon="list-ol" 
                            label="Quiz Center" 
                            active={activeRoute === 'StudentQuizCenter'}
                            onPress={() => handleNav('StudentQuizCenter')}
                        />
                        
                        {/* Dynamic Audio Item */}
                        <SidebarItem 
                            icon="microphone" 
                            label="Daily Audio" 
                            active={activeRoute === 'AudioRecorder'}
                            onPress={() => {
                                onClose();
                                setTimeout(() => { if (onAudioPress) onAudioPress(); }, 100);
                            }}
                        />

                        <SidebarItem 
                            icon="bullhorn" 
                            label="Notice" 
                            active={activeRoute === 'StudentNoticeBoard'}
                            onPress={() => handleNav('StudentNoticeBoard')} 
                        />
                    </ScrollView>
                </View>

                {/* Footer */}
                <View style={styles.sidebarFooter}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                        <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

// --- SUB-COMPONENT ---
const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <View style={{ width: 30, alignItems: 'center' }}>
        <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} />
    </View>
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES ---
const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 101, elevation: 20 },
  sidebarSafeArea: { flex: 1, backgroundColor: '#fff' },
  sidebarContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between' },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
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
});