import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

export default function LockedScreen({ studentData, onLogout }) {
  // Use the fees populated from your backend profile API
  const pendingFees = studentData.fees || [];
  const totalDue = pendingFees.reduce((sum, item) => sum + item.remainingAmount, 0);

  const handleCallSchool = () => {
    // Replace with your actual school office number
    Linking.openURL('tel:91000000000'); 
  };

  const handleWhatsApp = () => {
     // Optional: Direct link to admin WhatsApp for proof of payment
     Linking.openURL('whatsapp://send?phone=91000000000&text=I have paid the fees for ' + studentData.name);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ef4444" />
      
      {/* 1. WARNING HEADER */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="lock" size={40} color="#ef4444" />
        </View>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.subtitle}>
          Your access to Stella App has been suspended due to overdue fee payments.
        </Text>
      </View>

      <SafeAreaView style={styles.content} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          
          {/* 2. TOTAL DUE CARD */}
          <View style={styles.totalCard}>
             <Text style={styles.totalLabel}>TOTAL OUTSTANDING</Text>
             <Text style={styles.totalAmount}>₹{totalDue.toLocaleString()}</Text>
          </View>

          {/* 3. FEE BREAKDOWN */}
          <Text style={styles.sectionTitle}>PENDING INVOICES</Text>
          {pendingFees.length > 0 ? (
            pendingFees.map((fee, index) => (
              <View key={index} style={styles.feeCard}>
                <View style={styles.feeLeft}>
                  <Text style={styles.feeTitle}>{fee.title}</Text>
                  <Text style={styles.feeDate}>Due: {new Date(fee.dueDate).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.feeAmount}>₹{fee.remainingAmount}</Text>
              </View>
            ))
          ) : (
            // Fallback if lock is manual but no specific fee is tagged
            <View style={styles.unknownBox}>
                <Text style={styles.unknownText}>Contact admin for details.</Text>
            </View>
          )}

          {/* 4. INSTRUCTION BOX */}
          <View style={styles.infoBox}>
            <FontAwesome5 name="info-circle" size={16} color="#64748b" />
            <Text style={styles.infoText}>
              Services like Homework, Attendance, and Exam Results are disabled. Access will be restored automatically once the payment is recorded by the school office.
            </Text>
          </View>

        </ScrollView>

        {/* 5. FOOTER ACTIONS */}
        <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCallSchool}>
                <FontAwesome5 name="phone-alt" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Call School Office</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onLogout}>
                <Text style={styles.secondaryBtnText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  /* Header */
  header: {
    backgroundColor: '#ef4444',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#fecaca', textAlign: 'center', lineHeight: 20 },

  /* Content */
  content: { flex: 1, paddingHorizontal: 25 },
  
  totalCard: { 
    alignSelf: 'center', 
    backgroundColor: '#fff', 
    marginTop: 25, // Overlap effect
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    borderWidth: 1, borderColor: '#fef2f2',
    minWidth: 200,
    marginBottom: 30
  },
  totalLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '800', color: '#dc2626' },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },

  feeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  feeLeft: { flex: 1 },
  feeTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  feeDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  feeAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },

  unknownBox: { padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 8 },
  unknownText: { color: '#94a3b8', fontStyle: 'italic' },

  infoBox: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 20, 
    padding: 16, 
    backgroundColor: '#fff7ed', 
    borderRadius: 12,
    borderWidth: 1, borderColor: '#ffedd5'
  },
  infoText: { flex: 1, fontSize: 12, color: '#9a3412', lineHeight: 18 },

  /* Footer */
  footer: { paddingVertical: 10, gap: 15 },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1e293b', shadowOpacity: 0.3, shadowRadius: 5, elevation: 4
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  secondaryBtn: { padding: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
});