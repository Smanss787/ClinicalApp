import { NativeModules } from 'react-native';

const { LSLModule } = NativeModules;

if (!LSLModule) {
  throw new Error('LSLModule is not available. Make sure it is properly linked.');
}

export default LSLModule; 