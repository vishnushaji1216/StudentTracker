import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../../services/api';

export default function AdminFeeCollection({ route, navigation }) {
  const { student } = route.params; 
  
  const [loading, setLoading] = useState(true);
  const [feeData, setFeeData] = useState({ fees: [], history: [], isLocked: false, contact: '' });
  const [modalVisible, setModalVisible] = useState(false);
  const [addFeeModal, setAddFeeModal] = useState(false);
  
  // Payment Form State
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash'); 
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add New Fee State
  const [newFee, setNewFee] = useState({ title: '', amount: '', dueDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchFeeDetails();
  }, []);

  const fetchFeeDetails = async () => {
    try {
      const res = await api.get(`/admin/student/${student._id}/fees`);
      setFeeData(res.data);
    } catch (error) {
      Alert.alert("Error", "Could not load fee details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    // 1. Calculate the new desired state (If currently false, we want true)
    const previousState = feeData.isLocked;
    const newState = !previousState;

    // 2. Optimistic Update: Flip the switch immediately on screen
    setFeeData(prev => ({ ...prev, isLocked: newState }));

    try {
      // 3. Call API with 'lockStatus' (Required by your fee.controller.js)
      const res = await api.post('/admin/fees/lock', { 
        studentId: student._id,
        lockStatus: newState  // <--- THIS WAS MISSING
      });
      
      // 4. Sync with server response
      // Your controller returns { isLocked: boolean }
      if (res.data.isLocked !== newState) {
         setFeeData(prev => ({ ...prev, isLocked: res.data.isLocked }));
      }

    } catch (error) {
      // 5. Rollback if error
      setFeeData(prev => ({ ...prev, isLocked: previousState }));
      Alert.alert("Error", "Failed to update lock status");
    }
  };

  const handleCallParent = () => {
    const number = feeData.contact || student.mobile;
    if (number) {
      Linking.openURL(`tel:${number}`);
    } else {
      Alert.alert("Not Found", "No mobile number available.");
    }
  };

  const handleAddNewFee = async () => {
    if (!newFee.title || !newFee.amount) return Alert.alert("Required", "Please fill all fields");
    try {
      setSubmitting(true);
      await api.post('/admin/fees/assign', { 
        studentId: student._id, 
        title: newFee.title,
        totalAmount: Number(newFee.amount),
        dueDate: newFee.dueDate
      });
      setAddFeeModal(false);
      fetchFeeDetails();
    } catch (error) {
      Alert.alert("Error", "Failed to assign new fee");
    } finally {
      setSubmitting(false);
    }
  };

  const processPayment = async () => {
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/admin/fees/collect', {
        feeId: selectedFeeId,
        amount: Number(payAmount),
        mode: payMode,
        remark: remark
      });
      Alert.alert("Success", "Payment Recorded!", [
        { text: "OK", onPress: () => {
            setModalVisible(false);
            fetchFeeDetails(); 
            setRemark('');
        }}
      ]);
    } catch (error) {
      Alert.alert("Error", "Payment failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5"/></View>
  );

  const totalDue = feeData.fees.reduce((sum, f) => sum + f.remainingAmount, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      {/* 1. HEADER */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.lockRow}>
               <Text style={styles.lockText}>{feeData.isLocked ? "LOCKED" : "ACTIVE"}</Text>
               <Switch 
                 value={!feeData.isLocked} 
                 onValueChange={handleToggleLock}
                 trackColor={{ false: "#ef4444", true: "#10b981" }}
                 thumbColor="#fff"
               />
            </View>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>TOTAL OUTSTANDING</Text>
            <Text style={styles.balanceValue}>₹ {totalDue.toLocaleString()}</Text>
            <View style={styles.studentBadge}>
              <FontAwesome5 name="user-graduate" size={12} color="#4f46e5" />
              <Text style={styles.studentName}>{student.name} • {student.className}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* 2. QUICK ACTIONS */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCallParent}>
          <FontAwesome5 name="phone-alt" size={14} color="#4f46e5" />
          <Text style={styles.actionBtnText}>Call Parent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eef2ff' }]} onPress={() => setAddFeeModal(true)}>
          <FontAwesome5 name="plus" size={14} color="#4f46e5" />
          <Text style={styles.actionBtnText}>Add New Fee</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PENDING INVOICES</Text>
        {feeData.fees.map((fee) => (
            <View key={fee._id} style={styles.feeCard}>
              <View style={{flex: 1}}>
                <Text style={styles.feeTitle}>{fee.title}</Text>
                <Text style={styles.feeDue}>Due: {new Date(fee.dueDate).toLocaleDateString()}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.feeAmount}>₹{fee.remainingAmount}</Text>
                <TouchableOpacity style={styles.payBtn} onPress={() => { setSelectedFeeId(fee._id); setPayAmount(fee.remainingAmount.toString()); setModalVisible(true); }}>
                  <Text style={styles.payBtnText}>COLLECT</Text>
                </TouchableOpacity>
              </View>
            </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>RECENT TRANSACTIONS</Text>
        {feeData.history.map((txn, index) => (
            <View key={index} style={styles.historyRow}>
              <View style={{flex: 1}}>
                <Text style={styles.historyTitle}>Paid for {txn.feeTitle}</Text>
                <Text style={styles.historyDate}>{new Date(txn.date).toLocaleDateString()} • {txn.mode}</Text>
              </View>
              <Text style={styles.historyAmount}>+ ₹{txn.amount}</Text>
            </View>
        ))}
        <View style={{height: 40}} />
      </ScrollView>

      {/* 3. MODAL: ADD NEW FEE */}
      <Modal 
        visible={addFeeModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setAddFeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign New Fee</Text>
            <TextInput 
              placeholder="Fee Title" 
              placeholderTextColor="#94a3b8"
              style={styles.input} 
              onChangeText={(t) => setNewFee({...newFee, title: t})} 
            />
            <TextInput 
              placeholder="Amount" 
              placeholderTextColor="#94a3b8"
              keyboardType="numeric" 
              style={[styles.input, { marginTop: 10 }]} 
              onChangeText={(t) => setNewFee({...newFee, amount: t})} 
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddNewFee} disabled={submitting}>
               {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitText}>ASSIGN FEE</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddFeeModal(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. MODAL: COLLECT PAYMENT */}
      <Modal 
        visible={modalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TextInput 
               style={styles.input} 
               value={payAmount} 
               onChangeText={setPayAmount} 
               keyboardType="numeric" 
               placeholderTextColor="#94a3b8"
            />
            <View style={styles.modeRow}>
                {['Cash', 'Online', 'UPI', 'Cheque'].map(m => (
                    <TouchableOpacity key={m} style={[styles.modeChip, payMode === m && styles.modeActive]} onPress={() => setPayMode(m)}>
                        <Text style={[styles.modeText, payMode === m && styles.modeTextActive]}>{m}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TextInput 
               style={[styles.input, { marginTop: 10 }]} 
               placeholder="Remark" 
               placeholderTextColor="#94a3b8"
               value={remark} 
               onChangeText={setRemark} 
            />
            <TouchableOpacity style={styles.submitBtn} onPress={processPayment} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitText}>CONFIRM PAYMENT</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4f46e5', paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  lockText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  balanceCard: { alignItems: 'center', marginTop: 10 },
  balanceLabel: { color: '#e0e7ff', fontSize: 10, fontWeight: 'bold' },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  studentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginTop: 8 },
  studentName: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },
  actionRow: { flexDirection: 'row', gap: 12, padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  actionBtnText: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 },
  feeCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  feeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  feeDue: { fontSize: 11, color: '#ef4444' },
  feeAmount: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  payBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  payBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  historyRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
  historyTitle: { fontSize: 13, fontWeight: '600', color: '#334155' },
  historyDate: { fontSize: 11, color: '#94a3b8' },
  historyAmount: { fontSize: 13, fontWeight: 'bold', color: '#16a34a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  input: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#1e293b' },
  modeRow: { flexDirection: 'row', gap: 10, marginVertical: 15, flexWrap: 'wrap' },
  modeChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  modeActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  modeText: { fontSize: 12, color: '#64748b' },
  modeTextActive: { color: '#4f46e5', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});