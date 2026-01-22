import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform,
  LayoutAnimation,
  UIManager,
  Easing,
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Sound from 'react-native-sound';
import TeacherSidebar from "../../components/TeacherSidebar"; // <--- IMPORTED
import api from "../../services/api"; // <--- IMPORTED

// Enable LayoutAnimation
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Predefined Tags for Audio Grading
const FEEDBACK_TAGS = ["Clear Voice", "Good Pace", "Expressive", "Monotone", "Background Noise", "Too Fast"];

export default function AudioReviewScreen({ navigation }) {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  
  // Player State
  const [expandedId, setExpandedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const soundRef = useRef(null);
  const timerRef = useRef(null);

  // Grading State
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchQueue();
    return () => {
      stopAudio(); // Cleanup on unmount
    };
  }, []);

  // --- BACK HANDLER ---
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- API: FETCH QUEUE ---
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/queue/audio');
      // Backend returns array of { id, name, fileUrl, title, ... }
      setQueue(response.data);
    } catch (error) {
      console.error("Fetch Queue Error:", error);
      Alert.alert("Error", "Failed to load audio queue");
    } finally {
      setLoading(false);
    }
  };

  // --- API: SUBMIT GRADE ---
  const submitReview = async (item) => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please give a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/log/audio', {
        submissionId: item.submissionId,
        rating,
        tags: selectedTags,
        feedback
      });

      // Remove from UI
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setQueue(prev => prev.filter(q => q.submissionId !== item.submissionId));
      setExpandedId(null);
      stopAudio();

    } catch (error) {
      console.error("Submit Error:", error);
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // --- PLAYER LOGIC ---
  const handleCardPress = (id, fileUrl) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Stop any playing audio
    stopAudio();

    if (expandedId === id) {
      setExpandedId(null); // Collapse
    } else {
      setExpandedId(id); // Expand
      setRating(0); // Reset Grading Form
      setSelectedTags([]);
      setFeedback("");
      loadAudio(fileUrl);
    }
  };

  const loadAudio = (url) => {
    if (!url) return;
    
    // Ensure full URL if relative path stored in DB
    const fullUrl = url.startsWith('http') ? url : `${api.defaults.baseURL.replace('/api', '')}${url}`;

    const sound = new Sound(fullUrl, null, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
      setDuration(sound.getDuration());
    });
    soundRef.current = sound;
  };

  const togglePlayback = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
      clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      soundRef.current.play((success) => {
        if (success) {
          setIsPlaying(false);
          setCurrentTime(0);
          clearInterval(timerRef.current);
        } else {
          console.log('playback failed due to audio decoding errors');
        }
      });

      // Update timer
      timerRef.current = setInterval(() => {
        soundRef.current.getCurrentTime((seconds) => {
          setCurrentTime(seconds);
        });
      }, 250);
    }
  };

  const stopAudio = () => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
    }
    soundRef.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
    clearInterval(timerRef.current);
  };

  // --- HELPERS ---
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- REUSABLE SIDEBAR --- */}
      <TeacherSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeItem="AudioReview"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Audio Queue</Text>
              <Text style={styles.headerSub}>PENDING REVIEWS ({queue.length})</Text>
            </View>
          </View>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={{ paddingBottom: 100 }} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentPadding}>
              
              {queue.length === 0 ? (
                 <View style={styles.emptyState}>
                    <FontAwesome5 name="check-circle" size={40} color="#cbd5e1" />
                    <Text style={styles.emptyText}>All caught up! No pending audio.</Text>
                 </View>
              ) : (
                queue.map((item) => (
                  <View key={item.id} style={styles.cardWrapper}>
                    
                    {/* --- EXPANDED CARD (ACTIVE PLAYER) --- */}
                    {expandedId === item.id ? (
                      <View style={styles.expandedCard}>
                        
                        {/* Header */}
                        <TouchableOpacity style={styles.expandedHeader} onPress={() => handleCardPress(item.id, item.fileUrl)} activeOpacity={1}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={[styles.avatarBox, { backgroundColor: '#e0e7ff' }]}>
                              <Text style={[styles.avatarText, { color: '#4f46e5' }]}>{item.initials}</Text>
                            </View>
                            <View>
                              <Text style={styles.studentNameBig}>{item.name}</Text>
                              <Text style={styles.poemTitle}>{item.title}</Text>
                            </View>
                          </View>
                          {isPlaying && (
                            <View style={styles.playingBadge}>
                              <Text style={styles.playingText}>PLAYING</Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Player Controls */}
                        <View style={styles.playerBody}>
                          
                          {/* Visualizer */}
                          <View style={styles.waveformContainer}>
                            {[...Array(15)].map((_, i) => (
                              <WaveBar key={i} index={i} isPlaying={isPlaying} />
                            ))}
                          </View>
                          
                          <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <View style={styles.controls}>
                              <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayback}>
                                <FontAwesome5 name={isPlaying ? "pause" : "play"} size={14} color="#fff" />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                          </View>

                          {/* --- GRADING SECTION --- */}
                          <View style={styles.gradingSection}>
                            <Text style={styles.sectionLabel}>GRADE</Text>
                            
                            {/* Stars */}
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <FontAwesome5 
                                            name="star" 
                                            solid={star <= rating} 
                                            size={24} 
                                            color={star <= rating ? "#fbbf24" : "#e2e8f0"} 
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Tags */}
                            <Text style={styles.sectionLabel}>QUICK TAGS</Text>
                            <View style={styles.tagsRow}>
                                {FEEDBACK_TAGS.map((tag) => (
                                    <TouchableOpacity 
                                        key={tag} 
                                        style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                                        onPress={() => toggleTag(tag)}
                                    >
                                        <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Feedback Input */}
                            <TextInput 
                                style={styles.feedbackInput}
                                placeholder="Additional comments..."
                                value={feedback}
                                onChangeText={setFeedback}
                                multiline
                            />

                            {/* Submit Button */}
                            <TouchableOpacity 
                                style={styles.submitBtn} 
                                onPress={() => submitReview(item)}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <FontAwesome5 name="check-circle" size={16} color="#fff" />
                                        <Text style={styles.submitBtnText}>Submit Review</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                          </View>

                        </View>
                      </View>
                    ) : (
                      
                      /* --- COLLAPSED CARD (PENDING) --- */
                      <TouchableOpacity 
                        style={styles.collapsedCard} 
                        onPress={() => handleCardPress(item.id, item.fileUrl)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.avatarBox, { backgroundColor: '#f1f5f9' }]}>
                            <Text style={[styles.avatarText, { color: '#64748b' }]}>{item.initials}</Text>
                          </View>
                          <View>
                            <Text style={styles.studentName}>{item.name}</Text>
                            <Text style={styles.miniDetails}>{item.title} • {new Date(item.submittedAt).toLocaleDateString()}</Text>
                          </View>
                        </View>
                        <FontAwesome5 name="play" size={14} color="#4f46e5" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}

            </View>
          </ScrollView>
        )}

      </SafeAreaView>
    </View>
  );
}

/* --- WAVEFORM VISUALIZER COMPONENT --- */
const WaveBar = ({ isPlaying, index }) => {
  const heightAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heightAnim, {
            toValue: Math.random() * 20 + 10,
            duration: 200 + index * 10,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(heightAnim, {
            toValue: 10,
            duration: 200 + index * 10,
            easing: Easing.linear,
            useNativeDriver: false,
          })
        ])
      ).start();
    } else {
      heightAnim.stopAnimation();
      heightAnim.setValue(10);
    }
  }, [isPlaying]);

  return (
    <Animated.View
      style={{
        width: 3,
        height: heightAnim,
        backgroundColor: isPlaying ? '#4f46e5' : '#c7d2fe',
        borderRadius: 2,
        marginHorizontal: 1.5
      }}
    />
  );
};

/* --- STYLES --- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Header */
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  
  /* Content */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  cardWrapper: { marginBottom: 16 },
  
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#94a3b8' },

  /* Collapsed Card */
  collapsedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  miniDetails: { fontSize: 11, color: '#94a3b8' },

  /* Expanded Card */
  expandedCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#4f46e5' },
  expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  avatarBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  studentNameBig: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  poemTitle: { fontSize: 11, color: '#64748b' },
  playingBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  playingText: { fontSize: 9, fontWeight: 'bold', color: '#4f46e5' },
  
  /* Player Area */
  playerBody: { padding: 16, backgroundColor: '#f8fafc' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 8 },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  playPauseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  
  /* Grading */
  gradingSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  tagChipActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  tagText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  tagTextActive: { color: '#4f46e5' },

  feedbackInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, height: 80, textAlignVertical: 'top', fontSize: 13, marginBottom: 16 },
  
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});