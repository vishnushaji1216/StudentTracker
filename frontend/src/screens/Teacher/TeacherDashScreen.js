import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  BackHandler,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import TeacherSidebar from "../../components/TeacherSidebar";
import api from "../../services/api";

export default function TeacherDashScreen({ navigation }) {
  // --- STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard Data State
  const [stats, setStats] = useState({
    className: "...",
    classPerformance: {
      currentAvg: 0,
      trend: 0,
      history: []
    },
    pendingTasks: {
      audio: 0,
      handwriting: 0,
      total: 0
    }
  });

  // --- API CALL ---
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/teacher/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // --- HANDLERS ---
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isSidebarOpen]);

  // --- GRAPH ENGINE ---
  const generateGraphPath = (history) => {
    if (!history || history.length < 3) return { line: "", area: "", points: [] };

    const getPoint = (index, score) => {
      const x = index * 130 + 20;
      const y = 90 - (score * 0.8);
      return { x, y };
    };

    const p1 = getPoint(0, history[0].score);
    const p2 = getPoint(1, history[1].score);
    const p3 = getPoint(2, history[2].score);

    const linePath = `
      M ${p1.x},${p1.y} 
      C ${p1.x + 65},${p1.y} ${p2.x - 65},${p2.y} ${p2.x},${p2.y}
      C ${p2.x + 65},${p2.y} ${p3.x - 65},${p3.y} ${p3.x},${p3.y}
    `;

    const areaPath = `${linePath} L 280,100 L 20,100 Z`;

    return { line: linePath, area: areaPath, points: [p1, p2, p3] };
  };

  const { line, area, points } = generateGraphPath(stats.classPerformance.history);

  // --- DONUT CHART CONSTANTS ---
  const donutSize = 80; // Reduced from 100
  const strokeWidth = 8; // Reduced from 10
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TeacherSidebar 
        navigation={navigation} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeItem="TeacherDash"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <FontAwesome5 name="bars" size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 120 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
             <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.contentPadding}>
              
              {/* 1. HERO: CLASS PERFORMANCE GRAPH */}
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View>
                    <Text style={styles.heroTitle}>CLASS {stats.className} PERFORMANCE</Text>
                    <View style={styles.heroStatsRow}>
                      <Text style={styles.heroScore}>{stats.classPerformance.currentAvg}%</Text>
                      
                      <View style={[styles.heroTrend, stats.classPerformance.trend < 0 && { backgroundColor: '#fef2f2' }]}>
                        <FontAwesome5 
                          name={stats.classPerformance.trend >= 0 ? "arrow-up" : "arrow-down"} 
                          size={10} 
                          color={stats.classPerformance.trend >= 0 ? "#16a34a" : "#ef4444"} 
                        />
                        <Text style={[styles.heroTrendText, stats.classPerformance.trend < 0 && { color: "#ef4444" }]}>
                          {Math.abs(stats.classPerformance.trend)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Dynamic Chart Area */}
                <View style={styles.chartContainer}>
                  {stats.classPerformance.history.length >= 3 ? (
                    <Svg height="100%" width="100%" viewBox="0 0 300 110" preserveAspectRatio="none">
                      <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#4f46e5" stopOpacity="0.2" />
                          <Stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
                        </LinearGradient>
                      </Defs>
                      
                      <Line x1="20" y1="10" x2="280" y2="10" stroke="#f8fafc" strokeWidth="1" />
                      <Line x1="20" y1="50" x2="280" y2="50" stroke="#f8fafc" strokeWidth="1" />
                      <Line x1="20" y1="90" x2="280" y2="90" stroke="#f8fafc" strokeWidth="1" />

                      <Path d={area} fill="url(#grad)" />
                      <Path d={line} fill="none" stroke="#4f46e5" strokeWidth="3" />
                      
                      {points.map((p, i) => (
                        <React.Fragment key={i}>
                          <Circle cx={p.x} cy={p.y} r={i===2 ? 4 : 3} fill={i===2 ? "white" : "#4f46e5"} stroke={i===2 ? "#4f46e5" : "none"} strokeWidth={i===2 ? 2 : 0}/>
                          <SvgText 
                            x={p.x} 
                            y={p.y - 12} 
                            fontSize="10" 
                            fill="#4f46e5" 
                            fontWeight="bold" 
                            textAnchor="middle"
                          >
                            {stats.classPerformance.history[i].score}%
                          </SvgText>
                        </React.Fragment>
                      ))}
                    </Svg>
                  ) : (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                        <Text style={{color:'#94a3b8', fontSize:12}}>Need 3 exams to generate graph</Text>
                    </View>
                  )}
                </View>

                {/* X-Axis Labels */}
                <View style={styles.chartLabels}>
                  {stats.classPerformance.history.map((item, index) => (
                    <View key={index} style={{ width: 80, alignItems: (index === 0 ? 'flex-start' : index === 2 ? 'flex-end' : 'center') }}>
                        <Text style={[
                            styles.chartLabel, 
                            { textAlign: (index === 0 ? 'left' : index === 2 ? 'right' : 'center') }
                        ]}>
                          {item.label}
                        </Text>
                    </View>
                  ))}
                  {stats.classPerformance.history.length === 0 && <Text style={styles.chartLabel}>No Data</Text>}
                </View>
              </View>

              {/* 2. PENDING REVIEWS - TWO DONUTS IN ONE CARD */}
              <View style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <Text style={styles.cardSubtitle}>PENDING REVIEWS</Text>
                  <View style={styles.timeRow}>
                    <FontAwesome5 name="clock" size={10} color="#818cf8" />
                    <Text style={styles.timeText}>Updated Just Now</Text>
                  </View>
                </View>

                <View style={styles.donutRow}>
                  {/* Audio Donut */}
                  <View style={styles.donutSection}>
                    <View style={{ width: donutSize, height: donutSize, justifyContent: 'center', alignItems: 'center' }}>
                      <Svg width={donutSize} height={donutSize}>
                        <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#FEE2E2" strokeWidth={strokeWidth} fill="transparent" />
                        <Circle
                          cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#EF4444" strokeWidth={strokeWidth}
                          strokeDasharray={[circumference]} 
                          strokeDashoffset={circumference * (1 - (stats.pendingTasks.audio / Math.max(stats.pendingTasks.total, 1)))} 
                          strokeLinecap="round" fill="transparent" rotation="-90" origin={`${donutSize / 2}, ${donutSize / 2}`}
                        />
                      </Svg>
                      <View style={styles.donutInner}>
                        <Text style={[styles.donutText, { color: '#EF4444' }]}>{stats.pendingTasks.audio}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'center', marginTop: 8 }}>
                      <View style={styles.donutIconBox}>
                        <FontAwesome5 name="microphone" size={12} color="#EF4444" />
                      </View>
                      <Text style={styles.donutLabel}>AUDIO</Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Handwriting Donut */}
                  <View style={styles.donutSection}>
                    <View style={{ width: donutSize, height: donutSize, justifyContent: 'center', alignItems: 'center' }}>
                      <Svg width={donutSize} height={donutSize}>
                        <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#E0E7FF" strokeWidth={strokeWidth} fill="transparent" />
                        <Circle
                          cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#4F46E5" strokeWidth={strokeWidth}
                          strokeDasharray={[circumference]} 
                          strokeDashoffset={circumference * (1 - (stats.pendingTasks.handwriting / Math.max(stats.pendingTasks.total, 1)))} 
                          strokeLinecap="round" fill="transparent" rotation="-90" origin={`${donutSize / 2}, ${donutSize / 2}`}
                        />
                      </Svg>
                      <View style={styles.donutInner}>
                        <Text style={[styles.donutText, { color: '#4F46E5' }]}>{stats.pendingTasks.handwriting}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'center', marginTop: 8 }}>
                      <View style={[styles.donutIconBox, { backgroundColor: '#EEF2FF' }]}>
                        <FontAwesome5 name="pen" size={12} color="#4F46E5" />
                      </View>
                      <Text style={styles.donutLabel}>WRITING</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 3. QUICK ACTIONS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                <View style={styles.actionGrid}>
                  <ActionBtn label="New Gradebook" icon="marker" color="#0ea5e9" bg="#e0f2fe" onPress={() => navigation.navigate('TeacherGradebook')} />
                  <ActionBtn label="Create Quiz" icon="plus-circle" color="#4f46e5" bg="#eef2ff" onPress={() => navigation.navigate('QuizDashboard')} />
                  <ActionBtn label="Broadcast" icon="bullhorn" color="#db2777" bg="#fce7f3" onPress={() => navigation.navigate('NoticeBoard')} />
                  <ActionBtn label="Students" icon="users" color="#d97706" bg="#fffbeb" onPress={() => navigation.navigate('StudentDirectory')} />
                </View>
              </View>

            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherDash')}>
            <FontAwesome5 name="chart-pie" size={20} color={activeView === 'dashboard' ? "#4f46e5" : "#94a3b8"} />
            <Text style={[styles.navLabel, activeView === 'dashboard' && { color: '#4f46e5' }]}>Dash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyClasses')}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color={activeView === 'MyClasses' ? "#4f46e5" : "#94a3b8"} />
            <Text style={[styles.navLabel, activeView === 'MyClasses' && { color: '#4f46e5' }]}>Classes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeacherGradebook')}>
            <FontAwesome5 name="clipboard-list" size={20} color={activeView === 'Gradebook' ? "#4f46e5" : "#94a3b8"} />
            <Text style={[styles.navLabel, activeView === 'Gradebook' && { color: '#4f46e5' }]}>Grades</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const ActionBtn = ({ label, icon, color, bg, onPress }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress}>
    <FontAwesome5 name={icon} size={20} color={color} style={{ marginBottom: 8 }} />
    <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  menuButton: { padding: 4 },
  scrollContent: { flex: 1 },
  contentPadding: { padding: 20 },
  
  heroCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2, marginBottom: 20 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  heroScore: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroTrend: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  heroTrendText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },
  chartContainer: { height: 110, width: '100%', marginBottom: 12 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  chartLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  
  // COMMON STYLES
  cardSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  
  // PENDING REVIEWS CARD STYLES
  pendingCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    shadowColor: '#000', 
    shadowOpacity: 0.02, 
    shadowRadius: 8, 
    elevation: 2,
    marginBottom: 24
  },
  pendingHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  donutRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-around' 
  },
  donutSection: { 
    flex: 1, 
    alignItems: 'center' 
  },
  divider: { 
    width: 1, 
    height: 100, 
    backgroundColor: '#e2e8f0' 
  },
  donutInner: { 
    position: 'absolute', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    height: '100%' 
  },
  donutText: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  donutIconBox: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#FEE2E2', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  donutLabel: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#64748b', 
    letterSpacing: 0.5 
  },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: { width: '48%', padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  actionBtnText: { fontSize: 12, fontWeight: 'bold' },
  
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, justifyContent: 'space-around', alignItems: 'center', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
});