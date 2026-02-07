import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  BackHandler,
  Platform,
  UIManager,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import TeacherSidebar from "../../components/TeacherSidebar"; 

// Enable Animations
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { height } = Dimensions.get('window');

export default function DailyTaskScreen({ navigation }) {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Create Panel Animation
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createPanelAnim = useRef(new Animated.Value(height)).current;
  
  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 

  // Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const deleteScaleAnim = useRef(new Animated.Value(0.8)).current; 
  const deleteOpacityAnim = useRef(new Animated.Value(0)).current;

  // Data
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateList, setDateList] = useState([]);

  // Create Form
  const [taskType, setTaskType] = useState('audio'); 
  const [selectedClass, setSelectedClass] = useState('');
  const [myClasses, setMyClasses] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [duration, setDuration] = useState(''); // <--- NEW: Duration State
  const [creating, setCreating] = useState(false);
  
  // Range State
  const [assignMode, setAssignMode] = useState('all'); 
  const [rollStart, setRollStart] = useState('');
  const [rollEnd, setRollEnd] = useState('');

  useEffect(() => {
    generateDates();
    fetchClasses();
    fetchTasks();
  }, []);

  // Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      if (isCreateOpen) {
        closeCreatePanel();
        return true;
      }
      navigation.navigate('TeacherDash'); 
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen, isCreateOpen]);

  // --- TOAST FUNCTION ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2000);
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push({
        id: i,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        num: d.getDate(),
        active: i === 0 
      });
    }
    setDateList(dates);
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      const fetchedClasses = response.data.classes || [];
      const classNames = fetchedClasses.map(c => c.id);
      setMyClasses(classNames);
      if (classNames.length > 0) {
        setSelectedClass(classNames[0]);
      }
    } catch (error) {
      console.error("Fetch Classes Error:", error);
      showToast("Could not load class list", "error");
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teacher/assignments');
      setTasks(response.data);
    } catch (error) {
      console.error("Fetch Tasks Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- DELETE ACTIONS ---
  const confirmDelete = (id) => {
    setTaskToDelete(id);
    setDeleteModalVisible(true);
    Animated.parallel([
        Animated.spring(deleteScaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
        Animated.timing(deleteOpacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const closeDeleteModal = () => {
    Animated.timing(deleteOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setDeleteModalVisible(false);
        setTaskToDelete(null);
        deleteScaleAnim.setValue(0.8); 
    });
  };

  const executeDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/teacher/assignments/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete));
      closeDeleteModal();
      showToast("Task deleted successfully", "success");
    } catch (error) {
      closeDeleteModal();
      showToast("Failed to delete task", "error");
    }
  };

  // --- CREATE TASK ---
  const handleAssign = async () => {
    if (!taskTitle.trim() || !selectedClass) {
      showToast("Please fill all fields", "error");
      return;
    }
    
    if (assignMode === 'range') {
        if (!rollStart || !rollEnd) {
            showToast("Specify start and end roll numbers", "error");
            return;
        }
        if (Number(rollStart) > Number(rollEnd)) {
            showToast("Start roll cannot be greater than end", "error");
            return;
        }
    }

    setCreating(true);
    try {
      // --- LOGIC: CALCULATE DEADLINE ---
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      let finalDeadline = endOfDay; // Default: End of today

      if (duration && !isNaN(duration)) {
          // If user entered hours (e.g., 2 hours)
          const durationMs = Number(duration) * 60 * 60 * 1000;
          const calculatedTime = new Date(now.getTime() + durationMs);
          
          // Rule: If calculated time > end of day, cap it at end of day
          // Rule: If calculated time is valid, use it.
          if (calculatedTime < endOfDay) {
              finalDeadline = calculatedTime;
          }
      }

      const payload = {
        className: selectedClass,
        subject: "General", 
        title: taskTitle,
        type: taskType,
        dueDate: finalDeadline, // Backend will use this to expire/delete the task
        targetType: assignMode, 
        rollStart: assignMode === 'range' ? rollStart : null,
        rollEnd: assignMode === 'range' ? rollEnd : null
      };

      await api.post('/teacher/assignments', payload);

      showToast(`Task assigned! Ends at ${finalDeadline.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, "success");
      
      closeCreatePanel();
      setTaskTitle('');
      setRollStart('');
      setRollEnd('');
      setDuration(''); // Reset duration
      setAssignMode('all');
      fetchTasks(); 

    } catch (error) {
      showToast(error.response?.data?.message || "Failed to assign task", "error");
    } finally {
      setCreating(false);
    }
  };

  // --- UI HELPERS ---
  const openCreatePanel = () => {
    setIsCreateOpen(true);
    Animated.spring(createPanelAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 90 }).start();
  };

  const closeCreatePanel = () => {
    Animated.timing(createPanelAnim, { toValue: height, duration: 200, useNativeDriver: true }).start(() => setIsCreateOpen(false));
  };

  const renderTaskCard = ({ item }) => {
    const isAudio = item.type === 'audio';
    const isQuiz = item.type === 'quiz';
    
    let icon = 'pen-fancy';
    let color = '#f97316'; 
    let bg = '#fff7ed';
    
    if (isAudio) { icon = 'microphone'; color = '#4f46e5'; bg = '#eef2ff'; } 
    else if (isQuiz) { icon = 'list-check'; color = '#64748b'; bg = '#f8fafc'; }

    // Format deadline
    const deadline = new Date(item.dueDate);
    const timeString = deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconCircle, { backgroundColor: bg }]}>
              <FontAwesome5 name={icon} size={14} color={color} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>
                  {item.className} • {item.subject}
                  {item.targetType === 'range' && ` • Roll ${item.rollRange?.start}-${item.rollRange?.end}`}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => confirmDelete(item._id)} style={{ padding: 4 }}>
             <FontAwesome5 name="trash-alt" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {isAudio ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              {/* Show Time Remaining or Due Time */}
              <Text style={[styles.progressText, {color: color}]}>
                 <FontAwesome5 name="clock" size={10} /> Ends: {timeString}
              </Text>
              <Text style={styles.progressText}>
                {item.submissionCount || 0}/{item.assignedCount || '?'} Submitted
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '5%', backgroundColor: color }]} />
            </View>
          </View>
        ) : (
          <View style={styles.avatarsRow}>
            <Text style={styles.pendingLabel}>
              Due: {deadline.toLocaleDateString()} at {timeString}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- SIDEBAR --- */}
      <TeacherSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeItem="DailyTask"
      />

      {/* Main Content */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
                <FontAwesome5 name="bars" size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Daily Planner</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
             <Text style={styles.sectionTitle}>ASSIGNED FOR TODAY</Text>
             <Text style={styles.taskCount}>{tasks.length} Tasks</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={item => item._id}
              renderItem={renderTaskCard}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              onRefresh={fetchTasks}
              refreshing={refreshing}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 20 }}>No tasks found.</Text>
              }
            />
          )}
        </View>

        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCreatePanel}>
          <FontAwesome5 name="plus" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Dash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyClasses')}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StudentDirectory')}>
            <FontAwesome5 name="users" size={20} color="#94a3b8" />
            <Text style={styles.navLabel}>Students</Text>
          </TouchableOpacity>
        </View>

        {/* --- TOAST NOTIFICATION --- */}
        {toast.visible && (
          <Animated.View 
            style={[
              styles.toast, 
              toast.type === 'error' ? styles.toastError : styles.toastSuccess,
              { transform: [{ translateY: toastAnim }] }
            ]}
            pointerEvents="none" 
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

      {/* --- CREATE PANEL --- */}
      {isCreateOpen && (
        <View style={styles.createOverlay}>
           <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={closeCreatePanel} />
           
           <Animated.View style={[styles.createPanel, { transform: [{ translateY: createPanelAnim }] }]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>ASSIGN NEW TASK</Text>
                <TouchableOpacity onPress={closeCreatePanel}>
                   <FontAwesome5 name="times" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Task Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TASK TYPE</Text>
                <View style={styles.typeRow}>
                   <TouchableOpacity style={[styles.typeBtn, taskType === 'audio' && styles.typeBtnActive]} onPress={() => setTaskType('audio')}>
                      <FontAwesome5 name="microphone" size={14} color={taskType === 'audio' ? '#fff' : '#64748b'} />
                      <Text style={[styles.typeText, taskType === 'audio' && styles.textWhite]}>Audio</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.typeBtn, taskType === 'homework' && styles.typeBtnActive]} onPress={() => setTaskType('homework')}>
                      <FontAwesome5 name="pen-fancy" size={14} color={taskType === 'homework' ? '#fff' : '#64748b'} />
                      <Text style={[styles.typeText, taskType === 'homework' && styles.textWhite]}>Homework</Text>
                   </TouchableOpacity>
                </View>
              </View>

              {/* Class Select */}
              <View style={styles.inputGroup}>
                 <Text style={styles.label}>ASSIGN TO</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {myClasses.length > 0 ? myClasses.map((cls) => (
                      <TouchableOpacity key={cls} style={[styles.classChip, selectedClass === cls && styles.classChipActive]} onPress={() => setSelectedClass(cls)}>
                        <Text style={[styles.classChipText, selectedClass === cls && styles.textWhite]}>{cls}</Text>
                      </TouchableOpacity>
                    )) : <Text style={{color:'#94a3b8', fontSize:12, fontStyle:'italic'}}>No classes found</Text>}
                 </ScrollView>
              </View>

              {/* Assignment Mode */}
              <View style={styles.inputGroup}>
                 <Text style={styles.label}>TARGET AUDIENCE</Text>
                 <View style={styles.typeRow}>
                    <TouchableOpacity style={[styles.typeBtn, assignMode === 'all' && styles.typeBtnActive]} onPress={() => setAssignMode('all')}>
                       <FontAwesome5 name="users" size={12} color={assignMode === 'all' ? '#fff' : '#64748b'} />
                       <Text style={[styles.typeText, assignMode === 'all' && styles.textWhite]}>Whole Class</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.typeBtn, assignMode === 'range' && styles.typeBtnActive]} onPress={() => setAssignMode('range')}>
                       <FontAwesome5 name="sort-numeric-down" size={12} color={assignMode === 'range' ? '#fff' : '#64748b'} />
                       <Text style={[styles.typeText, assignMode === 'range' && styles.textWhite]}>Roll No Range</Text>
                    </TouchableOpacity>
                 </View>
              </View>

              {/* Range Inputs */}
              {assignMode === 'range' && (
                  <View style={[styles.inputGroup, { flexDirection: 'row', gap: 10 }]}>
                      <View style={{ flex: 1 }}>
                          <Text style={styles.label}>START ROLL</Text>
                          <TextInput style={styles.input} placeholder="e.g. 1" keyboardType="numeric" value={rollStart} onChangeText={setRollStart} />
                      </View>
                      <View style={{ flex: 1 }}>
                          <Text style={styles.label}>END ROLL</Text>
                          <TextInput style={styles.input} placeholder="e.g. 10" keyboardType="numeric" value={rollEnd} onChangeText={setRollEnd} />
                      </View>
                  </View>
              )}

              {/* Title & Duration Input */}
              <View style={[styles.inputGroup, { flexDirection: 'row', gap: 10 }]}>
                 <View style={{ flex: 2 }}>
                     <Text style={styles.label}>TITLE / DESCRIPTION</Text>
                     <TextInput 
                        style={styles.input} 
                        placeholder={taskType === 'audio' ? "e.g. Recite Poem 5" : "e.g. Solve pg 42"} 
                        placeholderTextColor="#cbd5e1" 
                        value={taskTitle} 
                        onChangeText={setTaskTitle} 
                     />
                 </View>
                 
                 {/* NEW: DURATION INPUT */}
                 <View style={{ flex: 1 }}>
                     <Text style={styles.label}>LIMIT (HOURS)</Text>
                     <TextInput 
                        style={styles.input} 
                        placeholder="End of Day" 
                        placeholderTextColor="#cbd5e1" 
                        keyboardType="numeric"
                        value={duration} 
                        onChangeText={setDuration} 
                     />
                 </View>
              </View>
              {/* Note about duration */}
              <Text style={{fontSize:10, color:'#94a3b8', marginTop:-10, marginBottom:16}}>
                 {duration ? `Submission window closes in ${duration} hours.` : "Available until 11:59 PM today."}
              </Text>

              <TouchableOpacity style={[styles.assignBtn, creating && {opacity:0.7}]} onPress={handleAssign} disabled={creating}>
                 {creating ? <ActivityIndicator color="#fff"/> : <Text style={styles.assignBtnText}>Assign Task</Text>}
              </TouchableOpacity>

           </Animated.View>
        </View>
      )}

      {/* --- CUSTOM DELETE MODAL --- */}
      <Modal transparent visible={deleteModalVisible} animationType="none" onRequestClose={closeDeleteModal}>
          <View style={styles.modalBackdrop}>
             <Animated.View style={[styles.deleteModalContainer, { opacity: deleteOpacityAnim, transform: [{ scale: deleteScaleAnim }] }]}>
                
                <View style={styles.deleteIconContainer}>
                    <FontAwesome5 name="trash-alt" size={24} color="#ef4444" />
                </View>

                <Text style={styles.deleteModalTitle}>Delete Task?</Text>
                <Text style={styles.deleteModalSub}>
                    Are you sure you want to remove this task? This action cannot be undone.
                </Text>

                <View style={styles.deleteModalActions}>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={closeDeleteModal}>
                        <Text style={styles.cancelModalText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.confirmDeleteBtn} onPress={executeDelete}>
                        <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
                    </TouchableOpacity>
                </View>

             </Animated.View>
          </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  // Removed old Sidebar styles as they are now in the component
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  dateItem: { width: 50, height: 64, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dateItemActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  dateDay: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' },
  dateNum: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
  textWhite: { color: '#fff' },
  contentContainer: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  taskCount: { fontSize: 10, color: '#94a3b8' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  cardSub: { fontSize: 10, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  progressContainer: { marginTop: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  avatarsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  pendingLabel: { fontSize: 10, color: '#94a3b8' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  createOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'flex-end' },
  createPanel: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  panelTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 0.5, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  typeBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  typeText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', fontWeight: '600' },
  assignBtn: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  classChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  classChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  classChipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  
  /* --- TOAST STYLES --- */
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* --- MODAL STYLES --- */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  deleteIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  deleteModalSub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  deleteModalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelModalText: { color: '#64748b', fontWeight: 'bold' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontWeight: 'bold' },
});