import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  LayoutAnimation,
  UIManager,
  ScrollView,
  Dimensions,
  Easing
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

export default function AudioRecorderScreen({ navigation }) {
  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Student Info (Mock)
  const [studentName, setStudentName] = useState("Arjun");
  const [className, setClassName] = useState("Class 9-A");

  // Recorder State: 'idle' | 'recording' | 'review' | 'submitted'
  const [recorderState, setRecorderState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // For review playback

  // Timer Ref
  const timerRef = useRef(null);

  // Handle Android Back Button
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

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
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

  // --- RECORDER LOGIC ---

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecorderState('recording');
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    clearInterval(timerRef.current);
    setRecorderState('review');
  };

  const retakeRecording = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecorderState('idle');
    setDuration(0);
    setIsPlaying(false);
  };

  const submitRecording = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecorderState('submitted');
    // Simulate API call
    setTimeout(() => {
       navigation.navigate('StudentDash');
    }, 1500);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

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
                        <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')} />
                        
                        {/* <View style={styles.menuDivider} />
                        <Text style={styles.menuSectionLabel}>ACADEMICS</Text> */}
                        
                        <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')}/>
                        <SidebarItem icon="microphone" label="Daily Audio" active onPress={() => toggleSidebar()}/>
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
            <Text style={styles.headerTitle}>Daily Audio</Text>
          </View>
        </View>

        <View style={styles.content}>
          
          {/* Task Info Card */}
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
               <Text style={styles.taskLabel}>TODAY'S TASK</Text>
               <View style={styles.dueBadge}>
                  <FontAwesome5 name="clock" size={10} color="#4f46e5" />
                  <Text style={styles.dueText}>Due 10:00 PM</Text>
               </View>
            </View>
            <Text style={styles.taskTitle}>Recitation: The Daffodils</Text>
            <Text style={styles.taskSub}>Stanza 1 & 2 • English</Text>
          </View>

          {/* RECORDER AREA */}
          <View style={styles.recorderContainer}>
            
            {/* SUCCESS STATE */}
            {recorderState === 'submitted' ? (
              <View style={styles.successState}>
                 <View style={styles.successIcon}>
                    <FontAwesome5 name="check" size={40} color="#fff" />
                 </View>
                 <Text style={styles.successTitle}>Sent Successfully!</Text>
                 <Text style={styles.successSub}>Your teacher will review it soon.</Text>
              </View>
            ) : (
              <>
                {/* Timer Display */}
                <Text style={[styles.timerText, recorderState === 'recording' && styles.timerActive]}>
                   {formatTime(duration)}
                </Text>

                {/* VISUALIZER (Bars) */}
                <View style={styles.waveform}>
                   {[...Array(15)].map((_, i) => (
                      <WaveBar key={i} isActive={recorderState === 'recording' || (recorderState === 'review' && isPlaying)} index={i} />
                   ))}
                </View>

                {/* Status Text */}
                <Text style={styles.statusText}>
                  {recorderState === 'idle' ? 'Tap to Record' : 
                   recorderState === 'recording' ? 'Recording...' : 'Review your clip'}
                </Text>

                {/* CONTROLS */}
                <View style={styles.controlsRow}>
                  
                  {/* IDLE STATE */}
                  {recorderState === 'idle' && (
                     <TouchableOpacity 
                       style={styles.recordBtnLarge} 
                       onPress={startRecording}
                       activeOpacity={0.8}
                     >
                        <FontAwesome5 name="microphone" size={32} color="#fff" />
                     </TouchableOpacity>
                  )}

                  {/* RECORDING STATE */}
                  {recorderState === 'recording' && (
                     <TouchableOpacity 
                       style={styles.stopBtnLarge} 
                       onPress={stopRecording}
                       activeOpacity={0.8}
                     >
                        <View style={styles.stopSquare} />
                     </TouchableOpacity>
                  )}

                  {/* REVIEW STATE (The specific request) */}
                  {recorderState === 'review' && (
                     <View style={styles.reviewControls}>
                        
                        {/* Retake */}
                        <TouchableOpacity style={styles.actionBtnSmall} onPress={retakeRecording}>
                           <FontAwesome5 name="trash-alt" size={18} color="#ef4444" />
                           <Text style={[styles.actionLabel, { color: '#ef4444' }]}>Retake</Text>
                        </TouchableOpacity>

                        {/* Play/Pause */}
                        <TouchableOpacity style={styles.playBtn} onPress={togglePlayback}>
                           <FontAwesome5 name={isPlaying ? "pause" : "play"} size={24} color="#fff" style={{ marginLeft: isPlaying ? 0 : 4 }} />
                        </TouchableOpacity>

                        {/* Submit */}
                        <TouchableOpacity style={styles.actionBtnSmall} onPress={submitRecording}>
                           <FontAwesome5 name="paper-plane" size={18} color="#4f46e5" />
                           <Text style={[styles.actionLabel, { color: '#4f46e5' }]}>Submit</Text>
                        </TouchableOpacity>

                     </View>
                  )}

                </View>
              </>
            )}

          </View>

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

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentProfile')}>
            <FontAwesome5 name="user" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

/* --- SUB-COMPONENTS --- */

const WaveBar = ({ isActive, index }) => {
  const heightAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heightAnim, {
            toValue: Math.random() * 30 + 10,
            duration: 200 + index * 20,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(heightAnim, {
            toValue: 10,
            duration: 200 + index * 20,
            easing: Easing.linear,
            useNativeDriver: false,
          })
        ])
      ).start();
    } else {
      heightAnim.stopAnimation();
      heightAnim.setValue(10);
    }
  }, [isActive]);

  return (
    <Animated.View
      style={{
        width: 4,
        height: heightAnim,
        backgroundColor: isActive ? '#4f46e5' : '#cbd5e1',
        borderRadius: 2,
        marginHorizontal: 2
      }}
    />
  );
};

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
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },

  /* Content */
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },

  /* Task Card */
  taskCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dueText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },
  taskTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  taskSub: { fontSize: 14, color: '#64748b', marginTop: 2 },

  /* Recorder Area */
  recorderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 48, fontWeight: 'bold', color: '#1e293b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 30 },
  timerActive: { color: '#ef4444' },
  waveform: { flexDirection: 'row', alignItems: 'center', height: 60, gap: 4, marginBottom: 40 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },

  /* Controls */
  controlsRow: { alignItems: 'center', justifyContent: 'center' },
  
  recordBtnLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  stopBtnLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  stopSquare: { width: 24, height: 24, backgroundColor: '#fff', borderRadius: 4 },

  /* Review Controls */
  reviewControls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionBtnSmall: { alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 10, fontWeight: 'bold' },

  /* Success State */
  successState: { alignItems: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  successSub: { fontSize: 14, color: '#64748b' },

  /* Bottom Nav */
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});