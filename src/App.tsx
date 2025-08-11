import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import codePush from '@revopush/react-native-code-push';
import { RegisterScreen } from './screens/RegisterScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { TermsScreen } from './screens/TermsScreen';
import { SignupSuccessScreen } from './screens/SignupSuccessScreen';
import HeadsetConnectScreen from './screens/HeadsetConnectScreen';
import HeadsetAdjustmentScreen from './screens/HeadsetAdjustmentScreen';
import { COLORS } from './constants/styles';

const Stack = createNativeStackNavigator();

function Navigation() {
  const { isAuthenticated, loading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="TermsScreen" component={TermsScreen} />
        <Stack.Screen name="SignupSuccessScreen" component={SignupSuccessScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="HeadsetConnect" component={HeadsetConnectScreen} />
        <Stack.Screen name="HeadsetAdjustment" component={HeadsetAdjustmentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </LanguageProvider>
  );
}

// RevoPush CodePush configuration
const codePushOptions = {
  checkFrequency: "ON_APP_START",
  // Update dialog options
  updateDialog: {
    title: "An update is available!",
    mandatoryUpdateMessage: "A mandatory update is available.",
    mandatoryContinueButtonLabel: "Update",
    optionalUpdateMessage: "An update is available. Would you like to install it?",
    optionalIgnoreButtonLabel: "Later",
    optionalInstallButtonLabel: "Install",
  },
  // Install mode options
  installMode: "IMMEDIATE",
};

export default codePush(codePushOptions)(App);
