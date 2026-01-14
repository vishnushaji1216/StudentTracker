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
  Dimensions,
  TextInput,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useFocusEffect } from "@react-navigation/native";
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import TeacherSidebar from "../../components/TeacherSidebar";
import api from "../../services/api"; 

const { width, height } = Dimensions.get('window');
const FEEDBACK_TAGS = ["Neat Work", "Improve Spacing", "Incomplete", "Improve Handwriting"];

export default function HandwritingReviewScreen({ navigation }) {
  // --- CAMERA HOOKS ---
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);

  // --- STATE ---
  const [studentQueue, setStudentQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current;

  // Screen Logic
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Capture Logic
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureStage, setCaptureStage] = useState('camera'); 
  const [currentStudent, setCurrentStudent] = useState(null);
  const [photoPath, setPhotoPath] = useState(null);
  
  // View & Delete Logic
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedSubmission, setViewedSubmission] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, id: null });

  // Grading Form
  const [selectedTags, setSelectedTags] = useState(['Neat Work']);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const panelAnim = useRef(new Animated.Value(height)).current;

  // --- 1. PERMISSIONS ---
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // --- 2. FETCH DATA ---
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teacher/queue/handwriting');
      setStudentQueue(response.data);

      if (response.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(response.data[0].id);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      showToast("Failed to load queue", "error");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQueue();
    }, [])
  );

  // --- 3. TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
      });
    }, 2500);
  };

  // --- 4. NAVIGATION HANDLERS ---
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Priority 1: Close Delete Confirm
      if (deleteConfirm.visible) {
        setDeleteConfirm({ visible: false, id: null });
        return true;
      }
      // Priority 2: Close Viewer
      if (viewModalOpen) {
        setViewModalOpen(false);
        return true;
      }
      // Priority 3: Close Camera
      if (isCaptureOpen) {
        if (captureStage === 'grading') {
          resetCapture();
          return true;
        }
        closeCapture();
        return true;
      }
      // Priority 4: Sidebar
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen, isCaptureOpen, captureStage, viewModalOpen, deleteConfirm]);

  // --- 5. CAMERA ACTIONS ---
  const openCapture = (student) => {
    setCurrentStudent(student);
    setPhotoPath(null);
    setCaptureStage('camera');
    setIsCaptureOpen(true);
  };

  const takePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off'
        });
        
        // FIX: Ensure file:// prefix exists for React Native Image component
        const path = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
        
        setPhotoPath(path);
        setCaptureStage('grading');
        Animated.spring(panelAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90
        }).start();
      } catch (err) {
        showToast("Camera error", "error");
      }
    }
  };

  const resetCapture = () => {
    Animated.timing(panelAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setPhotoPath(null);
      setCaptureStage('camera');
    });
  };

  const closeCapture = () => {
    setIsCaptureOpen(false);
    setCaptureStage('camera');
    panelAnim.setValue(height);
    setRating(0);
    setComment("");
    setSelectedTags(['Neat Work']);
  };

  // --- 6. SUBMIT TO BACKEND ---
  const handleApprove = async () => {
    if (!rating) {
      showToast("Please give a star rating", "error");
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('studentId', currentStudent.id);
    formData.append('rating', rating.toString());
    formData.append('feedback', comment);
    formData.append('tags', JSON.stringify(selectedTags));
    
    if (photoPath) {
        formData.append('file', {
            uri: photoPath,
            type: 'image/jpeg',
            name: 'review.jpg',
        });
    }

    try {
      await api.post('/teacher/log/handwriting', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      showToast("Logged Successfully!", "success");
      closeCapture();
      fetchQueue(); // Refresh list
    } catch (err) {
      console.error(err);
      showToast("Failed to upload review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --- 7. VIEW & DELETE LOGIC ---
  const openViewer = (student) => {
    setViewedSubmission(student);
    setViewModalOpen(true);
  };

  const promptDelete = (submissionId) => {
    setDeleteConfirm({ visible: true, id: submissionId });
  };

  const performDelete = async () => {
    const submissionId = deleteConfirm.id;
    
    setDeleteConfirm({ visible: false, id: null });
    setViewModalOpen(false); 
    setLoading(true);

    try {
      await api.delete(`/teacher/log/handwriting/${submissionId}`);
      showToast("Deleted Successfully", "success");
      fetchQueue(); 
    } catch (err) {
      console.error(err);
      showToast("Failed to delete", "error");
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // --- 8. RENDER ---
  const pendingCount = studentQueue.filter(s => s.status === 'pending').length;
  const loggedCount = studentQueue.filter(s => s.status === 'logged').length;

  const filteredList = studentQueue.filter(item => 
    activeTab === 'pending' ? item.status === 'pending' : item.status === 'logged'
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TeacherSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        navigation={navigation} 
        activeItem="HandwritingReview"
      />

      {/* MAIN CONTENT */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#1e293b" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Handwriting Queue</Text>
                <Text style={styles.headerSub}>WEEKLY CHECK</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                Pending ({pendingCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'logged' && styles.tabBtnActive]}
              onPress={() => setActiveTab('logged')}
            >
              <Text style={[styles.tabText, activeTab === 'logged' && styles.tabTextActive]}>
                Logged ({loggedCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
            <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={{marginTop:10, color:"#94a3b8"}}>Loading student queue...</Text>
            </View>
        ) : (
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              <View style={styles.contentPadding}>
                
                {/* Horizontal Ribbon
                <Text style={styles.sectionLabel}>QUICK SELECT</Text>
                {studentQueue.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ribbonScroll}>
                    {studentQueue.map((item) => (
                        <TouchableOpacity 
                        key={item.id} 
                        style={[styles.ribbonItem, selectedStudentId === item.id && styles.ribbonItemActive]}
                        onPress={() => setSelectedStudentId(item.id)}
                        >
                        <View style={[styles.ribbonAvatar, { backgroundColor: item.bg }, selectedStudentId === item.id && styles.ribbonAvatarActive]}>
                            <Text style={[styles.ribbonText, { color: item.color }]}>{item.initials}</Text>
                        </View>
                        <Text style={[styles.ribbonName, selectedStudentId === item.id && styles.ribbonNameActive]}>
                            {item.name.split(' ')[0]}
                        </Text>
                        </TouchableOpacity>
                    ))}
                    </ScrollView>
                ) : (
                    <Text style={{color:'#94a3b8', fontSize:12, marginBottom:10}}>No students available.</Text>
                )} */}

                <View style={{ height: 20 }} />

                {/* List Items */}
                {filteredList.length === 0 ? (
                    <View style={{alignItems:'center', marginTop:30}}>
                        <FontAwesome5 name="clipboard-check" size={40} color="#e2e8f0" />
                        <Text style={{textAlign:'center', marginTop:10, color:'#94a3b8'}}>
                            No {activeTab} students found.
                        </Text>
                        {studentQueue.length === 0 && (
                             <TouchableOpacity onPress={fetchQueue} style={{marginTop:20, padding:10}}>
                                 <Text style={{color:'#4f46e5', fontWeight:'bold'}}>Retry Fetching</Text>
                             </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredList.map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[styles.card, item.status === 'logged' && styles.cardLogged]}
                        onPress={() => item.status === 'logged' ? openViewer(item) : null}
                        activeOpacity={item.status === 'logged' ? 0.7 : 1}
                      >
                        <View style={styles.cardLeft}>
                          <View style={[styles.avatarBox, { backgroundColor: item.bg }]}>
                            <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
                          </View>
                          <View>
                            <Text style={styles.cardName}>{item.name}</Text>
                            {item.status === 'logged' ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <FontAwesome5 name="star" size={10} color="#fbbf24" solid />
                                <Text style={styles.cardStatusGreen}>Rated {item.rating}/5</Text>
                              </View>
                            ) : (
                              <Text style={styles.cardStatus}>Roll {item.roll} • Not Logged</Text>
                            )}
                          </View>
                        </View>

                        {item.status === 'pending' ? (
                          <TouchableOpacity 
                            style={styles.cameraBtn}
                            onPress={() => openCapture(item)}
                          >
                            <FontAwesome5 name="camera" size={14} color="#64748b" />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                             style={styles.editBtn} 
                             onPress={() => openViewer(item)}
                          >
                            <FontAwesome5 name="eye" size={12} color="#16a34a" />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    ))
                )}
              </View>
            </ScrollView>
        )}

        {/* CUSTOM TOAST */}
        {toast.visible && (
            <Animated.View 
                style={[
                    styles.toast, 
                    toast.type === 'error' ? styles.toastError : styles.toastSuccess,
                    { transform: [{ translateY: toastAnim }] }
                ]}
            >
                <FontAwesome5 
                    name={toast.type === 'error' ? 'exclamation-circle' : 'check-circle'} 
                    size={16} 
                    color="#fff" 
                />
                <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
        )}
      </SafeAreaView>

      {/* --- ABSOLUTE LAYERS (ORDER MATTERS FOR Z-INDEX) --- */}

      {/* 1. Capture Modal */}
      {isCaptureOpen && (
        <View style={styles.captureModal}>
          <StatusBar hidden={true} />
          
          <View style={styles.cameraPreview}>
            {captureStage === 'camera' && device ? (
                 <Camera
                   ref={camera}
                   style={StyleSheet.absoluteFill}
                   device={device}
                   isActive={isCaptureOpen}
                   photo={true}
                 />
            ) : (
                 photoPath && <Image source={{ uri: photoPath }} style={styles.previewImage} />
            )}
            
            {captureStage === 'camera' && (
              <View style={styles.viewfinder}>
                <View style={styles.viewfinderBox} />
                <Text style={styles.alignText}>ALIGN PAGE HERE</Text>
              </View>
            )}
          </View>

          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={closeCapture} style={styles.closeBtn}>
                <FontAwesome5 name="arrow-left" size={16} color="#fff" />
              </TouchableOpacity>
              <View>
                <Text style={styles.modalName}>{currentStudent?.name}</Text>
                <Text style={styles.modalRoll}>Roll No. {currentStudent?.roll}</Text>
              </View>
            </View>
            
            {captureStage === 'grading' && (
              <TouchableOpacity style={styles.retakeBtn} onPress={resetCapture}>
                <FontAwesome5 name="sync-alt" size={12} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            )}
          </View>

          {captureStage === 'camera' && (
            <View style={styles.shutterContainer}>
              <TouchableOpacity onPress={takePhoto} style={styles.shutterOuter}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          )}

          <Animated.View style={[styles.gradingPanel, { transform: [{ translateY: panelAnim }] }]}>
            <View style={styles.dragHandle} />

            <View style={styles.ratingRow}>
              <Text style={styles.panelLabel}>QUALITY RATING</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <FontAwesome5 name="star" solid={star <= rating} size={24} color={star <= rating ? "#fbbf24" : "#e2e8f0"} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={styles.panelLabel}>FEEDBACK TAGS</Text>
              <View style={styles.tagRow}>
                {FEEDBACK_TAGS.map((tag) => (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, selectedTags.includes(tag) && { color: '#4f46e5', fontWeight: 'bold' }]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.commentBox}>
              <FontAwesome5 name="pen" size={14} color="#94a3b8" />
              <TextInput 
                placeholder="Add a specific note..."
                placeholderTextColor="#94a3b8"
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.redoBtn} onPress={closeCapture}>
                <Text style={styles.redoBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} disabled={submitting}>
                {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <FontAwesome5 name="check" size={14} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.approveBtnText}>Approve & Next</Text>
                    </>
                )}
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>
      )}

      {/* 2. View Modal */}
      {viewModalOpen && viewedSubmission && (
        <View style={styles.viewModal}>
           <StatusBar hidden={true} />
           
           {/* Top Bar */}
           <View style={styles.viewHeader}>
              <TouchableOpacity onPress={() => setViewModalOpen(false)} style={styles.closeIconBtn}>
                 <FontAwesome5 name="times" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.viewTitle}>{viewedSubmission.name}</Text>
              
              <TouchableOpacity 
                style={styles.deleteIconBtn} 
                onPress={() => promptDelete(viewedSubmission.submissionId)}
              >
                 <FontAwesome5 name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
           </View>

           {/* Image */}
           <View style={styles.imageContainer}>
             {viewedSubmission.fileUrl ? (
                 <Image 
                   source={{ uri: viewedSubmission.fileUrl }} 
                   style={styles.fullImage} 
                   resizeMode="contain"
                 />
             ) : (
                 <Text style={{color:'#fff'}}>Image not available</Text>
             )}
           </View>

           {/* Info Footer */}
           <View style={styles.viewFooter}>
              <View style={styles.footerRow}>
                 <View style={{flexDirection:'row', gap:5}}>
                    {[...Array(5)].map((_, i) => (
                       <FontAwesome5 
                          key={i} 
                          name="star" 
                          solid={i < viewedSubmission.rating} 
                          size={16} 
                          color={i < viewedSubmission.rating ? "#fbbf24" : "#475569"} 
                       />
                    ))}
                 </View>
                 <Text style={styles.footerDate}>Logged</Text>
              </View>
              {viewedSubmission.feedback ? (
                  <Text style={styles.footerFeedback}>"{viewedSubmission.feedback}"</Text>
              ) : null}
           </View>
        </View>
      )}

      {/* 3. Delete Confirmation Dialog (On Top) */}
      {deleteConfirm.visible && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            
            <View style={styles.confirmHeader}>
              <View style={styles.warningIconBox}>
                <FontAwesome5 name="exclamation-triangle" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.confirmTitle}>Delete this log?</Text>
            </View>

            <Text style={styles.confirmText}>
              This action cannot be undone. The student's grade and image will be permanently removed.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setDeleteConfirm({ visible: false, id: null })}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={performDelete}
              >
                <Text style={styles.deleteBtnText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}

    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  /* Toast */
  toast: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* Header */
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  menuButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },

  /* Tabs */
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.05, shadowRadius:2, elevation:1 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  tabTextActive: { color: '#4f46e5' },

  /* Ribbon */
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 },
  ribbonScroll: { marginBottom: 20 },
  ribbonItem: { alignItems: 'center', marginRight: 16, opacity: 0.6, transform: [{ scale: 0.9 }] },
  ribbonItemActive: { opacity: 1, transform: [{ scale: 1 }] },
  ribbonAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 2, borderColor: 'transparent' },
  ribbonAvatarActive: { borderColor: '#4f46e5' },
  ribbonText: { fontWeight: 'bold', fontSize: 14 },
  ribbonName: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  ribbonNameActive: { color: '#4f46e5', fontWeight: 'bold' },

  /* List */
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  cardLogged: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold' },
  cardName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  cardStatus: { fontSize: 11, color: '#94a3b8' },
  cardStatusGreen: { fontSize: 11, color: '#16a34a', fontWeight: 'bold' },
  cameraBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },

  /* Modal & Capture */
  captureModal: { position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 100 },
  cameraPreview: { flex: 1, backgroundColor: '#000', position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  viewfinder: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },
  viewfinderBox: { width: 250, height: 350, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderStyle: 'dashed' },
  alignText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', marginTop: 16, letterSpacing: 1 },
  
  modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalName: { color: '#fff', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:0, height:1}, textShadowRadius: 2 },
  modalRoll: { color: '#cbd5e1', fontSize: 11 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  retakeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  shutterContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  shutterOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  gradingPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  tagChipSelected: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  tagText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  commentBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 20 },
  commentInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },
  actionRow: { flexDirection: 'row', gap: 12 },
  redoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2', paddingVertical: 14, borderRadius: 12 },
  redoBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12 },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* VIEW MODAL STYLES */
  viewModal: { position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 200, justifyContent: 'center' },
  viewHeader: { position: 'absolute', top: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  viewTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeIconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  deleteIconBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 20 },
  
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: width, height: height * 0.7 },
  
  viewFooter: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(30, 41, 59, 0.9)', padding: 20, borderRadius: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  footerDate: { color: '#94a3b8', fontSize: 12 },
  footerFeedback: { color: '#fff', fontStyle: 'italic' },

  /* DELETE CONFIRMATION STYLES */
  confirmOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 300 },
  confirmBox: { width: width * 0.85, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  confirmHeader: { alignItems: 'center', marginBottom: 12 },
  warningIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  confirmText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  confirmButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
});