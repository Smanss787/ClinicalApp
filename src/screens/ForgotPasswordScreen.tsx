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
  Modal,
  Pressable,
  FlatList,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface ForgotPasswordFormData {
  email: string;
}

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [modalVisible, setModalVisible] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<ForgotPasswordFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        await resetPassword(formData.email);
        Alert.alert(
          'Reset Link Sent',
          'If an account exists with this email, you will receive a password reset link.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } catch (error: any) {
        Alert.alert(
          'Reset Failed',
          error.message || 'An error occurred while sending the reset link. Please try again.'
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
      {/* Top bar with back arrow and language dropdown */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
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
        <View style={{ width: 32 }} /> {/* Spacer to balance the back arrow */}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Password reset</Text>
        <View style={styles.dot} />
        <Text style={styles.instructions}>
          Please enter your email address.{"\n"}
          You will receive an email with a link{"\n"}
          to reset your password.
        </Text>

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

        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            If you don't receive any email, please contact corMed's support :
          </Text>
          <Text
            style={styles.supportEmail}
            onPress={() => Linking.openURL('mailto:support@ihu-reconnect.com')}
          >
            support@ihu-reconnect.com
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1a2a36" />
          ) : (
            <Text style={styles.buttonText}>Reset my password</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
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
  languageSelectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a2a36',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a2a36',
    alignSelf: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 18,
    color: '#1a2a36',
    textAlign: 'left',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 40,
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
  supportContainer: {
    marginBottom: 40,
  },
  supportText: {
    fontSize: 15,
    color: '#1a2a36',
    marginBottom: 2,
  },
  supportEmail: {
    color: '#1a2a36',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  button: {
    borderWidth: 1.5,
    borderColor: '#1a2a36',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1a2a36',
    fontSize: 18,
    fontWeight: '400',
  },
}); 