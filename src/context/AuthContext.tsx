import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth0 } from '../config/auth0';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const credentials = await AsyncStorage.getItem('auth0_credentials');
      if (credentials) {
        const parsedCredentials = JSON.parse(credentials);
        try {
          // Validate token remotely by calling userInfo
          const userInfo = await auth0.auth.userInfo({ token: parsedCredentials.accessToken });
          setUser(userInfo);
          setIsAuthenticated(true);
          // Optionally update stored user info
          await AsyncStorage.setItem('auth0_credentials', JSON.stringify({
            ...parsedCredentials,
            user: userInfo,
          }));
        } catch (err) {
          // Token invalid or expired, clear credentials
          await AsyncStorage.removeItem('auth0_credentials');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const credentials = await auth0.auth.passwordRealm({
        username: email,
        password: password,
        realm: 'Username-Password-Authentication',
      });
      console.log('Auth0 passwordRealm response:', credentials);

      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      console.log('Auth0 userInfo response:', userInfo);

      await AsyncStorage.setItem('auth0_credentials', JSON.stringify({
        ...credentials,
        user: userInfo,
      }));

      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth0_credentials');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await auth0.auth.createUser({
        email,
        password,
        connection: 'Username-Password-Authentication',
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth0.auth.resetPassword({
        email,
        connection: 'Username-Password-Authentication',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        register,
        resetPassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth context', context);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 