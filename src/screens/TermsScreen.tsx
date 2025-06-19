import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

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
        await register("tuan.ngothanhmg+prod555@gmail.com", formData.password);
        navigation.navigate('SignupSuccessScreen', { formData });
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
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </TouchableOpacity>
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
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 40,
    alignItems: 'stretch',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  instruction: {
    fontSize: 16,
    color: '#1a2a36',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
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
    borderColor: '#1a2a36',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#1a2a36',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1a2a36',
    flex: 1,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  link: {
    color: '#1a2a36',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  button: {
    borderWidth: 1.5,
    borderColor: '#1a2a36',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#1a2a36',
    fontSize: 18,
    fontWeight: '400',
  },
}); 