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
import { useLanguage } from '../context/LanguageContext';
import { EyeIcon } from '../components/EyeIcon';
import { commonStyles, COLORS } from '../constants/styles';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const { t, getAvailableLanguages, setLanguage, currentLanguage } = useLanguage();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const LANGUAGES = getAvailableLanguages();
  const selectedLanguage = LANGUAGES.find(lang => lang.value === currentLanguage) || LANGUAGES[0];

  const validateForm = () => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.validEmail');
    }

    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
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
          t('auth.loginFailed'),
          error.message || t('auth.loginError')
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLanguageChange = (language: { label: string; value: string }) => {
    setLanguage(language.value as any);
    setModalVisible(false);
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
                    onPress={() => handleLanguageChange(item)}
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
        <View style={styles.logoPlaceholder} />
        <Text style={styles.logoText}>corMed</Text>
        <View style={styles.dot} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={COLORS.primary}
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
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={COLORS.primary}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
              <EyeIcon showPassword={showPassword} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        <View style={styles.buttonBottomContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCenter, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.buttonText}>{t('auth.login')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>{t('auth.noAccountYet')} </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.signUpText}>{t('auth.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    justifyContent: 'flex-start',
  },
  languageSelectorContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  languageSelectorText: {
    ...commonStyles.languageSelectorText,
  },
  modalOverlay: {
    ...commonStyles.modalOverlay,
    justifyContent: 'flex-start',
  },
  modalContent: {
    ...commonStyles.modalContent,
    marginTop: 60,
    maxHeight: 100,
  },
  languageOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  languageOptionText: {
    ...commonStyles.modalOptionText,
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
    borderColor: COLORS.primary,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '400',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    marginBottom: 10,
  },
  dot: {
    ...commonStyles.dot,
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  inputContainer: {
    ...commonStyles.inputContainer,
  },
  input: {
    ...commonStyles.input,
  },
  inputError: {
    ...commonStyles.inputError,
  },
  errorText: {
    ...commonStyles.errorText,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  button: {
    ...commonStyles.button,
    width: '50%',
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 0,
    minHeight: 50,
  },
  buttonCenter: {
    ...commonStyles.buttonCenter,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  bottomText: {
    color: COLORS.primary,
    fontSize: 14,
    opacity: 0.7,
  },
  signUpText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
  inputRow: {
    ...commonStyles.inputRow,
  },
  eyeButton: {
    ...commonStyles.eyeButton,
  },
  buttonBottomContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 40,
    minHeight: 120,
  },
}); 