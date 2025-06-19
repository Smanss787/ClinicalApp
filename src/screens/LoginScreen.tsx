import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        await login(formData.email, formData.password);
        navigation.replace('Home');
      } catch (error: any) {
        Alert.alert(
          'Login Failed',
          error.message || 'An error occurred during login. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Language Selector Dropdown */}
      <View style={styles.languageSelectorContainer}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.languageSelectorText}>{selectedLanguage.label} ▼</Text>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <View style={styles.modalContent}>
              <FlatList
                data={LANGUAGES}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.languageOption}
                    onPress={() => {
                      setSelectedLanguage(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.languageOptionText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Logo and App Name */}
      <View style={styles.logoContainer}>
        {/* Replace with your logo image if available */}
        <View style={styles.logoPlaceholder} />
        <Text style={styles.logoText}>corMed</Text>
        <View style={styles.dot} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="What's your email?"
            placeholderTextColor="#1a2a36"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            editable={!isLoading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError, { flex: 1 }]}
              placeholder="What's your password ?"
              placeholderTextColor="#1a2a36"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>

        <View style={styles.buttonBottomContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCenter, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1a2a36" />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>No account yet ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.signUpText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  languageSelectorContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  languageSelectorText: {
    color: '#1a2a36',
    fontSize: 14,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 150,
    elevation: 5,
    marginTop: 60,
    maxHeight: 120,
  },
  languageOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#1a2a36',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#1a2a36',
    marginBottom: 10,
    // You can replace this with an Image component for your logo
  },
  logoText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#1a2a36',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a2a36',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 18,
  },
  input: {
    borderBottomWidth: 1.5,
    borderColor: '#1a2a36',
    borderRadius: 0,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a2a36',
    backgroundColor: 'transparent',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#1a2a36',
    fontSize: 13,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  button: {
    borderWidth: 1.5,
    borderColor: '#1a2a36',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 0,
  },
  buttonCenter: {
    alignSelf: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1a2a36',
    fontSize: 18,
    fontWeight: '400',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  bottomText: {
    color: '#1a2a36',
    fontSize: 14,
    opacity: 0.7,
  },
  signUpText: {
    color: '#1a2a36',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#1a2a36',
  },
  buttonBottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 40,
  },
}); 