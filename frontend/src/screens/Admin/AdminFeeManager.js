import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import api from '../../services/api';

export default function AdminFeeManager({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  // Classes List (You can fetch this dynamically if you prefer)
  const classes = ['All', '1-A', '2-A', '3-A', '4-A', '5-A', '6-A', '7-A', '8-A', '9-A', '10-A'];

  useEffect(() => {
    fetchDefaulters();
  }, [selectedClass]); // Refetch when class changes

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      // We pass the class filter to the backend to reduce data transfer
      const res = await api.get(`/admin/fee-defaulters?className=${selectedClass}`);
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle Local Search (Instant filtering)
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lowerSearch = search.toLowerCase();
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(lowerSearch) || 
        s.grNumber.toLowerCase().includes(lowerSearch)
      );
      setFilteredStudents(filtered);
    }
  }, [search, students]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDefaulters();
  }, [selectedClass]);

  const renderStudentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('AdminFeeCollection', { student: item })}
    >
      {/* 1. Avatar Section */}
      <View style={styles.avatarContainer}>
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </View>
        )}
      </View>

      {/* 2. Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.details}>Class {item.className} • GR: {item.grNumber}</Text>
        
        {item.oldestDueDate && (
           <View style={styles.dateBadge}>
             <FontAwesome5 name="clock" size={10} color="#dc2626" />
             <Text style={styles.dateText}>
               Due {new Date(item.oldestDueDate).toLocaleDateString()}
             </Text>
           </View>
        )}
      </View>

      {/* 3. Amount Section */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Due</Text>
        <Text style={styles.amount}>₹{item.totalDue.toLocaleString()}</Text>
        <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fee Management</Text>
          <View style={styles.searchBox}>
            <FontAwesome5 name="search" size={14} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search Name or GR No..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94a3b8"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <FontAwesome5 name="times-circle" size={14} color="#94a3b8" solid />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CLASS FILTER (Horizontal Scroll) */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={classes}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.filterChip, selectedClass === item && styles.filterChipActive]}
                onPress={() => setSelectedClass(item)}
              >
                <Text style={[styles.filterText, selectedClass === item && styles.filterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* STUDENT LIST */}
        {loading ? (
           <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
        ) : (
          <FlatList 
            data={filteredStudents}
            renderItem={renderStudentCard}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FontAwesome5 name="check-circle" size={40} color="#10b981" />
                <Text style={styles.emptyText}>No pending fees found!</Text>
              </View>
            }
          />
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  safeArea: { flex: 1 },
  
  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },

  /* Filters */
  filterContainer: { backgroundColor: '#fff', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  /* List */
  listContent: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  
  avatarContainer: { marginRight: 12 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5' },

  infoContainer: { flex: 1 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  details: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dateText: { fontSize: 10, color: '#dc2626', fontWeight: 'bold' },

  amountContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  amountLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});