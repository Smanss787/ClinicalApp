import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';
import { commonStyles, COLORS } from '../constants/styles';

export const TermsScreen = ({ navigation, route }: any) => {
  const { formData } = route.params;
  const { register } = useAuth();
  const [checked, setChecked] = useState([false, false, false]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = (idx: number) => {
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const allChecked = checked.every(Boolean);

  const handleContinue = async () => {
    if (allChecked) {
      setLoading(true);
      setError(null);
      try {
        console.log('formData= ', formData);
        console.log('register= ', register);
        console.log('email= ', formData.email);
        console.log('password= ', formData.password);
        await register(formData.email, formData.password);
        navigation.navigate('SignupSuccessScreen', { email: formData.email, password: formData.password });
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
        Alert.alert('Registration Failed', err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />
      <Text style={styles.title}>Create your account</Text>
      <View style={styles.dot} />
      <Text style={styles.instruction}>
        In order to start your training, we need your approval:
      </Text>
      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => handleCheck(0)} style={styles.checkboxBox}>
          <View style={[styles.checkbox, checked[0] && styles.checkboxChecked]} />
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/terms')}>Terms and Conditions</Text>
        </Text>
      </View>
      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => handleCheck(1)} style={styles.checkboxBox}>
          <View style={[styles.checkbox, checked[1] && styles.checkboxChecked]} />
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/privacy')}>Privacy policy</Text>
        </Text>
      </View>
      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => handleCheck(2)} style={styles.checkboxBox}>
          <View style={[styles.checkbox, checked[2] && styles.checkboxChecked]} />
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          I agree to give my{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/consent')}>Consent</Text>
          {' '}to the processing of my personal data
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, !allChecked && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!allChecked || loading}
      >
        {loading ? (
          <ActivityIndicator color="#1a2a36" />
        ) : (
          <Text style={styles.buttonText}>Done</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>{error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    paddingTop: 40,
    alignItems: 'stretch',
  },
  backButton: {
    ...commonStyles.backButton,
    marginBottom: 10,
  },
  title: {
    ...commonStyles.title,
  },
  dot: {
    ...commonStyles.dot,
  },
  instruction: {
    ...commonStyles.instruction,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    marginLeft: 0,
  },
  checkboxBox: {
    marginRight: 16,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.primary,
    flex: 1,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  link: {
    ...commonStyles.link,
  },
  button: {
    ...commonStyles.button,
    marginTop: 30,
  },
  buttonDisabled: {
    ...commonStyles.buttonDisabled,
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
}); 