import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  RefreshControl 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import TeacherSidebar from "../../components/TeacherSidebar"; 
import api from "../../services/api"; 

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function StudentDirectoryScreen({ navigation }) {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Data State
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classOptions, setClassOptions] = useState(["All Classes"]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [error, setError] = useState(null); 

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchDirectory();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    filterData();
  }, [searchQuery, selectedClass, students]);

  // --- BACK HANDLER ---
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      navigation.navigate('TeacherDash');
      return true;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- API CALL ---
  const fetchDirectory = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      const response = await api.get('/teacher/students');
      const data = response.data;
      
      setStudents(data);

      const uniqueClasses = [...new Set(data.map(s => s.className))].sort();
      setClassOptions(["All Classes", ...uniqueClasses]);
      
    } catch (err) {
      console.error("Fetch Directory Error:", err);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDirectory();
  }, []);

  const filterData = () => {
    let result = students;

    if (selectedClass !== "All Classes") {
      result = result.filter(s => s.className === selectedClass);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lowerQuery) || 
        (s.rollNo && s.rollNo.toString().includes(lowerQuery))
      );
    }

    setFilteredStudents(result);
  };

  // --- UI HELPERS ---
  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectClass = (item) => {
    setSelectedClass(item);
    toggleDropdown();
  };

  const getAvatarProps = (name) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "??";
    const colors = [
        { bg: '#eef2ff', text: '#4f46e5' }, 
        { bg: '#f0fdf4', text: '#16a34a' }, 
        { bg: '#fff7ed', text: '#f97316' }, 
        { bg: '#f8fafc', text: '#475569' }, 
        { bg: '#fefce8', text: '#ca8a04' }, 
    ];
    const index = name ? name.length % colors.length : 0;
    return { initials, ...colors[index] };
  };

  const renderStudentCard = ({ item }) => {
    const { initials, bg, text } = getAvatarProps(item.name);
    // Removed avgScore calculation here

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TStudentDetail', { studentId: item._id })}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.avatarBox, { backgroundColor: bg }]}>
            <Text style={[styles.avatarText, { color: text }]}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentInfo}>Roll {item.rollNo || '-'} • {item.className}</Text>
          </View>
        </View>
        
        {/* Just showing the arrow now */}
        <View style={styles.cardRight}>
          <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" />
        </View>
      </TouchableOpacity>
    );
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TeacherSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        activeItem="StudentDirectory"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
            <FontAwesome5 name="bars" size={20} color="#334155" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Directory</Text>
            <Text style={styles.headerSub}>ALL STUDENTS</Text>
          </View>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.mainContainer}>
          
          {/* Filters & Search */}
          <View style={styles.filterSection}>
            <View style={styles.searchBox}>
              <FontAwesome5 name="search" size={14} color="#94a3b8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search name or roll no..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.dropdownContainer}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={toggleDropdown} activeOpacity={0.8}>
                <Text style={styles.dropdownText}>{selectedClass}</Text>
                <FontAwesome5 name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={12} color="#64748b" />
              </TouchableOpacity>
              
              {isDropdownOpen && (
                <View style={styles.dropdownList}>
                  {classOptions.map((option, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.dropdownItem, index !== classOptions.length - 1 && styles.dropdownItemBorder]}
                      onPress={() => selectClass(option)}
                    >
                      <Text style={[styles.dropdownItemText, selectedClass === option && { color: '#4f46e5', fontWeight: 'bold' }]}>
                        {option}
                      </Text>
                      {selectedClass === option && <FontAwesome5 name="check" size={10} color="#4f46e5" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* List Area */}
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
          ) : error ? (
            <View style={styles.centerBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchDirectory} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={item => item._id}
              renderItem={renderStudentCard}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>No students found.</Text>
              }
            />
          )}
        </View>

        {/* BOTTOM NAV */}
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
            <FontAwesome5 name="users" size={20} color="#4f46e5" />
            <Text style={[styles.navLabel, { color: '#4f46e5' }]}>Students</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  menuButton: { padding: 4 },

  mainContainer: { flex: 1, padding: 16 },

  filterSection: { marginBottom: 16, zIndex: 20 }, 
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  
  dropdownContainer: { position: 'relative', zIndex: 30 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  dropdownText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  dropdownList: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, paddingVertical: 4 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: 'bold' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  studentInfo: { fontSize: 10, color: '#94a3b8' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Removed avgBadge and avgText styles

  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  /* Error & Empty States */
  centerBox: { alignItems: 'center', marginTop: 50 },
  errorText: { color: '#ef4444', marginBottom: 10 },
  retryBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#94a3b8' }
});