import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(280, width * 0.8);

export default function AudioRecorderScreen({ navigation, route }) {
  // --- REFS (Lazy Init) ---
  // We initialize the player inside a ref to prevent top-level crashes
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [audioPath, setAudioPath] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Sidebar State
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current;

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      // Stop everything when leaving the screen
      try {
        audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removeRecordBackListener();
        audioRecorderPlayer.removePlayBackListener();
      } catch (e) {
        console.log("Cleanup error (harmless):", e);
      }
    };
  }, []);

  // Handle Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        toggleSidebar();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- TOAST FUNCTION ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2500);
  };

  // --- SIDEBAR FUNCTIONS ---
  const toggleSidebar = () => {
    const isOpen = !isSidebarOpen;
    setIsSidebarOpen(isOpen);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isOpen ? 0 : -SIDEBAR_WIDTH, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: isOpen ? 1 : 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleNav = (screen) => {
    toggleSidebar();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "role"]);
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  // --- RECORDER LOGIC ---
  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }
        showToast('Microphone permission required', 'error');
        return false;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const onStartRecord = async () => {
    const hasPermission = await checkPermissions();
    if (!hasPermission) return;

    try {
      const result = await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
      });
      setAudioPath(result);
      setIsRecording(true);
      setIsPlaying(false);
    } catch (error) {
      console.log("Record Error:", error);
      showToast('Failed to start recording', 'error');
    }
  };

  const onStopRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setAudioPath(result);
    } catch (error) {
      console.log('Stop Record Error:', error);
    }
  };

  const onStartPlay = async () => {
    if (!audioPath) return;
    try {
      await audioRecorderPlayer.startPlayer(audioPath);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          onStopPlay();
        }
        setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
        setDuration(audioRecorderPlayer.mmssss(Math.floor(e.duration)));
      });
      setIsPlaying(true);
    } catch (error) {
      showToast('Playback failed', 'error');
    }
  };

  const onStopPlay = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setIsPlaying(false);
      setPlayTime('00:00');
    } catch (error) {
      console.log('Stop Play Error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!audioPath) return;
    setUploading(true);
    try {
      const formData = new FormData();
      const fileType = Platform.OS === 'android' ? 'audio/mp4' : 'audio/m4a';
      const fileName = `audio_submission_${Date.now()}.mp4`;

      formData.append('file', {
        uri: audioPath,
        type: fileType,
        name: fileName,
      });
      
      const assignmentId = route.params?.assignmentId || 'GENERAL_SUBMISSION'; 
      formData.append('assignmentId', assignmentId);
      formData.append('type', 'audio');

      await api.post('/student/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Assignment submitted successfully!', 'success');
      setTimeout(() => navigation.goBack(), 2000);

    } catch (error) {
      console.error('Upload Error:', error);
      showToast('Failed to upload audio', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
      
      {/* SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
           <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSidebar} />
        </Animated.View>
      )}

      {/* SIDEBAR DRAWER */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.sidebarSafeArea}>
            <View style={styles.sidebarHeader}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>ST</Text>
                </View>
                <Text style={styles.sidebarName}>Student Menu</Text>
            </View>

            <ScrollView style={{ marginTop: 20 }}>
                <SidebarItem icon="home" label="Home" onPress={() => handleNav('StudentDash')} />
                <SidebarItem icon="chart-bar" label="Academic Stats" onPress={() => handleNav('StudentStats')} />
                <SidebarItem icon="folder-open" label="Resource Library" onPress={() => handleNav('StudentResource')} />
                <SidebarItem icon="list-ol" label="Quiz Center" onPress={() => handleNav('StudentQuizCenter')} />
                <SidebarItem icon="microphone" label="Audio Recorder" active />
            </ScrollView>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* MAIN CONTENT */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.iconBtn}>
              <FontAwesome5 name="bars" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audio Recorder</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.timerContainer}>
           <View style={[styles.pulseCircle, isRecording && styles.pulseActive]}>
              <FontAwesome5 name={isPlaying ? "play" : "microphone"} size={40} color="#fff" />
           </View>
           <Text style={styles.timerText}>
              {isRecording ? recordTime : (isPlaying ? playTime : (audioPath ? "Recorded" : "00:00"))}
           </Text>
           <Text style={styles.statusText}>
              {isRecording ? "Recording in progress..." : (isPlaying ? "Playing preview..." : (audioPath ? "Ready to submit" : "Tap mic to start"))}
           </Text>
        </View>

        <View style={styles.controlsContainer}>
            {!isPlaying && (
              <TouchableOpacity 
                style={[styles.recordBtn, isRecording && styles.stopBtn]} 
                onPress={isRecording ? onStopRecord : onStartRecord}
                disabled={uploading}
              >
                 <FontAwesome5 name={isRecording ? "stop" : "microphone"} size={24} color={isRecording ? "#ef4444" : "#fff"} />
              </TouchableOpacity>
            )}
            {!isRecording && audioPath && (
               <TouchableOpacity style={styles.playBtn} onPress={isPlaying ? onStopPlay : onStartPlay} disabled={uploading}>
                  <FontAwesome5 name={isPlaying ? "stop" : "play"} size={20} color="#fff" />
                  <Text style={styles.btnLabel}>{isPlaying ? "Stop" : "Preview"}</Text>
               </TouchableOpacity>
            )}
        </View>

        {audioPath && !isRecording && !isPlaying && (
           <View style={styles.footer}>
              <TouchableOpacity style={[styles.submitBtn, uploading && styles.disabledBtn]} onPress={handleSubmit} disabled={uploading}>
                 {uploading ? (
                    <ActivityIndicator color="#fff" />
                 ) : (
                    <>
                      <FontAwesome5 name="paper-plane" size={16} color="#fff" />
                      <Text style={styles.submitText}>Submit Homework</Text>
                    </>
                 )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setAudioPath(null); setRecordTime('00:00'); }} disabled={uploading}>
                 <Text style={styles.retryText}>Discard & Try Again</Text>
              </TouchableOpacity>
           </View>
        )}
      </SafeAreaView>

      {/* TOAST */}
      {toast.visible && (
        <Animated.View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: toastAnim }] }]}>
           <FontAwesome5 name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} size={16} color="#fff" />
           <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const SidebarItem = ({ icon, label, onPress, active }) => (
  <TouchableOpacity style={[styles.sidebarItem, active && styles.sidebarItemActive]} onPress={onPress}>
    <View style={{ width: 30, alignItems: 'center' }}>
        <FontAwesome5 name={icon} size={16} color={active ? "#4f46e5" : "#64748b"} />
    </View>
    <Text style={[styles.sidebarItemText, active && { color: "#4f46e5", fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1b4b' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 8 },
  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4338ca', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#6366f1' },
  pulseActive: { backgroundColor: '#ef4444', borderColor: '#f87171' },
  timerText: { color: '#fff', fontSize: 48, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  statusText: { color: '#a5b4fc', marginTop: 8, fontSize: 14 },
  controlsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, paddingBottom: 50 },
  recordBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#4f46e5', shadowOpacity: 0.5, shadowRadius: 10 },
  stopBtn: { backgroundColor: '#fff' },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  btnLabel: { color: '#fff', fontWeight: 'bold' },
  footer: { padding: 24, paddingBottom: 40 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  retryBtn: { alignItems: 'center', paddingVertical: 12 },
  retryText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100 },
  sidebar: { position: "absolute", left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: "#fff", zIndex: 101, elevation: 20 },
  sidebarSafeArea: { flex: 1 },
  sidebarHeader: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarTextLarge: { fontSize: 20, fontWeight: 'bold', color: '#4f46e5' },
  sidebarName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  sidebarItemActive: { backgroundColor: '#eef2ff', borderRightWidth: 4, borderRightColor: '#4f46e5' },
  sidebarItemText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginLeft: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  toast: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

