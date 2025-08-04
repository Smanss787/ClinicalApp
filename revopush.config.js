module.exports = {
  // RevoPush configuration
  appName: 'ClinicalApp',
  deploymentKey: {
    android: 'UCLoWX53bWafGVlDw1JBSEPiQ2pyVJRvDT7Pzl',
    ios: 'UCLoWX53bWafGVlDw1JBSEPiQ2pyVJRvDT7Pzl'
  },
  serverUrl: 'https://api.revopush.org',
  description: 'Clinical App OTA Updates',
  
  // Update settings
  checkFrequency: 'ON_APP_START',
  installMode: 'IMMEDIATE',
  
  // Dialog settings
  updateDialog: {
    title: 'Update Available',
    mandatoryUpdateMessage: 'A mandatory update is available.',
    mandatoryContinueButtonLabel: 'Update',
    optionalUpdateMessage: 'An update is available. Would you like to install it?',
    optionalIgnoreButtonLabel: 'Later',
    optionalInstallButtonLabel: 'Install'
  }
}; 