import { NativeModules } from 'react-native';

interface CyrebroSDKType {
  // ZeroFace SDK init with headset selection
  // headsetId: 'melomind' (value: 1) or 'qplus' (value: 2) or null (default: 0)
  innitSDK(headsetId?: Int | 0): Promise<any>;

  scanDevice(): Promise<any>;
  stopScanDevice(): Promise<any>;

  connectBLEDevice(deviceName: string): Promise<any>;
  disconnectBLEDevice(deviceName: string): Promise<any>;
  connectAudioDevice(deviceId: string): Promise<any>;
  disconnectAudioDevice(deviceId: string): Promise<any>;
  isBluetoothEnabled(): Promise<any>;
  isLocationEnabled(): Promise<any>;
  startEEGRecording(): Promise<any>;
  stopEEGRecording(): Promise<any>;
}

const CyrebroSDK: CyrebroSDKType;
export default CyrebroSDK;
