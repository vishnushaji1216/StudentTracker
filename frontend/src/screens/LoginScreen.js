import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import { loginUser } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');

export default function LoginScreen({ navigation, route }) {  // <-- Added navigation prop
  const skipAnimation = route?.params?.skipAnimation || false;
  const [animationState, setAnimationState] = useState('initial');
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [showPassword, setShowPassword] = useState(false);
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoPosition = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const panelPosition = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (skipAnimation) {
      // Immediately set final positions without animation
      logoPosition.setValue(1);
      titleOpacity.setValue(0);
      panelPosition.setValue(0);
      setAnimationState('final');
      return;
    }
    // Start animation sequence
    setTimeout(() => {
      // Move logo up and fade title
      Animated.parallel([
        Animated.timing(logoPosition, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      setAnimationState('moving');
    }, 1500);

    setTimeout(() => {
      // Slide panel up
      Animated.spring(panelPosition, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      setAnimationState('final');
    }, 2500);
  }, []);

  const logoTranslateY = logoPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.25],
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  

  const handleLogin = async () => {
    // Validation
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter your mobile number or ID');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(selectedRole, input, password);
      
      // Store token and user data
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('role', response.role);

      // Navigate based on role
      if (response.role === 'teacher') {
        navigation.replace('TeacherDash');
      } else if (response.role === 'parent') {
        navigation.replace('StudentDash');
      } else if (response.role === 'admin') {
        navigation.replace('AdminDash');
      }
      

    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Gradient */}
      <View style={styles.background} />

      {/* Logo and Title */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }]}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('./assets/stella-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          Stella Student Tracker
        </Animated.Text>
      </Animated.View>


      {/* Login Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateY: panelPosition }],
          },
        ]}
      >
        <View style={styles.panelContent}>
          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome Back</Text>

          {/* Role Selector */}
          <View style={styles.roleSelector}>
            <View style={styles.roleSelectorBackground}>
              <Animated.View
                style={[
                  styles.roleSlider,
                  {
                    transform: [
                      {
                        translateX: selectedRole === 'parent' ? width * 0.4 : 0,
                      },
                    ],
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.roleButton}
                onPress={() => setSelectedRole('teacher')}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'teacher' && styles.roleTextActive,
                  ]}
                >
                  Teacher
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.roleButton}
                onPress={() => setSelectedRole('parent')}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'parent' && styles.roleTextActive,
                  ]}
                >
                  Parent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {selectedRole === 'teacher'
                ? 'Mobile Number / Teacher Code'
                : 'Mobile Number / Roll No'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                selectedRole === 'teacher'
                  ? 'Enter mobile or teacher code'
                  : 'Enter mobile or roll no'
              }
              placeholderTextColor="#60A5FA"
              value={input}
              onChangeText={setInput}
              editable={!loading}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#60A5FA"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                {showPassword ? (
                  <Eye size={20} color="#60A5FA" />
                ) : (
                  <EyeOff size={20} color="#60A5FA" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <LogIn size={22} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Login</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E3A8A',
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.35,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FBBF24',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FBBF24',
    textAlign: 'center',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minheight: height * 0.55,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  panelContent: {
    flex: 1,
    padding: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 24,
  },
  roleSelector: {
    marginBottom: 24,
  },
  roleSelectorBackground: {
    backgroundColor: '#DBEAFE',
    borderRadius: 50,
    padding: 4,
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'space-between',
  },
  roleSlider: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 50,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E3A8A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E3A8A',
  },
  eyeIcon: {
    paddingRight: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});