import React, { useState, useCallback, useRef } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, FlatList, Animated, Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useFocusEffect } from "@react-navigation/native";
import TeacherSidebar from "../../../components/TeacherSidebar";
import api from "../../../services/api";

export default function QuizDashboardScreen({ navigation }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('Active'); 
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // --- TOAST & CONFIRM STATES ---
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(100)).current; 
  
  // New State for Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Stores { id, title } if active

  useFocusEffect(
    useCallback(() => {
      fetchQuizzes();
    }, [])
  );

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/teacher/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  // --- HELPERS ---
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => {
        setToast(prev => ({ ...prev, visible: false }));
      });
    }, 2000);
  };

  // --- DELETE LOGIC ---
  
  // 1. User clicks Trash Icon -> Show Confirmation
  const handleDelete = (id, title) => {
    setDeleteConfirm({ id, title });
  };

  // 2. User clicks "Confirm" -> Actually Delete
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;

    // Close confirmation immediately
    setDeleteConfirm(null);

    try {
      await api.delete(`/teacher/assignments/${id}`);
      setQuizzes(prev => prev.filter(q => q._id !== id));
      showToast("Quiz deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete quiz", "error");
    }
  };

  const handleEdit = (quizId) => {
    navigation.navigate('QuizEdit', { quizId: quizId });
  };

  const handleMonitor = (quizId) => {
    navigation.navigate('LiveQuizMonitor', { quizId: quizId });
  };

  const getTimeRemaining = (quiz) => {
    const now = new Date();
    
    // CASE A: Scheduled Quiz -> Show "Starts in..."
    if (quiz.status === 'Scheduled' && quiz.scheduledAt) {
        const start = new Date(quiz.scheduledAt);
        const diff = start - now;
        if (diff <= 0) return "Starting...";
        
        const minutes = Math.floor((diff / 1000) / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `Starts in ${days}d`;
        if (hours > 0) return `Starts in ${hours}h`;
        return `Starts in ${minutes}m`;
    }

    // CASE B: Active Quiz -> Show "Ends in..."
    if (quiz.dueDate) {
        const end = new Date(quiz.dueDate);
        const diff = end - now;
        if (diff <= 0) return "Ended";

        const minutes = Math.floor((diff / 1000) / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 24) return `${Math.floor(hours / 24)}d left`;
        if (hours > 0) return `${hours}h ${minutes % 60}m left`;
        return `${minutes}m left`;
    }

    return "No Date";
};

  const filteredQuizzes = quizzes.filter(q => {
    if (activeTab === 'Active') return q.status === 'Active' || q.status === 'Scheduled';
    if (activeTab === 'Draft') return q.status === 'Draft';
    if (activeTab === 'Completed') return q.status === 'Completed'; 
    return false;
  });

  const renderQuizCard = ({ item }) => {
    const isLive = item.status === 'Active';
    const statusColor = isLive ? '#16a34a' : (item.status === 'Draft' ? '#94a3b8' : '#4f46e5');
    const borderLeftColor = isLive ? '#22c55e' : (item.status === 'Draft' ? '#cbd5e1' : '#6366f1');

    return (
      <Animated.View style={[styles.card, { borderLeftColor: borderLeftColor, opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={{flex: 1}}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.className} • {item.subject}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item._id, item.title)} style={styles.deleteBtn}>
             <FontAwesome5 name="trash" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <FontAwesome5 name="clock" size={12} color="#64748b" />
              <Text style={styles.infoText}>
                {isLive || item.status === 'Scheduled' ? getTimeRemaining(item) : `${item.duration} min`}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="list-ol" size={12} color="#64748b" />
              <Text style={styles.infoText}>{item.questionCount || 0} Qs</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isLive ? '#dcfce7' : '#f1f5f9' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                {isLive ? 'LIVE' : item.status.toUpperCase()}
                </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item._id)}>
             <FontAwesome5 name="edit" size={12} color="#64748b" />
             <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          {activeTab !== 'Draft' && item.status === 'Active' && ( 
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleMonitor(item._id)}>
                <FontAwesome5 name="chart-pie" size={12} color="#4f46e5" />
                <Text style={[styles.actionText, {color:'#4f46e5'}]}>Monitor</Text>
            </TouchableOpacity>
        )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} navigation={navigation} activeItem="QuizManager" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
             <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuBtn}>
                <FontAwesome5 name="bars" size={20} color="#1e293b" />
             </TouchableOpacity>
             <View>
                <Text style={styles.headerTitle}>Quiz Manager</Text>
                <Text style={styles.headerSub}>ASSESSMENTS & TESTS</Text>
             </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
           <View style={styles.tabWrapper}>
             {['Active', 'Draft', 'Completed'].map(tab => (
               <TouchableOpacity 
                  key={tab} 
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} 
                  onPress={() => switchTab(tab)}
               >
                 <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                   {tab === 'Completed' ? 'History' : tab}
                 </Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>

        {/* List */}
        {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{marginTop: 50}} />
        ) : (
            <FlatList
              data={filteredQuizzes}
              keyExtractor={item => item._id}
              renderItem={renderQuizCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                   <Text style={styles.emptyText}>No {activeTab.toLowerCase()} quizzes found.</Text>
                </View>
              }
            />
        )}

        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigation.navigate('QuizSetup')}>
          <FontAwesome5 name="plus" size={20} color="#fff" />
        </TouchableOpacity>

        {/* --- CONFIRMATION TOAST (Interactive) --- */}
        {deleteConfirm && (
          <View style={styles.confirmOverlay}>
             <View style={styles.confirmBox}>
                 <View style={styles.confirmTextContainer}>
                     <Text style={styles.confirmTitle}>Delete Quiz?</Text>
                     <Text style={styles.confirmSub} numberOfLines={1}>"{deleteConfirm.title}" will be permanently removed.</Text>
                 </View>
                 <View style={styles.confirmActions}>
                     <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteConfirm(null)}>
                         <Text style={styles.cancelText}>Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.deleteConfirmBtn} onPress={executeDelete}>
                         <Text style={styles.deleteConfirmText}>Delete</Text>
                     </TouchableOpacity>
                 </View>
             </View>
          </View>
        )}

        {/* --- SUCCESS/ERROR TOAST (Non-interactive) --- */}
        {toast.visible && (
          <Animated.View 
            style={[
              styles.toast, 
              toast.type === 'error' ? styles.toastError : (toast.type === 'info' ? styles.toastInfo : styles.toastSuccess),
              { transform: [{ translateY: toastAnim }] }
            ]}
            pointerEvents="none" 
          >
             <FontAwesome5 
                name={toast.type === 'error' ? 'exclamation-circle' : (toast.type === 'info' ? 'info-circle' : 'check-circle')} 
                size={16} 
                color="#fff" 
             />
             <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  menuBtn: { padding: 4 },
  tabContainer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff' },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity:0.1, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#4f46e5', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  deleteBtn: { padding: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', elevation: 8 },

  /* --- TOAST STYLES --- */
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#ef4444' },
  toastInfo: { backgroundColor: '#3b82f6' },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  /* --- CONFIRMATION CARD STYLES --- */
  confirmOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center', zIndex: 1000 },
  confirmBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, width: '100%', borderWidth: 1, borderColor: '#f1f5f9' },
  confirmTextContainer: { flex: 1, marginRight: 10 },
  confirmTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  confirmSub: { fontSize: 12, color: '#64748b' },
  confirmActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f1f5f9' },
  cancelText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  deleteConfirmBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fee2e2' },
  deleteConfirmText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
});