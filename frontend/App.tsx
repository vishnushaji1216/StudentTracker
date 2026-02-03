import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';

// Admin Screens
import AdminDashScreen from './src/screens/Admin/AdminDashScreen';
import AddUserScreen from './src/screens/Admin/AddUserScreen';
import TeacherRegistryScreen from './src/screens/Admin/TeacherRegistryScreen';
import StudentRegistryScreen from './src/screens/Admin/StudentRegistryScreen';
import TeacherDetailScreen from './src/screens/Admin/TeacherDetailScreen';
import StudentDetailScreen from './src/screens/Admin/StudentDetailScreen';
import AdminSettingScreen from './src/screens/Admin/AdminSettingScreen';
import PromotionToolScreen from './src/screens/Admin/PromotionToolScreen';
import AdminBroadcastScreen from './src/screens/Admin/AdminBroadcastScreen';

// Teacher Screens
import TeacherDashScreen from './src/screens/Teacher/TeacherDashScreen';
import TStudentDetailScreen from './src/screens/Teacher/TStudentDetailScreen';
import TeacherSettingScreen from './src/screens/Teacher/TeacherSettingScreen';
import TClassDetailScreen from './src/screens/Teacher/TClassDetailScreen';
import StudentDirectoryScreen from './src/screens/Teacher/StudentDirectoryScreen';
import MyClassesScreen from './src/screens/Teacher/MyClassesScreen';
import HandwritingReviewScreen from './src/screens/Teacher/HandwritingReviewScreen';
import AudioReviewScreen from './src/screens/Teacher/AudioReviewScreen';
import DailyTaskScreen from './src/screens/Teacher/DailyTaskScreen';
import NoticeBoardScreen from './src/screens/Teacher/NoticeBoardScreen';
import ResourceLibraryScreen from './src/screens/Teacher/ResourceLibraryScreen';
import TeacherGradebookScreen from './src/screens/Teacher/TeacherGradebookScreen';

// Quiz Screens
import QuizDashboardScreen from './src/screens/Teacher/Quiz/QuizDashboardScreen';
import QuizSetupScreen from './src/screens/Teacher/Quiz/QuizSetupScreen';
import QuestionBuilderScreen from './src/screens/Teacher/Quiz/QuestionBuilderScreen';
import LiveQuizMonitorScreen from './src/screens/Teacher/Quiz/LiveQuizMonitorScreen';
import QuizResultScreen from './src/screens/Teacher/Quiz/QuizResultScreen';
import QuizEditScreen from './src/screens/Teacher/Quiz/QuizEditScreen';

// Student
import StudentDashScreen from './src/screens/Student/StudentDashScreen';
import AudioRecordScreen from './src/screens/Student/AudioRecorderScreen';
import StudentNoticeBoardScreen from './src/screens/Student/StudentNoticeBoardScreen';
import StudentProfileScreen from './src/screens/Student/StudentProfileScreen';
import StudentResourceScreen from './src/screens/Student/StudentResourceScreen'
import StudentStatsScreen from './src/screens/Student/StudentStatsScreen';
import StudentQuizCenterScreen from './src/screens/Student/Quiz/StudentQuizCenterScreen'
import QuizInstructionScreen from './src/screens/Student/Quiz/QuizInstructionScreen'
import QuizPlayerScreen from './src/screens/Student/Quiz/QuizPlayerScreen'
import StudentQuizResultScreen from './src/screens/Student/Quiz/StudentQuizResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 1. Check for stored credentials
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('role');

        // 2. Determine where to go
        if (token && role) {
          if (role === 'teacher') {
            setInitialRoute('TeacherDash');
          } else if (role === 'parent' || role === 'student') {
            setInitialRoute('StudentDash');
          } else if (role === 'admin') {
            setInitialRoute('AdminDash');
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        // 3. Stop loading and render the App
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Show a blank loading screen while checking storage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>

        {/* Root */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Student */}
        <Stack.Screen name="StudentDash" component={StudentDashScreen} />
        <Stack.Screen name="AudioRecorder" component={AudioRecordScreen} />
        <Stack.Screen name="StudentNoticeBoard" component={StudentNoticeBoardScreen} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="StudentResource" component={StudentResourceScreen} />
        <Stack.Screen name="StudentStats" component={StudentStatsScreen} />
        <Stack.Screen name="StudentQuizCenter" component={StudentQuizCenterScreen} />
        <Stack.Screen name="QuizInstruction" component={QuizInstructionScreen} />
        <Stack.Screen name="QuizPlayer" component={QuizPlayerScreen} />
        <Stack.Screen name="StudentQuizResult" component={StudentQuizResultScreen} />

        {/* Teacher */}
        <Stack.Screen name="TeacherDash" component={TeacherDashScreen} />
        <Stack.Screen name="TStudentDetail" component={TStudentDetailScreen} />
        <Stack.Screen name="TeacherSetting" component={TeacherSettingScreen} />
        <Stack.Screen name="TClassDetail" component={TClassDetailScreen} />
        <Stack.Screen name="StudentDirectory" component={StudentDirectoryScreen} />
        <Stack.Screen name="MyClasses" component={MyClassesScreen} />
        <Stack.Screen name="HandwritingReview" component={HandwritingReviewScreen} />
        <Stack.Screen name="AudioReview" component={AudioReviewScreen} />
        <Stack.Screen name="DailyTask" component={DailyTaskScreen} />
        <Stack.Screen name="NoticeBoard" component={NoticeBoardScreen} />
        <Stack.Screen name="ResourceLibrary" component={ResourceLibraryScreen} />
        <Stack.Screen name="TeacherGradebook" component={TeacherGradebookScreen} />

        {/* Quiz */}
        <Stack.Screen name="QuizDashboard" component={QuizDashboardScreen} />
        <Stack.Screen name="QuizSetup" component={QuizSetupScreen} />
        <Stack.Screen name="QuestionBuilder" component={QuestionBuilderScreen} />
        <Stack.Screen name="LiveQuizMonitor" component={LiveQuizMonitorScreen} />
        <Stack.Screen name="QuizResult" component={QuizResultScreen} />
        <Stack.Screen name="QuizEdit" component={QuizEditScreen} />

        {/* Admin */}
        <Stack.Screen name="AdminDash" component={AdminDashScreen} />
        <Stack.Screen name="AddUser" component={AddUserScreen} />
        <Stack.Screen name="TeacherRegistry" component={TeacherRegistryScreen} />
        <Stack.Screen name="StudentRegistry" component={StudentRegistryScreen} />
        <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} />
        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
        <Stack.Screen name="AdminSetting" component={AdminSettingScreen} />
        <Stack.Screen name="PromotionTool" component={PromotionToolScreen} />
        <Stack.Screen name="Broadcast" component={AdminBroadcastScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};