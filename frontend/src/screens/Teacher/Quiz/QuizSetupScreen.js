import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  Platform, Animated, Modal, FlatList, ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import DateTimePicker from '@react-native-community/datetimepicker'; 
import api from "../../../services/api"; //

export default function QuizSetupScreen({ navigation }) {
  // --- STATE ---
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [passingScore, setPassingScore] = useState('40');
  const [releaseType, setReleaseType] = useState('Now'); 
  
  // Dynamic Data State
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [rawClassData, setRawClassData] = useState([]); // Stores full API response
  const [uniqueClasses, setUniqueClasses] = useState([]); // Unique Class Names
  const [availableSubjects, setAvailableSubjects] = useState([]); // Subjects for selected class

  // Selections
  const [selectedClass, setSelectedClass] = useState(''); 
  const [selectedSubject, setSelectedSubject] = useState('');

  // Dropdown Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'CLASS' or 'SUBJECT'

  // Date Picker State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const toastAnim = useRef(new Animated.Value(100)).current;

  // --- EFFECT: FETCH CLASSES ON MOUNT ---
  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  const fetchTeacherClasses = async () => {
    try {
      // Fetch data from existing endpoint
      const res = await api.get('/teacher/classes'); 
      const data = res.data.classes || [];
      
      setRawClassData(data);

      // Extract Unique Class Names
      // The API returns [{id: '9-A', subject: 'Math'}, {id: '9-A', subject: 'Physics'}]
      // We want ['9-A']
      const classes = [...new Set(data.map(item => item.id))];
      setUniqueClasses(classes);

      // Default Selection (Optional)
      if (classes.length > 0) {
        handleClassSelect(classes[0], data);
      }
    } catch (error) {
      console.error("Failed to load classes", error);
      showToast("Could not load your classes");
    } finally {
      setLoadingClasses(false);
    }
  };

  // --- HANDLERS ---

  const handleClassSelect = (className, dataOverride = null) => {
    setSelectedClass(className);
    
    // Filter subjects taught by this teacher in this specific class
    const sourceData = dataOverride || rawClassData;
    const subjects = sourceData
      .filter(item => item.id === className)
      .map(item => item.subject);
    
    // Remove duplicates just in case
    const uniqueSubj = [...new Set(subjects)];
    
    setAvailableSubjects(uniqueSubj);
    
    // Auto-select first subject if available
    if (uniqueSubj.length > 0) {
        setSelectedSubject(uniqueSubj[0]);
    } else {
        setSelectedSubject('');
    }
  };

  const openModal = (type) => {
    if (type === 'SUBJECT' && !selectedClass) {
        showToast("Please select a class first");
        return;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelection = (item) => {
    if (modalType === 'CLASS') {
        handleClassSelect(item);
    } else {
        setSelectedSubject(item);
    }
    setModalVisible(false);
  };

  const showToast = (message) => {
    setToast({ visible: true, message, type: 'error' });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2000);
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return newDate;
    });
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setDate(prev => {
        const newDate = new Date(prev);
        newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        return newDate;
    });
  };

  const formatDate = (d) => d.toISOString().split('T')[0];
  const formatTime = (d) => d.toTimeString().slice(0, 5);

  const handleNext = () => {

    if(!title.trim()) { showToast("Please enter a Quiz Title"); return; }

    const durationNum = parseInt(duration, 10);
    const passingNum = parseInt(passingScore, 10);

    if (isNaN(durationNum) || durationNum <= 0) { showToast("Duration must be a positive number"); return; }
    if (isNaN(passingNum) || passingNum < 0 || passingNum > 100) { showToast("Passing score must be between 0 and 100"); return; }

    const scheduleDate = formatDate(date);
    const scheduleTime = formatTime(date);

    navigation.navigate('QuestionBuilder', {
      setupData: {
        title, 
        className, 
        subject,   
        duration: durationNum,      
        passingScore: passingNum,   
        releaseType, 
        scheduleDate, 
        scheduleTime
      }
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()}>
             <FontAwesome5 name="arrow-left" size={20} color="#64748b" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Create Quiz: Setup</Text>
           <View style={{width:20}} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          
          <Text style={styles.sectionLabel}>BASIC INFO</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quiz Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Weekly Math Test" value={title} onChangeText={setTitle} />
          </View>

          {/* --- DYNAMIC DROPDOWNS --- */}
          <View style={styles.row}>
            {/* CLASS SELECTOR */}
            <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Class</Text>
                <TouchableOpacity 
                    style={styles.dropdownBtn} 
                    onPress={() => openModal('CLASS')}
                    disabled={loadingClasses}
                >
                    <Text style={styles.dropdownText}>
                        {loadingClasses ? "Loading..." : (selectedClass || "Select")}
                    </Text>
                    <FontAwesome5 name="caret-down" size={14} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* SUBJECT SELECTOR */}
            <View style={[styles.inputGroup, {flex: 1, marginLeft: 10}]}>
                <Text style={styles.label}>Subject</Text>
                <TouchableOpacity 
                    style={[styles.dropdownBtn, !selectedClass && {opacity: 0.5}]} 
                    onPress={() => openModal('SUBJECT')}
                >
                    <Text style={styles.dropdownText}>
                        {selectedSubject || "Select"}
                    </Text>
                    <FontAwesome5 name="caret-down" size={14} color="#64748b" />
                </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Duration (Mins)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={duration} onChangeText={setDuration} />
            </View>
            <View style={[styles.inputGroup, {flex: 1, marginLeft: 10}]}>
                <Text style={styles.label}>Pass Score (%)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={passingScore} onChangeText={setPassingScore} />
            </View>
          </View>

          <Text style={styles.sectionLabel}>SCHEDULE</Text>
          <View style={styles.toggleRow}>
             <TouchableOpacity style={[styles.toggleBtn, releaseType === 'Now' && styles.toggleActive]} onPress={() => setReleaseType('Now')}>
                <Text style={[styles.toggleText, releaseType === 'Now' && styles.textWhite]}>Release Now</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.toggleBtn, releaseType === 'Later' && styles.toggleActive]} onPress={() => setReleaseType('Later')}>
                <Text style={[styles.toggleText, releaseType === 'Later' && styles.textWhite]}>Schedule Later</Text>
             </TouchableOpacity>
          </View>

          {releaseType === 'Later' && (
             <View style={styles.row}>
                <View style={[styles.inputGroup, {flex: 1}]}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                        <FontAwesome5 name="calendar-alt" size={16} color="#64748b" />
                        <Text style={styles.pickerText}>{formatDate(date)}</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 10}]}>
                    <Text style={styles.label}>Time</Text>
                     <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                        <FontAwesome5 name="clock" size={16} color="#64748b" />
                        <Text style={styles.pickerText}>{formatTime(date)}</Text>
                    </TouchableOpacity>
                </View>
             </View>
          )}

          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
          )}
          {showTimePicker && (
            <DateTimePicker value={date} mode="time" display="default" onChange={onChangeTime} />
          )}

        </ScrollView>

        <View style={styles.footer}>
           <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next: Add Questions</Text>
              <FontAwesome5 name="arrow-right" size={14} color="#fff" />
           </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* --- SELECTION MODAL --- */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
         <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
             <View style={styles.modalContent}>
                 <Text style={styles.modalTitle}>Select {modalType === 'CLASS' ? 'Class' : 'Subject'}</Text>
                 <FlatList
                    data={modalType === 'CLASS' ? uniqueClasses : availableSubjects}
                    keyExtractor={(item) => item}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => handleSelection(item)}>
                            <Text style={styles.modalItemText}>{item}</Text>
                            {(modalType === 'CLASS' ? selectedClass : selectedSubject) === item && (
                                <FontAwesome5 name="check" size={14} color="#4f46e5" />
                            )}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No data available</Text>}
                 />
             </View>
         </TouchableOpacity>
      </Modal>

      {toast.visible && (
        <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
            <FontAwesome5 name="exclamation-circle" size={16} color="#fff" />
            <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 16, marginBottom: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontWeight: '600', color: '#1e293b' },
  
  // DROPDOWN STYLES
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12 },
  dropdownText: { fontWeight: '600', color: '#1e293b' },

  row: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#4f46e5' },
  toggleText: { fontWeight: 'bold', fontSize: 12, color: '#64748b' },
  textWhite: { color: '#fff' },
  
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12 },
  pickerText: { fontWeight: 'bold', color: '#1e293b' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  nextBtn: { backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', gap: 10, alignItems:'center', backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, zIndex: 999, elevation: 10 },
  toastText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#64748b' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 20 }
});