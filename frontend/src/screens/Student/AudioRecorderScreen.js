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
  ActivityIndicator,
  Alert
} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function AudioRecorderScreen({ navigation, route }) {
  // --- PARAMS ---
  const assignmentId = route.params?.assignmentId;
  const taskTitle = route.params?.taskTitle || "Audio Assignment";
  const passedSubmission = route.params?.submission;

  const hasActiveTask = !!assignmentId || !!passedSubmission;

  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPath, setAudioPath] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [loadingTask, setLoadingTask] = useState(hasActiveTask); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  
  // Timer & Anim
  const [recordDuration, setRecordDuration] = useState(0); 
  const [playbackTime, setPlaybackTime] = useState(0);     
  const timerInterval = useRef(null);
  const soundRef = useRef(null);
  
  // Visuals
  const waveAnims = useRef([...Array(6)].map(() => new Animated.Value(10))).current; // Reduced bars for cleaner look
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current;

  // --- INITIALIZATION ---
  useEffect(() => {
    if (hasActiveTask) {
        const options = {
          sampleRate: 16000,
          channels: 1,
          bitsPerSample: 16,
          audioSource: 6,
          wavFile: 'test.wav'
        };
        AudioRecord.init(options);
        Sound.setCategory('Playback');
        checkSubmissionStatus();
    }
    return () => {
      stopTimer();
      stopWaveAnimation();
      if (soundRef.current) soundRef.current.release();
    };
  }, [assignmentId]);

  // --- FETCH STATUS ---
  const checkSubmissionStatus = async () => {
    try {
      if (passedSubmission) {
        handleExistingSubmission(passedSubmission);
        return;
      }
      const response = await api.get(`/student/assignments/${assignmentId}/status`);
      if (response.data?.submission) {
        handleExistingSubmission(response.data.submission);
      } else {
        setLoadingTask(false);
      }
    } catch (error) {
      console.log("Status check failed:", error);
      setLoadingTask(false);
    }
  };

  const handleExistingSubmission = (submission) => {
    setIsSubmitted(true);
    const fullUrl = submission.fileUrl.startsWith('http') 
        ? submission.fileUrl 
        : `${api.defaults.baseURL.replace('/api', '')}${submission.fileUrl}`;
    setAudioPath(fullUrl);
    setLoadingTask(false);
  };

  // --- WAVEFORM ANIMATION ---
  const startWaveAnimation = () => {
    Animated.loop(
      Animated.stagger(150, waveAnims.map(anim => Animated.sequence([
        Animated.timing(anim, { toValue: Math.random() * 50 + 20, duration: 250, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 10, duration: 250, useNativeDriver: false })
      ])))
    ).start();
  };
  const stopWaveAnimation = () => waveAnims.forEach(anim => anim.setValue(10));

  // --- TIMER LOGIC ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const startRecordTimer = () => {
    setRecordDuration(0);
    clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
  };

  const startPlaybackTimer = () => {
    setPlaybackTime(0);
    clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      if (soundRef.current && soundRef.current.isLoaded()) {
        soundRef.current.getCurrentTime((seconds) => setPlaybackTime(seconds));
      }
    }, 100);
  };
  const stopTimer = () => clearInterval(timerInterval.current);

  // --- RECORDING ---
  const onStartRecord = async () => {
    if (isSubmitted || !hasActiveTask) return; 

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showToast('Microphone permission denied', 'error');
        return;
      }
    }

    try {
      setAudioPath(null);
      AudioRecord.start();
      startRecordTimer();
      startWaveAnimation();
      setIsRecording(true);
      setIsPlaying(false);
    } catch (error) {
      console.log('Record Error:', error);
    }
  };

  const onStopRecord = async () => {
    if (!isRecording) return;
    try {
      const filePath = await AudioRecord.stop();
      stopTimer();
      stopWaveAnimation();
      setIsRecording(false);
      setAudioPath(filePath);
    } catch (error) {
      console.log('Stop Error:', error);
    }
  };

  // --- PLAYBACK ---
  const onStartPlay = () => {
    if (!audioPath) return;

    setIsPlaying(true);
    startPlaybackTimer();
    startWaveAnimation();

    soundRef.current = new Sound(audioPath, isSubmitted ? null : '', (error) => {
      if (error) {
        setIsPlaying(false);
        stopTimer();
        stopWaveAnimation();
        showToast('Failed to load audio', 'error');
        return;
      }
      if (isSubmitted) setRecordDuration(soundRef.current.getDuration());

      soundRef.current.play(() => {
        setIsPlaying(false);
        stopTimer();
        stopWaveAnimation();
        setPlaybackTime(recordDuration);
      });
    });
  };

  const onStopPlay = () => {
    if (soundRef.current) soundRef.current.stop();
    setIsPlaying(false);
    stopTimer();
    stopWaveAnimation();
  };

  // --- SUBMISSION ---
  const handleSubmit = async () => {
    if (!audioPath || isSubmitted || !hasActiveTask) return;

    setUploading(true);
    try {
      const formData = new FormData();
      
      // 1. Ensure path has file:// prefix (Android requirement)
      let uri = audioPath;
      if (Platform.OS === 'android' && !uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      // 2. Append File
      formData.append('file', {
        uri: uri,
        type: 'audio/wav', 
        name: `submission_${Date.now()}.wav`,
      });

      // 3. Append Other Data
      formData.append('assignmentId', assignmentId);
      formData.append('type', 'audio');

      // 4. LOG FOR DEBUGGING (Check your terminal!)
      console.log("Submitting Audio:", formData);

      // 5. THE FIX: Let Axios handle the Content-Type automatically!
      // Do NOT manually set 'Content-Type': 'multipart/form-data' here.
      // It breaks the boundary generation.
      await api.post('/student/submit', formData, {
        headers: {
            'Accept': 'application/json',
            // 'Content-Type': 'multipart/form-data', <--- DELETE THIS LINE
        },
        transformRequest: (data, headers) => {
            return data; // Fixes a common Axios bug with FormData
        },
      });

      showToast('Assignment submitted successfully!', 'success');
      setIsSubmitted(true);
      setTimeout(() => navigation.goBack(), 2000);
      
    } catch (error) {
      console.error("UPLOAD ERROR DETAILS:", error.response ? error.response.data : error.message);
      showToast('Failed to upload audio. Check logs.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
            <View /> 
            <Text style={styles.headerTitle}>Audio Task</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <FontAwesome5 name="times" size={18} color="#64748b" />
            </TouchableOpacity>
        </View>

        {loadingTask && (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading Assignment...</Text>
            </View>
        )}

        {/* ❌ NO TASK STATE */}
        {!loadingTask && !hasActiveTask && (
             <View style={styles.centerContainer}>
                 <View style={styles.emptyStateCard}>
                    <FontAwesome5 name="microphone-slash" size={32} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Task Selected</Text>
                    <Text style={styles.emptySub}>Please select a task from the dashboard.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                 </View>
             </View>
        )}

        {/* ✅ ACTIVE TASK STATE */}
        {!loadingTask && hasActiveTask && (
            <View style={styles.mainContent}>
                
                {/* 1. TASK INFO CARD */}
                <View style={styles.taskCard}>
                    <View style={styles.taskIconBox}>
                        <FontAwesome5 name="book-open" size={16} color="#4f46e5" />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={styles.taskLabel}>TOPIC TO RECORD</Text>
                        <Text style={styles.taskTitle}>{taskTitle}</Text>
                    </View>
                    {isSubmitted && <View style={styles.sentTag}><Text style={styles.sentText}>SENT</Text></View>}
                </View>

                {/* 2. DYNAMIC CONTENT AREA */}
                
                {/* STATE A: READY (Not recorded yet, not recording) */}
                {!isRecording && !audioPath && !isSubmitted && (
                    <View style={styles.stateContainer}>
                        <View style={styles.illustrationCircle}>
                             <FontAwesome5 name="microphone" size={40} color="#cbd5e1" />
                        </View>
                        <Text style={styles.instructionText}>Tap the button below to start recording your answer.</Text>
                        
                        <TouchableOpacity style={styles.startBtn} onPress={onStartRecord}>
                            <View style={styles.startBtnInner}>
                                <FontAwesome5 name="circle" solid size={14} color="#fff" />
                            </View>
                            <Text style={styles.startBtnText}>Start Recording</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* STATE B: RECORDING (Active) */}
                {isRecording && (
                    <View style={styles.stateContainer}>
                         <View style={styles.visualizerContainer}>
                            {waveAnims.map((anim, index) => (
                                <Animated.View key={index} style={[styles.bar, { height: anim }]} />
                            ))}
                         </View>
                         <Text style={styles.timerText}>{formatTime(recordDuration)}</Text>
                         <Text style={styles.recordingStatus}>Recording in progress...</Text>
                         
                         <TouchableOpacity style={styles.stopBtn} onPress={onStopRecord}>
                             <FontAwesome5 name="stop" size={20} color="#fff" />
                         </TouchableOpacity>
                    </View>
                )}

                {/* STATE C: REVIEW (Recorded, can play or submit) */}
                {!isRecording && audioPath && (
                    <View style={styles.stateContainer}>
                        {/* Visualizer (Green for playback) */}
                        <View style={styles.visualizerContainer}>
                            {waveAnims.map((anim, index) => (
                                <Animated.View key={index} style={[styles.bar, { height: anim, backgroundColor: '#10b981' }]} />
                            ))}
                        </View>
                        
                        <Text style={styles.timerText}>{formatTime(isPlaying ? playbackTime : recordDuration)}</Text>
                        <Text style={styles.recordingStatus}>{isPlaying ? "Playing Preview..." : "Recording Complete"}</Text>

                        <View style={styles.reviewControls}>
                             {/* Play/Pause */}
                             <TouchableOpacity style={styles.iconControlBtn} onPress={isPlaying ? onStopPlay : onStartPlay}>
                                 <FontAwesome5 name={isPlaying ? "pause" : "play"} size={18} color="#fff" />
                             </TouchableOpacity>

                             {/* Submit (Only if not submitted) */}
                             {!isSubmitted && (
                                <TouchableOpacity style={styles.submitPill} onPress={handleSubmit} disabled={uploading}>
                                    {uploading ? <ActivityIndicator color="#fff" size="small" /> : (
                                        <>
                                            <Text style={styles.submitText}>Submit</Text>
                                            <FontAwesome5 name="paper-plane" size={14} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                             )}
                        </View>
                        
                        {/* Discard Link */}
                        {!isSubmitted && (
                            <TouchableOpacity style={styles.discardBtn} onPress={() => { setAudioPath(null); setRecordDuration(0); }}>
                                <Text style={styles.discardText}>Discard & Record Again</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

            </View>
        )}
      </SafeAreaView>

      {/* TOAST */}
      {toast.visible && (
        <Animated.View style={[styles.toast, styles.toastSuccess, { transform: [{ translateY: toastAnim }] }]}>
           <FontAwesome5 name="check-circle" size={16} color="#fff" />
           <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748b' },
  
  /* Empty State */
  emptyStateCard: { alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 10 },
  emptySub: { color: '#64748b', marginTop: 5, marginBottom: 20 },
  backBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },

  /* Main Content */
  mainContent: { flex: 1, padding: 20, alignItems: 'center' },
  
  /* Task Card */
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, width: '100%', marginBottom: 40, borderWidth: 1, borderColor: '#e2e8f0' },
  taskIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sentTag: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sentText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  /* State Container */
  stateContainer: { alignItems: 'center', width: '100%' },
  
  /* Ready State */
  illustrationCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 4, borderColor: '#f1f5f9' },
  instructionText: { textAlign: 'center', color: '#64748b', marginBottom: 30, maxWidth: '80%' },
  startBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, gap: 10, elevation: 5, shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 8 },
  startBtnInner: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  /* Recording State */
  visualizerContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 60, marginBottom: 20 },
  bar: { width: 8, backgroundColor: '#ef4444', borderRadius: 4 },
  timerText: { fontSize: 48, fontWeight: 'bold', color: '#1e293b', fontVariant: ['tabular-nums'] },
  recordingStatus: { color: '#64748b', marginBottom: 30 },
  stopBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', elevation: 5 },

  /* Review State */
  reviewControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  iconControlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  submitPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  discardBtn: { marginTop: 30, padding: 10 },
  discardText: { color: '#ef4444', fontWeight: 'bold' },

  /* Toast */
  toast: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastText: { color: '#fff', fontWeight: 'bold' },
});