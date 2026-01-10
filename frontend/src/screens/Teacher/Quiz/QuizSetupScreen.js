import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import DateTimePicker from '@react-native-community/datetimepicker'; // <--- IMPORT THIS

export default function QuizSetupScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('9-A');
  const [subject, setSubject] = useState('Mathematics');
  const [duration, setDuration] = useState('30');
  const [passingScore, setPassingScore] = useState('40');
  
  const [releaseType, setReleaseType] = useState('Now'); 
  
  // Date Picker State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    if(!title.trim()) return alert("Please enter a quiz title");
    
    // Convert current Date object to strings for the next screen
    const scheduleDate = formatDate(date);
    const scheduleTime = formatTime(date);

    navigation.navigate('QuestionBuilder', {
      setupData: {
        title, className, subject, duration, passingScore,
        releaseType, scheduleDate, scheduleTime
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
          {/* ... Basic Info & Settings (Same as before) ... */}
          <Text style={styles.sectionLabel}>BASIC INFO</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quiz Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Weekly Math Test" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.label}>Class</Text>
                <TextInput style={styles.input} value={className} onChangeText={setClassName} />
            </View>
            <View style={[styles.inputGroup, {flex: 1, marginLeft: 10}]}>
                <Text style={styles.label}>Subject</Text>
                <TextInput style={styles.input} value={subject} onChangeText={setSubject} />
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

          {/* DATE & TIME PICKERS */}
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

          {/* Pickers Modal (Only shows when state is true) */}
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
  row: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#4f46e5' },
  toggleText: { fontWeight: 'bold', fontSize: 12, color: '#64748b' },
  textWhite: { color: '#fff' },
  
  // Picker Styles
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12 },
  pickerText: { fontWeight: 'bold', color: '#1e293b' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  nextBtn: { backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});