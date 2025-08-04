# RevoPush Setup Guide for ClinicalApp

This guide explains how to set up and use RevoPush for Over-The-Air (OTA) updates in your React Native clinical application.

## What is RevoPush?

RevoPush is a cloud-based OTA update solution that allows you to push JavaScript/React Native code updates to your app without going through the app store review process. This is particularly useful for:

- Bug fixes
- Feature updates
- UI improvements
- Critical security patches

## Prerequisites

1. A RevoPush account (sign up at https://revopush.org/)
2. React Native project (already configured)
3. Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

The following packages have been installed:
- `react-native-code-push` - The main SDK for OTA updates

### 2. Platform Configuration

#### Android
- ✅ CodePush plugin added to `android/app/build.gradle`
- ✅ CodePush dependency added to `android/build.gradle`
- ⚠️ **TODO**: Replace `YOUR_REVOPUSH_DEPLOYMENT_KEY` with actual deployment key

#### iOS
- ✅ CodePush pod added to `ios/Podfile`
- ⚠️ **TODO**: Run `cd ios && pod install` after getting deployment keys

### 3. App Integration

- ✅ CodePush wrapper added to `src/App.tsx`
- ✅ Update dialog configuration added
- ✅ Automatic update checking on app start

## Getting Your Deployment Keys

1. Sign up at https://revopush.org/
2. Create a new app in the RevoPush dashboard
3. Get your deployment keys for both Android and iOS
4. Update the following files with your actual keys:

### Update `android/app/build.gradle`:
```gradle
codepush {
    deploymentKey = "YOUR_ACTUAL_ANDROID_DEPLOYMENT_KEY"
}
```

### Update `revopush.json`:
```json
{
  "deploymentKey": {
    "android": "YOUR_ACTUAL_ANDROID_DEPLOYMENT_KEY",
    "ios": "YOUR_ACTUAL_IOS_DEPLOYMENT_KEY"
  }
}
```

## Usage

### Manual Deployment

1. Build your app bundles:
```bash
npm run bundle-android
npm run bundle-ios
```

2. Deploy OTA updates:
```bash
node deploy-ota.js
```

### Using RevoPush CLI (when available)

```bash
# Install RevoPush CLI (when package is available)
npm install -g @revopush/cli

# Login to RevoPush
revopush login

# Deploy updates
revopush release-react ClinicalApp android --deploymentName Production
revopush release-react ClinicalApp ios --deploymentName Production
```

## Configuration Options

### Update Dialog Options

The app is configured with the following update dialog options:
- **Title**: "An update is available!"
- **Mandatory Update**: Forces users to update
- **Optional Update**: Allows users to choose when to update
- **Install Mode**: Immediate installation

### Check Frequency

Updates are checked on app start. You can modify this in `src/App.tsx`:
- `ON_APP_START` - Check when app starts
- `ON_APP_RESUME` - Check when app resumes from background
- `MANUAL` - Check only when manually triggered

## Testing OTA Updates

1. Build and install your app on a device
2. Make changes to your React Native code
3. Deploy the update using the deployment script
4. Restart your app to see the changes

## Best Practices

1. **Always test updates** on staging deployment before production
2. **Use descriptive update messages** to inform users about changes
3. **Monitor update success rates** in the RevoPush dashboard
4. **Keep deployment keys secure** and never commit them to version control
5. **Use mandatory updates** for critical security fixes
6. **Test on multiple devices** to ensure compatibility

## Troubleshooting

### Common Issues

1. **Updates not appearing**: Check deployment keys and network connectivity
2. **Build errors**: Ensure all dependencies are properly installed
3. **iOS build issues**: Run `cd ios && pod install` after configuration changes

### Debug Mode

To enable debug logging, add this to your app:
```javascript
import codePush from 'react-native-code-push';

// Enable debug logging
codePush.setLogLevel(codePush.LogLevel.DEBUG);
```

## Security Considerations

1. **Code signing**: Ensure your app is properly signed
2. **HTTPS**: All communications with RevoPush servers use HTTPS
3. **Update verification**: RevoPush verifies update integrity
4. **Rollback capability**: Automatic rollback on update failures

## Support

- RevoPush Documentation: https://revopush.org/
- React Native CodePush: https://github.com/microsoft/react-native-code-push
- Community Support: Check RevoPush community forums

## Next Steps

1. Get your deployment keys from RevoPush dashboard
2. Update the configuration files with your keys
3. Test the setup with a simple update
4. Integrate OTA updates into your CI/CD pipeline
5. Monitor update metrics and user feedback 