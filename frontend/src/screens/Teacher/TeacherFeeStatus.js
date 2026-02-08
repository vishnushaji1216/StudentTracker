import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Linking, ActivityIndicator, StatusBar, Alert,
  RefreshControl // 1. Import RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import TeacherSidebar from "../../components/TeacherSidebar";
import api from "../../services/api";

export default function TeacherFeeStatus({ navigation }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 2. Add refreshing state
  const [data, setData] = useState({ className: "", defaulters: [] });

  useEffect(() => {
    fetchDefaulters();
  }, []);

  // 3. Create a refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDefaulters().then(() => setRefreshing(false));
  }, []);

  const fetchDefaulters = async () => {
    try {
      // Only show the big loader on initial mount, not during pull-to-refresh
      if (!refreshing) setLoading(true); 
      
      const response = await api.get('/teacher/my-class-defaulters');
      setData(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load fee status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCall = (mobile) => {
    Linking.openURL(`tel:${mobile}`);
  };

  const handleWhatsApp = (student) => {
    const feeNames = student.pendingFees.map(f => `${f.title}: ₹${f.remainingAmount}`).join(", ");
    const message = `Dear Parent, pending fees for ${student.name} are as follows: ${feeNames}. Total due: ₹${student.totalPending}. Please clear this to ensure uninterrupted app access.`;
    Linking.openURL(`whatsapp://send?phone=91${student.mobile}&text=${encodeURIComponent(message)}`);
  };

  const renderStudentCard = (student) => (
    <View key={student.id} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.studentInfo}>
          <View style={[styles.avatar, { backgroundColor: student.isLocked ? '#fee2e2' : '#e0e7ff' }]}>
            <Text style={{ color: student.isLocked ? '#ef4444' : '#4f46e5', fontWeight: 'bold' }}>
              {student.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.roll}>Roll: #{student.rollNo}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, student.isLocked ? styles.badgeLocked : styles.badgeActive]}>
          <Text style={styles.badgeText}>{student.isLocked ? "LOCKED" : "ACTIVE"}</Text>
        </View>
      </View>

      <View style={styles.feeContainer}>
        {student.pendingFees.map((fee, idx) => (
          <View key={idx} style={styles.feeItem}>
            <Text style={styles.feeTitle}>{fee.title}</Text>
            <Text style={styles.feeAmount}>₹{fee.remainingAmount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnCall} onPress={() => handleCall(student.mobile)}>
          <FontAwesome5 name="phone-alt" size={14} color="#1e293b" />
          <Text style={styles.btnTextDark}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnWA} onPress={() => handleWhatsApp(student)}>
          <FontAwesome5 name="whatsapp" size={16} color="#fff" />
          <Text style={styles.btnTextLight}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TeacherSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        navigation={navigation} 
        activeItem="TeacherFeeStatus" 
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)}>
            <FontAwesome5 name="bars" size={20} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.headerTitle}>Class Fee Status</Text>
            <Text style={styles.headerSub}>CLASS: {data.className} (IN-CHARGE)</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView 
            contentContainerStyle={styles.list}
            // 4. Attach RefreshControl to ScrollView
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={["#4f46e5"]} // Android
                tintColor="#4f46e5" // iOS
              />
            }
          >
            {data.defaulters.length > 0 ? (
              data.defaulters.map(renderStudentCard)
            ) : (
              <View style={styles.empty}>
                <FontAwesome5 name="check-circle" size={50} color="#10b981" />
                <Text style={styles.emptyText}>All fees cleared in your class!</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: 2 },
  list: { padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  roll: { fontSize: 11, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeLocked: { backgroundColor: '#fef2f2' },
  badgeActive: { backgroundColor: '#f0fdf4' },
  badgeText: { fontSize: 9, fontWeight: 'bold', color: '#1e293b' },
  feeContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 8 },
  feeItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8 },
  feeTitle: { fontSize: 13, color: '#64748b' },
  feeAmount: { fontSize: 13, fontWeight: '800', color: '#ef4444' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btnCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  btnWA: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#25d366' },
  btnTextDark: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  btnTextLight: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, color: '#64748b', fontSize: 14 }
});