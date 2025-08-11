import { NativeModules } from 'react-native';

interface CyrebroSDKType {
  // MARK: - SDK Initialization
  // Initialize SDK with headset selection
  // headsetId: 'melomind' (value: 1) or 'qplus' (value: 2) or null (default: 0)
  innitSDK(headsetId?: number): Promise<any>;

  // MARK: - Device Scanning
  scanDevice(): Promise<any>;
  stopScanDevice(): Promise<any>;

  // MARK: - Device Connection
  connectBLEDevice(deviceName: string): Promise<any>;
  disconnectBLEDevice(deviceName: string): Promise<any>;

  // MARK: - EEG Recording
  startEEGRecording(): Promise<any>;
  stopEEGRecording(): Promise<any>;

  // MARK: - Mock Data
  mockEegData(enable: boolean): Promise<any>;

  // MARK: - System Services
  isBluetoothEnabled(): Promise<any>;
  isLocationEnabled(): Promise<any>;

  // MARK: - App Management
  exitApp(): Promise<any>;

  // MARK: - Audio Device Management
  connectAudioDevice(deviceId: string): Promise<any>;
  disconnectAudioDevice(deviceId: string): Promise<any>;
}

const CyrebroSDK: CyrebroSDKType;
export default CyrebroSDK;
