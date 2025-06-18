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

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Rather not say', value: 'na' },
];

export const RegisterScreen = ({ navigation }: any) => {
  // const { register } = useAuth();
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

  const validateForm = () => {
    const newErrors: Partial<RegisterFormData> = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = 'Password does not meet requirements';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (!/^\d+$/.test(formData.age) || parseInt(formData.age) < 1) {
      newErrors.age = 'Enter a valid age';
    }
    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Create your account</Text>
        <View style={styles.dot} />

        {/* Email */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="What's your email?"
            placeholderTextColor="#1a2a36"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.password && styles.inputError]}
              placeholder="Choose your password"
              placeholderTextColor="#1a2a36"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              placeholderTextColor="#1a2a36"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeButton}>
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Password requirements */}
        <Text style={styles.passwordRequirements}>
          Your password must contain at least 8 characters, one upper case, one lower case and one number.
        </Text>

        {/* Age and Gender */}
        <View style={styles.rowInputs}>
          <View style={styles.iconInputContainer}>
            <Text style={styles.icon}>🎁</Text>
            <TextInput
              style={[styles.input, styles.iconInput, errors.age && styles.inputError]}
              placeholder="Age"
              placeholderTextColor="#1a2a36"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              maxLength={3}
            />
          </View>
          <View style={styles.iconInputContainer}>
            <Text style={styles.icon}>⚥</Text>
            <TouchableOpacity
              style={[styles.input, styles.iconInput, styles.genderDropdown, errors.gender && styles.inputError]}
              onPress={() => setGenderModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: formData.gender ? '#1a2a36' : '#aaa', fontSize: 16 }}>
                {formData.gender ? GENDER_OPTIONS.find(opt => opt.value === formData.gender)?.label : 'Gender'}
              </Text>
            </TouchableOpacity>
            <Modal
              visible={genderModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setGenderModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setGenderModalVisible(false)}>
                <View style={styles.modalContent}>
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
          </View>
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[styles.button, !allValid() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!allValid()}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    fontSize: 28,
    color: '#1a2a36',
    fontWeight: '300',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2a36',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a2a36',
    alignSelf: 'center',
    marginBottom: 30,
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
  passwordRequirements: {
    fontSize: 13,
    color: '#1a2a36',
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
    color: '#1a2a36',
  },
  iconInput: {
    flex: 1,
  },
  button: {
    borderWidth: 1.5,
    borderColor: '#1a2a36',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#1a2a36',
    fontSize: 18,
    fontWeight: '400',
  },
  genderDropdown: {
    justifyContent: 'center',
    height: 40,
    borderBottomWidth: 1.5,
    borderColor: '#1a2a36',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
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
    marginTop: 120,
    maxHeight: 200,
  },
  genderOption: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#1a2a36',
  },
}); 