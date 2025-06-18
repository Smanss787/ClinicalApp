import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export const SignupSuccessScreen = ({ navigation }: any) => {
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
      <TouchableOpacity style={styles.button} onPress={() => {/* handle activation */}}>
        <Text style={styles.buttonText}>Activate my account</Text>
      </TouchableOpacity>
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