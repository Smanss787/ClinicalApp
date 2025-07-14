import { NativeModules } from 'react-native';

const { CyrebroSDK } = NativeModules;

// Enhanced SDK wrapper with headset support
const CyrebroSDKWrapper = {
  // MARK: - SDK Initialization
  innitSDK: (headsetId = null) => {
    console.log('CyrebroSDK.innitSDK called with headsetId:', headsetId);
    
    // Map headset IDs to numeric values
    let headsetValue = 0; // Default value
    
    if (headsetId === 'melomind') {
      headsetValue = 1;
      console.log('Initializing SDK for MeloMind Headset (value: 1)');
    } else if (headsetId === 'qplus') {
      headsetValue = 2;
      console.log('Initializing SDK for QPlus Headset (value: 2)');
    } else {
      console.log('No headset selected, using default value (0)');
    }
    
    // Call the native module with the headset value
    return CyrebroSDK.innitSDK(headsetValue);
  },

  // MARK: - Device Scanning
  scanDevice: () => CyrebroSDK.scanDevice(),
  stopScanDevice: () => CyrebroSDK.stopScanDevice(),

  // MARK: - Device Connection
  connectBLEDevice: (deviceName) => CyrebroSDK.connectBLEDevice(deviceName),
  disconnectBLEDevice: (deviceName) => CyrebroSDK.disconnectBLEDevice(deviceName),

  // MARK: - EEG Recording
  startEEGRecording: () => CyrebroSDK.startEEGRecording(),
  stopEEGRecording: () => CyrebroSDK.stopEEGRecording(),

  // MARK: - Mock Data
  mockEegData: (enable) => CyrebroSDK.mockEegData(enable),

  // MARK: - System Services
  isBluetoothEnabled: () => CyrebroSDK.isBluetoothEnabled(),
  isLocationEnabled: () => CyrebroSDK.isLocationEnabled(),

  // MARK: - App Management
  exitApp: () => CyrebroSDK.exitApp(),

  // MARK: - Audio Device Management
  connectAudioDevice: (deviceId) => CyrebroSDK.connectAudioDevice(deviceId),
  disconnectAudioDevice: (deviceId) => CyrebroSDK.disconnectAudioDevice(deviceId),
};

export default CyrebroSDKWrapper;
