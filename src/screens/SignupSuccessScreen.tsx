import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const SignupSuccessScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { email, password } = route.params as { email: string; password: string };
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      console.log('email= ', email);
      console.log('password= ', password);
      await login(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Login Failed', 'Could not activate your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Well done!</Text>
      <View style={styles.dot} />
      <Text style={styles.successText}>
        You have created your melomind account!{"\n"}
        Now, let's activate your account. To carry out this step you need your melomind headset or your license number.
      </Text>
      <View style={styles.thumbContainer}>
        <Text style={styles.thumbIcon}>👍</Text>
      </View>
      <Text style={styles.infoText}>
        No headset or license yet ?{"\n"}
        Access the application's discovery mode by{' '}
        <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/discovery')}>clicking here</Text>
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleActivate} disabled={loading}>
        <Text style={styles.buttonText}>Activate my account</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
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
  successText: {
    fontSize: 16,
    color: '#1a2a36',
    textAlign: 'left',
    marginBottom: 40,
    width: '100%',
  },
  thumbContainer: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  thumbIcon: {
    fontSize: 64,
    color: '#1a2a36',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#1a2a36',
    textAlign: 'left',
    marginBottom: 40,
    width: '100%',
  },
  link: {
    color: '#1a2a36',
    textDecorationLine: 'underline',
  },
  button: {
    borderWidth: 1.5,
    borderColor: '#1a2a36',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#1a2a36',
    fontSize: 18,
    fontWeight: '400',
  },
}); 