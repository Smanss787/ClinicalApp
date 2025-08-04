import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
  Image,
  Alert,
  PermissionsAndroid,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import CyrebroSDK from '../../plugins/CyrebroModule';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AppSettings from 'react-native-app-settings';
import { useFocusEffect } from '@react-navigation/native';
import { Int32 } from 'react-native/Libraries/Types/CodegenTypes';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface PermissionStatus {
  bluetooth: string;
  bluetoothConnect: string;
  bluetoothScan: string;
  bluetoothAdmin: string;
  locationCoarse: string;
  locationFine: string;
}

interface SDKStatus {
  isInitializing: boolean;
  isInitialized: boolean;
  error: string | null;
  lastAttempt: Date | null;
}

interface ServiceStatus {
  bluetoothEnabled: boolean;
  locationEnabled: boolean;
  checking: boolean;
}

interface HeadsetOption {
  id: string;
  name: string;
  description: string;
}

export const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedHeadset, setSelectedHeadset] = useState<HeadsetOption | null>(null);
  const [previousHeadset, setPreviousHeadset] = useState<HeadsetOption | null>(null);
  const [showHeadsetDropdown, setShowHeadsetDropdown] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    bluetooth: 'unavailable',
    bluetoothConnect: 'unavailable',
    bluetoothScan: 'unavailable',
    bluetoothAdmin: 'unavailable',
    locationCoarse: 'unavailable',
    locationFine: 'unavailable',
  });

  // Headset options
  const headsetOptions: HeadsetOption[] = [
    {
      id: 'melomind',
      name: 'MeloMind Headset',
      description: 'Advanced neurofeedback headset for meditation and relaxation',
    },
    {
      id: 'qplus',
      name: 'QPlus Headset',
      description: 'Professional-grade headset for clinical applications',
    },
  ];
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<SDKStatus>({
    isInitializing: false,
    isInitialized: false,
    error: null,
    lastAttempt: null,
  });
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    bluetoothEnabled: false,
    locationEnabled: false,
    checking: false,
  });

  // Check and request permissions
  const checkAndRequestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('Requesting permissions...');
        
        // Request Bluetooth permissions
        const bluetoothConnectPermission = await request(
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT
        );
        console.log('BLUETOOTH_CONNECT permission:', bluetoothConnectPermission);
        
        const bluetoothScanPermission = await request(
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN
        );
        console.log('BLUETOOTH_SCAN permission:', bluetoothScanPermission);
        
        const locationCoarsePermission = await request(
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION
        );
        console.log('ACCESS_COARSE_LOCATION permission:', locationCoarsePermission);
        
        const locationFinePermission = await request(
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        );
        console.log('ACCESS_FINE_LOCATION permission:', locationFinePermission);

        // Update permissions state
        const newPermissions = {
          bluetooth: 'granted', // Legacy permission is always granted on Android 12+
          bluetoothConnect: bluetoothConnectPermission,
          bluetoothScan: bluetoothScanPermission,
          bluetoothAdmin: 'granted', // Legacy permission is always granted on Android 12+
          locationCoarse: locationCoarsePermission,
          locationFine: locationFinePermission,
        };

        setPermissions(newPermissions);

        // Check if all required permissions are granted
        const allGranted = 
          bluetoothConnectPermission === RESULTS.GRANTED &&
          bluetoothScanPermission === RESULTS.GRANTED &&
          (locationCoarsePermission === RESULTS.GRANTED || locationFinePermission === RESULTS.GRANTED);

        setPermissionsGranted(allGranted);

        if (allGranted) {
          console.log('All permissions granted');
          Alert.alert(
            'Success!',
            'All permissions have been granted. You can now initialize the SDK.',
            [{ text: 'OK' }]
          );
          // SDK will be initialized manually by user
        } else {
          console.log('Some permissions were denied');
          Alert.alert(
            'Permissions Required',
            'Bluetooth and Location permissions are required for this app to function properly. Please grant these permissions in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openAppSettings() }
            ]
          );
        }
      } catch (error) {
        console.error('Permission request error:', error);
        Alert.alert('Error', 'Failed to request permissions. Please try again.');
      }
    } else {
      // For iOS, permissions are handled differently
      console.log('iOS platform detected, skipping Android permissions');
      setPermissionsGranted(true);
      // SDK will be initialized manually by user
    }
  };

  // Initialize the Cyrebro SDK
  const initializeSDK = async () => {
    try {
      setSdkStatus(prev => ({
        ...prev,
        isInitializing: true,
        error: null,
        lastAttempt: new Date(),
      }));

      console.log('Initializing Cyrebro SDK...');
      
      // Pass the selected headset ID to the SDK
      // Convert headset ID to numeric value: melomind = 1, qplus = 2
      let headsetId = 1; // default to melomind
      if (selectedHeadset?.id === 'qplus') {
        headsetId = 2;
      } else if (selectedHeadset?.id === 'melomind') {
        headsetId = 1;
      }

      console.log(`Initializing SDK with headset ID:${headsetId} for headset: ${selectedHeadset?.name}`);
      const result = await CyrebroSDK.innitSDK(selectedHeadset?.id);
      console.log('CyrebroSDK.initSDK result:', result);
      
      setSdkStatus(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: true,
        error: null,
      }));

      Alert.alert(
        'SDK Initialized',
        `Cyrebro SDK has been successfully initialized for ${selectedHeadset?.name || 'default headset'}!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('CyrebroSDK.initSDK error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setSdkStatus(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: false,
        error: errorMessage,
      }));

      Alert.alert(
        'SDK Initialization Failed',
        `Failed to initialize Cyrebro SDK: ${errorMessage}`,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: () => initializeSDK() }
        ]
      );
    }
  };

  // Check current permission status
  const checkPermissionStatus = async () => {
    if (Platform.OS === 'android') {
      try {
        const bluetoothConnect = await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        const bluetoothScan = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const locationCoarse = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
        const locationFine = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

        const newPermissions = {
          bluetooth: 'granted',
          bluetoothConnect,
          bluetoothScan,
          bluetoothAdmin: 'granted',
          locationCoarse,
          locationFine,
        };

        setPermissions(newPermissions);

        const allGranted = 
          bluetoothConnect === RESULTS.GRANTED &&
          bluetoothScan === RESULTS.GRANTED &&
          (locationCoarse === RESULTS.GRANTED || locationFine === RESULTS.GRANTED);

        setPermissionsGranted(allGranted);

        if (allGranted) {
          // SDK will be initialized manually by user
        }
      } catch (error) {
        console.error('Permission check error:', error);
      }
    } else {
      setPermissionsGranted(true);
      initializeSDK();
    }
  };

  // Open app settings
  const openAppSettings = () => {
    AppSettings.openSettings();
  };

  // Check Bluetooth and Location services
  const checkServices = async () => {
    setServiceStatus(prev => ({ ...prev, checking: true }));
    
    try {
      if (Platform.OS === 'android') {
        // For Android, we need to check the actual service states
        const bluetoothEnabled = await checkBluetoothServiceStatus();
        const locationEnabled = await checkLocationServiceStatus();
        
        setServiceStatus({
          bluetoothEnabled,
          locationEnabled,
          checking: false,
        });
      } else {
        // For iOS, we'll assume services are enabled if permissions are granted
        setServiceStatus({
          bluetoothEnabled: permissionsGranted,
          locationEnabled: permissionsGranted,
          checking: false,
        });
      }
    } catch (error) {
      console.error('Service check error:', error);
      setServiceStatus(prev => ({ ...prev, checking: false }));
    }
  };

  // Check Bluetooth service status (Android) - actual service state
  const checkBluetoothServiceStatus = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Use the CyrebroSDK bridge module API
        await CyrebroSDK.isBluetoothEnabled();
        console.log('Bluetooth service check: Enabled');
        return true; // Promise resolved means Bluetooth is enabled
      } catch (error) {
        console.log('Bluetooth service check: Disabled', error);
        return false; // Promise rejected means Bluetooth is disabled
      }
    }
    return true; // For iOS, assume enabled
  };

  // Check Location service status (Android) - actual service state
  const checkLocationServiceStatus = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Use the CyrebroSDK bridge module API
        await CyrebroSDK.isLocationEnabled();
        console.log('Location service check: Enabled');
        return true; // Promise resolved means Location is enabled
      } catch (error) {
        console.log('Location service check: Disabled', error);
        return false; // Promise rejected means Location is disabled
      }
    }
    return true; // For iOS, assume enabled
  };

  // Check permissions before navigating to the appropriate headset connect screen
  const handleQPlusNavigation = () => {
    if (!selectedHeadset) {
      Alert.alert(
        'Headset Selection Required',
        'Please select a headset before connecting.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!permissionsGranted) {
      // Check which specific permissions are missing
      const missingPermissions = [];
      
      if (permissions.bluetoothConnect !== 'granted') {
        missingPermissions.push('Bluetooth Connect');
      }
      if (permissions.bluetoothScan !== 'granted') {
        missingPermissions.push('Bluetooth Scan');
      }
      if (permissions.locationCoarse !== 'granted' && permissions.locationFine !== 'granted') {
        missingPermissions.push('Location');
      }

      const missingText = missingPermissions.join(', ');
      
      Alert.alert(
        'Permissions Required',
        `The following permissions are required to connect to your headset:\n\n${missingText}\n\nPlease grant these permissions to continue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permissions', onPress: checkAndRequestPermissions },
          { text: 'Open Settings', onPress: openAppSettings }
        ]
      );
    } else if (!sdkStatus.isInitialized) {
      // Check SDK status
      if (sdkStatus.isInitializing) {
        Alert.alert(
          'SDK Initializing',
          'Please wait for the Cyrebro SDK to finish initializing before connecting.',
          [{ text: 'OK' }]
        );
      } else if (sdkStatus.error) {
        Alert.alert(
          'SDK Not Ready',
          'The Cyrebro SDK failed to initialize. Please retry the initialization before connecting.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry SDK', onPress: initializeSDK }
          ]
        );
      } else {
        Alert.alert(
          'SDK Not Initialized',
          'The Cyrebro SDK has not been initialized yet. Please wait for initialization to complete.',
          [{ text: 'OK' }]
        );
      }
    } else if (!serviceStatus.bluetoothEnabled || !serviceStatus.locationEnabled) {
      // Check service status
      const missingServices = [];
      if (!serviceStatus.bluetoothEnabled) {
        missingServices.push('Bluetooth');
      }
      if (!serviceStatus.locationEnabled) {
        missingServices.push('Location');
      }

      const missingServicesText = missingServices.join(' and ');
      
      Alert.alert(
        'Services Required',
        `${missingServicesText} service(s) must be turned ON to connect to your headset.\n\nPlease enable these services in your device settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Services', onPress: checkServices },
          { text: 'Open Settings', onPress: openAppSettings }
        ]
      );
    } else {
      // Double-check everything before navigating
      checkPermissionStatus().then(() => {
        checkServices().then(() => {
          if (permissionsGranted && sdkStatus.isInitialized && 
              serviceStatus.bluetoothEnabled && serviceStatus.locationEnabled) {
            console.log('Navigating to headset connect screen with headset:', selectedHeadset.name);
            
            // Navigate to the unified headset connect screen
            navigation.navigate('HeadsetConnect', { selectedHeadset });
          } else {
            Alert.alert(
              'System Check Failed',
              'Please ensure all permissions are granted, SDK is initialized, and services are enabled before connecting.',
              [{ text: 'OK' }]
            );
          }
        });
      });
    }
  };

  useEffect(() => {
    checkPermissionStatus();
    checkServices();
  }, []);

  // Check permissions when screen comes into focus (e.g., returning from settings)
  useFocusEffect(
    React.useCallback(() => {
      if (!permissionsGranted) {
        checkPermissionStatus();
      }
      checkServices(); // Always check services when screen comes into focus
    }, [permissionsGranted])
  );

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: newTodo.trim(),
          completed: false,
        },
      ]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <View style={styles.todoTextContainer}>
        <TouchableOpacity
          style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
          onPress={() => toggleTodo(item.id)}
        />
        <Text
          style={[styles.todoText, item.completed && styles.todoTextCompleted]}
        >
          {item.text}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // Manual test function to debug service checking
  const testServiceChecking = async () => {
    console.log('=== Service Check Debug ===');
    console.log('Current service status:', serviceStatus);
    
    try {
      console.log('Testing Bluetooth service with isBluetoothEnabled()...');
      const bluetoothResult = await checkBluetoothServiceStatus();
      console.log('Bluetooth service result:', bluetoothResult);
      
      console.log('Testing Location service with isLocationEnabled()...');
      const locationResult = await checkLocationServiceStatus();
      console.log('Location service result:', locationResult);
      
      Alert.alert(
        'Service Check Results',
        `Bluetooth: ${bluetoothResult ? 'Enabled' : 'Disabled'}\nLocation: ${locationResult ? 'Enabled' : 'Disabled'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Service test error:', error);
      Alert.alert('Test Error', 'Failed to test services: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Headset selection functions
  const handleHeadsetSelection = (headset: HeadsetOption) => {
    // Store the previous headset before updating
    if (selectedHeadset) {
      setPreviousHeadset(selectedHeadset);
    }
    setSelectedHeadset(headset);
    setShowHeadsetDropdown(false);
    console.log('Selected headset name:', headset.name);
    console.log('Selected headset id:', headset.id);
  };

  const toggleHeadsetDropdown = () => {
    setShowHeadsetDropdown(!showHeadsetDropdown);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome (Test Update 4)</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
          {user?.picture && (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          )}
        </View>

        {/* Headset Selection Section */}
        <View style={styles.headsetSection}>
          <Text style={styles.sectionTitle}>Select Your Headset</Text>
          <Text style={styles.headsetText}>
            Choose the headset you want to connect with:
          </Text>
          
          <TouchableOpacity
            style={styles.headsetDropdown}
            onPress={toggleHeadsetDropdown}
          >
            <Text style={[
              styles.headsetDropdownText,
              !selectedHeadset && styles.headsetDropdownPlaceholder
            ]}>
              {selectedHeadset ? selectedHeadset.name : 'Select a headset...'}
            </Text>
            <Text style={styles.headsetDropdownArrow}>
              {showHeadsetDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {selectedHeadset && (
            <View style={styles.selectedHeadsetInfo}>
              <Text style={styles.selectedHeadsetName}>{selectedHeadset.name}</Text>
              <Text style={styles.selectedHeadsetDescription}>{selectedHeadset.description}</Text>
            </View>
          )}

          {/* Headset Dropdown Modal */}
          <Modal
            visible={showHeadsetDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowHeadsetDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowHeadsetDropdown(false)}
            >
              <View style={styles.dropdownContainer}>
                {headsetOptions.map((headset) => (
                  <TouchableOpacity
                    key={headset.id}
                    style={[
                      styles.headsetOption,
                      selectedHeadset?.id === headset.id && styles.headsetOptionSelected
                    ]}
                    onPress={() => handleHeadsetSelection(headset)}
                  >
                    <Text style={[
                      styles.headsetOptionText,
                      selectedHeadset?.id === headset.id && styles.headsetOptionTextSelected
                    ]}>
                      {headset.name}
                    </Text>
                    <Text style={[
                      styles.headsetOptionDescription,
                      selectedHeadset?.id === headset.id && styles.headsetOptionDescriptionSelected
                    ]}>
                      {headset.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        {/* Permission Request Section */}
        {!permissionsGranted && (
          <View style={styles.permissionSection}>
            <Text style={styles.sectionTitle}>Permissions Required for Q-Plus Connect</Text>
            <Text style={styles.permissionText}>
              Q-Plus Connect requires Bluetooth and Location permissions to connect to your device and provide full functionality.
            </Text>
            
            <View style={styles.permissionStatus}>
              <Text style={styles.permissionLabel}>Bluetooth Connect:</Text>
              <Text style={[
                styles.permissionValue,
                permissions.bluetoothConnect === 'granted' ? styles.granted : styles.denied
              ]}>
                {permissions.bluetoothConnect === 'granted' ? '✓ Granted' : '✗ Required'}
              </Text>
            </View>
            
            <View style={styles.permissionStatus}>
              <Text style={styles.permissionLabel}>Bluetooth Scan:</Text>
              <Text style={[
                styles.permissionValue,
                permissions.bluetoothScan === 'granted' ? styles.granted : styles.denied
              ]}>
                {permissions.bluetoothScan === 'granted' ? '✓ Granted' : '✗ Required'}
              </Text>
            </View>
            
            <View style={styles.permissionStatus}>
              <Text style={styles.permissionLabel}>Location:</Text>
              <Text style={[
                styles.permissionValue,
                (permissions.locationCoarse === 'granted' || permissions.locationFine === 'granted') ? styles.granted : styles.denied
              ]}>
                {(permissions.locationCoarse === 'granted' || permissions.locationFine === 'granted') ? '✓ Granted' : '✗ Required'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={checkAndRequestPermissions}
            >
              <Text style={styles.permissionButtonText}>Grant Permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openAppSettings}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={checkPermissionStatus}
            >
              <Text style={styles.refreshButtonText}>Refresh Permissions</Text>
            </TouchableOpacity>

            {/* Old SDK Status Display removed - now handled in dedicated SDK Init section */}
          </View>
        )}

        {/* Main Content - Only show when permissions are granted */}
        {permissionsGranted && (
          <>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Your Profile</Text>
              <View style={styles.profileInfo}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user?.email}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{user?.name || 'Not provided'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.label}>Nickname:</Text>
                <Text style={styles.value}>{user?.nickname || 'Not provided'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.label}>Email Verified:</Text>
                <Text style={styles.value}>{user?.emailVerified ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.label}>Updated At:</Text>
                <Text style={styles.value}>{user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</Text>
              </View>
            </View>

            {/* Permission Status Indicator */}
            <View style={styles.permissionStatusIndicator}>
              <Text style={styles.permissionStatusText}>
                {permissionsGranted && sdkStatus.isInitialized && 
                 serviceStatus.bluetoothEnabled && serviceStatus.locationEnabled
                  ? '✅ Headset Connect Ready' 
                  : '⚠️ Headset Connect Setup Required'
                }
              </Text>
              <Text style={styles.permissionStatusSubtext}>
                {permissionsGranted && sdkStatus.isInitialized && 
                 serviceStatus.bluetoothEnabled && serviceStatus.locationEnabled
                  ? 'All requirements met - ready to scan' 
                  : permissionsGranted && sdkStatus.isInitialized
                    ? 'Permissions and SDK ready, checking services...'
                    : permissionsGranted
                      ? 'Permissions granted, waiting for SDK initialization'
                      : 'Permissions and SDK initialization required'
                }
              </Text>
            </View>

            {/* SDK Initialization Section */}
            {permissionsGranted && (
              <View style={[
                styles.sdkInitSection,
                sdkStatus.isInitialized && styles.sdkInitSectionSuccess,
                sdkStatus.error && styles.sdkInitSectionError
              ]}>
                <Text style={styles.sdkInitTitle}>SDK Initialization</Text>
                
                {!selectedHeadset && (
                  <View style={styles.sdkInitContent}>
                    <Text style={styles.sdkInitText}>⚠️ Headset Selection Required</Text>
                    <Text style={styles.sdkInitSubtext}>Please select a headset before initializing the SDK</Text>
                  </View>
                )}
                
                {sdkStatus.isInitializing && (
                  <View style={styles.sdkInitContent}>
                    <ActivityIndicator size="small" color="#007AFF" style={styles.sdkInitLoader} />
                    <Text style={styles.sdkInitText}>🔄 Initializing Cyrebro SDK...</Text>
                    <Text style={styles.sdkInitSubtext}>
                      Initializing for {selectedHeadset?.name || 'default headset'}
                    </Text>
                  </View>
                )}
                
                {sdkStatus.isInitialized && !sdkStatus.isInitializing && (
                  <View style={styles.sdkInitContent}>
                    <Text style={styles.sdkInitText}>✅ SDK Initialized Successfully</Text>
                    <Text style={styles.sdkInitSubtext}>
                      Initialized for: {selectedHeadset?.name || 'default headset'}
                    </Text>
                    <Text style={styles.sdkInitSubtext}>
                      Last initialized: {sdkStatus.lastAttempt?.toLocaleTimeString() || 'Unknown'}
                    </Text>
                    <TouchableOpacity
                      style={styles.reinitButton}
                      onPress={() => {
                        // Check if headset was changed
                        if (previousHeadset && selectedHeadset && previousHeadset.id !== selectedHeadset.id) {
                          // Headset was changed
                          Alert.alert(
                            'Headset Changed',
                            'Since you changed your headset, please close and reopen the app for the changes to take effect properly.',
                            [
                              { 
                                text: 'OK', 
                                style: 'default',
                                onPress: () => {
                                  // Call exitApp from CyrebroSDK to close the app
                                  CyrebroSDK.exitApp().then(() => {
                                    console.log('App exit requested successfully');
                                  }).catch((error: any) => {
                                    console.error('Failed to exit app:', error);
                                  });
                                }
                              }
                            ]
                          );
                        } else {
                          // Same headset or no previous headset
                          initializeSDK();
                        }
                      }}
                    >
                      <Text style={styles.reinitButtonText}>Re-initialize SDK</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {sdkStatus.error && !sdkStatus.isInitializing && (
                  <View style={styles.sdkInitContent}>
                    <Text style={styles.sdkInitText}>❌ SDK Initialization Failed</Text>
                    <Text style={styles.sdkInitSubtext}>{sdkStatus.error}</Text>
                    <Text style={styles.sdkInitSubtext}>
                      Last attempt: {sdkStatus.lastAttempt?.toLocaleTimeString() || 'Unknown'}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.initButton,
                        !selectedHeadset && styles.initButtonDisabled
                      ]}
                      onPress={initializeSDK}
                      disabled={!selectedHeadset}
                    >
                      <Text style={[
                        styles.initButtonText,
                        !selectedHeadset && styles.initButtonTextDisabled
                      ]}>Retry Initialization</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {!sdkStatus.isInitialized && !sdkStatus.isInitializing && !sdkStatus.error && selectedHeadset && (
                  <View style={styles.sdkInitContent}>
                    <Text style={styles.sdkInitText}>⏳ SDK Not Initialized</Text>
                    <Text style={styles.sdkInitSubtext}>
                      Click the button below to initialize the SDK for {selectedHeadset.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.initButton}
                      onPress={initializeSDK}
                    >
                      <Text style={styles.initButtonText}>Initialize SDK</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Service Status Section */}
            {permissionsGranted && (
              <View style={[
                styles.serviceStatusSection,
                (serviceStatus.bluetoothEnabled && serviceStatus.locationEnabled) && styles.serviceStatusSuccess,
                (!serviceStatus.bluetoothEnabled || !serviceStatus.locationEnabled) && styles.serviceStatusWarning
              ]}>
                <Text style={styles.serviceStatusTitle}>Service Status</Text>
                
                {serviceStatus.checking && (
                  <View style={styles.serviceStatusContent}>
                    <ActivityIndicator size="small" color="#007AFF" style={styles.serviceStatusLoader} />
                    <Text style={styles.serviceStatusText}>🔄 Checking services...</Text>
                  </View>
                )}
                
                {!serviceStatus.checking && (
                  <View style={styles.serviceStatusContent}>
                    <View style={styles.serviceStatusRow}>
                      <Text style={styles.serviceStatusLabel}>Bluetooth:</Text>
                      <Text style={[
                        styles.serviceStatusValue,
                        serviceStatus.bluetoothEnabled ? styles.serviceEnabled : styles.serviceDisabled
                      ]}>
                        {serviceStatus.bluetoothEnabled ? '✅ Enabled' : '❌ Disabled'}
                      </Text>
                    </View>
                    
                    <View style={styles.serviceStatusRow}>
                      <Text style={styles.serviceStatusLabel}>Location:</Text>
                      <Text style={[
                        styles.serviceStatusValue,
                        serviceStatus.locationEnabled ? styles.serviceEnabled : styles.serviceDisabled
                      ]}>
                        {serviceStatus.locationEnabled ? '✅ Enabled' : '❌ Disabled'}
                      </Text>
                    </View>
                    
                    {(!serviceStatus.bluetoothEnabled || !serviceStatus.locationEnabled) && (
                      <TouchableOpacity
                        style={styles.checkServicesButton}
                        onPress={checkServices}
                      >
                        <Text style={styles.checkServicesButtonText}>Check Services</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.debugButton}
                      onPress={testServiceChecking}
                    >
                      <Text style={styles.debugButtonText}>Debug Test</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Headset Connect Button */}
            <TouchableOpacity
              style={[
                styles.qplusButton,
                (!selectedHeadset || !permissionsGranted || !sdkStatus.isInitialized || 
                 !serviceStatus.bluetoothEnabled || !serviceStatus.locationEnabled) && styles.qplusButtonDisabled
              ]}
              onPress={handleQPlusNavigation}
            >
              <View style={styles.qplusButtonContent}>
                <Text style={[
                  styles.qplusButtonText,
                  (!selectedHeadset || !permissionsGranted || !sdkStatus.isInitialized || 
                   !serviceStatus.bluetoothEnabled || !serviceStatus.locationEnabled) && styles.qplusButtonTextDisabled
                ]}>
                  Connect Headset
                </Text>
                {!selectedHeadset && (
                  <Text style={styles.qplusButtonInfo}>ℹ️ Headset Selection Required</Text>
                )}
                {selectedHeadset && !permissionsGranted && (
                  <Text style={styles.qplusButtonInfo}>ℹ️ Permissions Required</Text>
                )}
                {selectedHeadset && permissionsGranted && !sdkStatus.isInitialized && (
                  <Text style={styles.qplusButtonInfo}>
                    {sdkStatus.isInitializing ? '🔄 Initializing SDK...' : 'ℹ️ SDK Not Ready'}
                  </Text>
                )}
                {selectedHeadset && permissionsGranted && sdkStatus.isInitialized && 
                 (!serviceStatus.bluetoothEnabled || !serviceStatus.locationEnabled) && (
                  <Text style={styles.qplusButtonInfo}>
                    {!serviceStatus.bluetoothEnabled && !serviceStatus.locationEnabled 
                      ? 'ℹ️ Bluetooth & Location Required' 
                      : !serviceStatus.bluetoothEnabled 
                        ? 'ℹ️ Bluetooth Required' 
                        : 'ℹ️ Location Required'}
                  </Text>
                )}
                {selectedHeadset && permissionsGranted && sdkStatus.isInitialized && 
                 serviceStatus.bluetoothEnabled && serviceStatus.locationEnabled && (
                  <Text style={styles.qplusButtonInfo}>
                    ✅ Ready to connect with {selectedHeadset.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Todo List - Only show when permissions are granted */}
      {permissionsGranted && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Todo List</Text>
          </View>

          <FlatList
            data={todos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a new todo"
              value={newTodo}
              onChangeText={setNewTodo}
              onSubmitEditing={addTodo}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTodo}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#666',
    width: 80,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  todoTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 10,
  },
  qplusButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  qplusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  permissionLabel: {
    fontSize: 16,
    color: '#333',
    width: 120,
    fontWeight: '500',
  },
  permissionValue: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  granted: {
    color: '#34C759',
  },
  denied: {
    color: '#ff3b30',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qplusButtonDisabled: {
    backgroundColor: '#ccc',
  },
  qplusButtonTextDisabled: {
    color: '#666',
  },
  qplusButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qplusButtonInfo: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  permissionStatusIndicator: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  permissionStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  permissionStatusSubtext: {
    fontSize: 14,
    color: '#666',
  },
  sdkInitSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sdkInitSectionSuccess: {
    borderColor: '#34C759',
  },
  sdkInitSectionError: {
    borderColor: '#ff3b30',
  },
  sdkInitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sdkInitContent: {
    marginBottom: 15,
  },
  sdkInitLoader: {
    marginBottom: 10,
  },
  sdkInitText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  sdkInitSubtext: {
    fontSize: 14,
    color: '#666',
  },
  reinitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  reinitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  initButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  initButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  initButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  initButtonTextDisabled: {
    color: '#666',
  },
  serviceStatusSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceStatusSuccess: {
    borderColor: '#34C759',
  },
  serviceStatusWarning: {
    borderColor: '#ff3b30',
  },
  serviceStatusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  serviceStatusContent: {
    marginBottom: 15,
  },
  serviceStatusLoader: {
    marginBottom: 10,
  },
  serviceStatusText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  serviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceStatusLabel: {
    fontSize: 16,
    color: '#666',
    width: 120,
    fontWeight: '500',
  },
  serviceStatusValue: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  serviceEnabled: {
    color: '#34C759',
  },
  serviceDisabled: {
    color: '#ff3b30',
  },
  checkServicesButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  checkServicesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headsetSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headsetText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  headsetDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  headsetDropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  headsetDropdownPlaceholder: {
    color: '#888',
  },
  headsetDropdownArrow: {
    fontSize: 16,
    color: '#666',
  },
  selectedHeadsetInfo: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 10,
  },
  selectedHeadsetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedHeadsetDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headsetOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headsetOptionSelected: {
    backgroundColor: '#e0e0e0',
  },
  headsetOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  headsetOptionTextSelected: {
    color: '#007AFF',
  },
  headsetOptionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  headsetOptionDescriptionSelected: {
    color: '#007AFF',
  },
}); 