import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { commonStyles, COLORS } from '../constants/styles';

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
    backgroundColor: COLORS.white,
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    ...commonStyles.title,
  },
  dot: {
    ...commonStyles.dot,
  },
  successText: {
    fontSize: 16,
    color: COLORS.primary,
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
    color: COLORS.primary,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'left',
    marginBottom: 40,
    width: '100%',
  },
  link: {
    ...commonStyles.link,
  },
  button: {
    ...commonStyles.button,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    ...commonStyles.buttonText,
  },
}); 