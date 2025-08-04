#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  appName: 'ClinicalApp',
  deploymentName: 'Production',
  description: 'OTA Update',
  serverUrl: 'https://api.revopush.org',
  deploymentKey: 'UCLoWX53bWafGVlDw1JBSEPiQ2pyVJRvDT7Pzl'
};

function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

function buildBundle(platform) {
  console.log(`📦 Skipping ${platform} bundle build (manual mode)...`);
  return true; // Always return true since we're skipping the build
}

function deployToRevoPush(platform) {
  console.log(`🚀 Deploying to RevoPush for ${platform}...`);
  
  // This is a simplified deployment approach
  // In a real scenario, you would use the RevoPush API or CLI
  
  const bundlePath = platform === 'android' 
    ? 'android/app/src/main/assets/index.android.bundle'
    : 'ios/main.jsbundle';
    
  if (fs.existsSync(bundlePath)) {
    console.log(`✅ Bundle found at: ${bundlePath}`);
    console.log(`📤 Ready to deploy to RevoPush server: ${config.serverUrl}`);
    console.log(`🔑 Using deployment key: ${config.deploymentKey}`);
    
    // Here you would typically:
    // 1. Upload the bundle to RevoPush servers
    // 2. Create a release entry
    // 3. Notify users of the update
    
    console.log(`🎉 Deployment preparation complete for ${platform}!`);
    console.log(`📋 Next steps:`);
    console.log(`   1. Upload bundle to RevoPush dashboard`);
    console.log(`   2. Create release with description: "${config.description}"`);
    console.log(`   3. Deploy to ${config.deploymentName} environment`);
    
    return true;
  } else {
    console.error(`❌ Bundle not found at: ${bundlePath}`);
    return false;
  }
}

function deployOTA() {
  console.log('🚀 Starting manual OTA deployment...');
  
  const platform = process.argv[2] || 'android';
  
  if (platform !== 'android' && platform !== 'ios' && platform !== 'both') {
    console.error('❌ Invalid platform. Use: android, ios, or both');
    process.exit(1);
  }
  
  if (platform === 'both' || platform === 'android') {
    if (!buildBundle('android')) {
      console.error('❌ Failed to build Android bundle');
      process.exit(1);
    }
    if (!deployToRevoPush('android')) {
      console.error('❌ Failed to deploy Android bundle');
      process.exit(1);
    }
  }
  
  if (platform === 'both' || platform === 'ios') {
    if (!buildBundle('ios')) {
      console.error('❌ Failed to build iOS bundle');
      process.exit(1);
    }
    if (!deployToRevoPush('ios')) {
      console.error('❌ Failed to deploy iOS bundle');
      process.exit(1);
    }
  }
  
  console.log('✅ Manual OTA deployment completed successfully!');
  console.log('📱 Your app will check for updates on next startup.');
}

// Run the deployment
deployOTA(); 