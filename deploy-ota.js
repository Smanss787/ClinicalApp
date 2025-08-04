#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  appName: 'ClinicalApp',
  deploymentName: 'Production', // or 'Staging'
  description: 'OTA Update',
  mandatory: false,
  rollbackTimeout: 0,
  targetBinaryVersion: null, // null means latest
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
    process.exit(1);
  }
}

function deployOTA() {
  console.log('🚀 Starting OTA deployment...');
  
  // Build the bundle for Android
  console.log('📦 Building Android bundle...');
  runCommand('npm run bundle-android');
  
  // Build the bundle for iOS
  console.log('📦 Building iOS bundle...');
  runCommand('npm run bundle-ios');
  
  // Deploy to Android
  console.log('📱 Deploying to Android...');
  const androidCommand = `npx react-native-code-push release-react ${config.appName} android --deploymentName ${config.deploymentName} --description "${config.description}" --mandatory ${config.mandatory}`;
  runCommand(androidCommand);
  
  // Deploy to iOS
  console.log('📱 Deploying to iOS...');
  const iosCommand = `npx react-native-code-push release-react ${config.appName} ios --deploymentName ${config.deploymentName} --description "${config.description}" --mandatory ${config.mandatory}`;
  runCommand(iosCommand);
  
  console.log('✅ OTA deployment completed successfully!');
}

// Run the deployment
deployOTA(); 