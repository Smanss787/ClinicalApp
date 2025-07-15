import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EyeIcon } from '../components/EyeIcon';
import { BackButton } from '../components/BackButton';
import { commonStyles, COLORS } from '../constants/styles';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string;
}

export const RegisterScreen = ({ navigation }: any) => {
  const { t, getGenderOptions } = useLanguage();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [genderFieldPosition, setGenderFieldPosition] = useState({ y: 0 });

  const GENDER_OPTIONS = getGenderOptions();

  const validateForm = () => {
    const newErrors: Partial<RegisterFormData> = {};
    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.validEmail');
    }
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = t('auth.passwordRequirementsError');
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }
    if (!formData.age.trim()) {
      newErrors.age = t('auth.ageRequired');
    } else if (!/^\d+$/.test(formData.age) || parseInt(formData.age) < 1) {
      newErrors.age = t('auth.validAge');
    }
    if (!formData.gender.trim()) {
      newErrors.gender = t('auth.genderRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const allValid = () => {
    return (
      formData.email &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      formData.password &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password) &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      formData.age &&
      /^\d+$/.test(formData.age) &&
      parseInt(formData.age) > 0 &&
      formData.gender
    );
  };

  const handleNext = () => {
    if (validateForm()) {
      navigation.navigate('TermsScreen', { formData });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Top bar with back arrow */}
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <View style={styles.dot} />

        {/* Email */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={COLORS.primary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.password && styles.inputError]}
              placeholder={t('auth.choosePasswordPlaceholder')}
              placeholderTextColor={COLORS.primary}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
              <EyeIcon showPassword={showPassword} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.confirmPassword && styles.inputError]}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              placeholderTextColor={COLORS.primary}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeButton}>
              <EyeIcon showPassword={showConfirmPassword} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        {/* Password requirements */}
        <Text style={styles.passwordRequirements}>
          {t('auth.passwordRequirements')}
        </Text>

        {/* Age and Gender */}
        <View style={styles.rowInputs}>
          <View style={styles.iconInputContainer}>
            <Text style={styles.icon}>🎁</Text>
            <TextInput
              style={[styles.input, styles.iconInput, errors.age && styles.inputError]}
              placeholder={t('auth.agePlaceholder')}
              placeholderTextColor={COLORS.primary}
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              maxLength={3}
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>
          <View style={styles.iconInputContainer}>
            <Text style={styles.icon}>⚥</Text>
            <TouchableOpacity
              style={[styles.input, styles.iconInput, styles.genderDropdown, errors.gender && styles.inputError]}
              onPress={() => setGenderModalVisible(true)}
              activeOpacity={0.7}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setGenderFieldPosition({ y });
              }}
            >
              <Text style={{ color: formData.gender ? COLORS.primary : COLORS.lightGray, fontSize: 16 }}>
                {formData.gender ? GENDER_OPTIONS.find(opt => opt.value === formData.gender)?.label : t('auth.genderPlaceholder')}
              </Text>
            </TouchableOpacity>
            <Modal
              visible={genderModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setGenderModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setGenderModalVisible(false)}>
                <View style={[styles.modalContent, { marginTop: genderFieldPosition.y + 170 }]}>
                  <FlatList
                    data={GENDER_OPTIONS}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.genderOption}
                        onPress={() => {
                          setFormData({ ...formData, gender: item.value });
                          setGenderModalVisible(false);
                        }}
                      >
                        <Text style={styles.genderOptionText}>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[styles.button, !allValid() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!allValid()}
        >
          <Text style={styles.buttonText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  scrollContainer: {
    ...commonStyles.scrollContainer,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    ...commonStyles.backButton,
  },
  title: {
    ...commonStyles.title,
  },
  dot: {
    ...commonStyles.dot,
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
  inputRow: {
    ...commonStyles.inputRow,
  },
  eyeButton: {
    ...commonStyles.eyeButton,
  },
  passwordRequirements: {
    fontSize: 13,
    color: COLORS.primary,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'left',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  iconInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 22,
    marginRight: 8,
    color: COLORS.primary,
  },
  iconInput: {
    flex: 1,
  },
  button: {
    ...commonStyles.button,
  },
  buttonDisabled: {
    ...commonStyles.buttonDisabled,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
  genderDropdown: {
    justifyContent: 'center',
    height: 40,
    borderBottomWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  modalOverlay: {
    ...commonStyles.modalOverlay,
  },
  modalContent: {
    ...commonStyles.modalContent,
  },
  genderOption: {
    ...commonStyles.modalOption,
  },
  genderOptionText: {
    ...commonStyles.modalOptionText,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 5,
  },
}); 