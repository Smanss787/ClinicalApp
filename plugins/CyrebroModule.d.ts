import { NativeModules } from 'react-native';

interface CyrebroSDKType {
  // ZeroFace SDK init
  innitSDK(): Promise<any>;
}

const CyrebroSDK: CyrebroSDKType;
export default CyrebroSDK;
