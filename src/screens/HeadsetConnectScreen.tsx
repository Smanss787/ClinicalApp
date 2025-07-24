import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList,
  TextInput,
  ScrollView,
  Alert,
  NativeEventEmitter,
  NativeModules,
  Switch
} from 'react-native';
import CyrebroSDK from '../../plugins/CyrebroModule';
import { QualityIndicatorVersion2 } from '../helper/QualityIndicatorVersion2';
import EEGDataTable from '../components/EEGDataTable';
import { BackButton } from '../components/BackButton';
import lslService, { EEGSample } from '../services/lslService';

interface ScanConfig {
  timeout: number; // in milliseconds
  autoStop: boolean;
}

interface BleDevice {
  id: string;
  name: string;
  rssi?: number;
  address?: string;
  bondState?: string;
}

interface DeviceStatus {
  batteryLevel: number;
  deviceInformation: {
    audioName: string;
    bleAddress: string;
    productName: string;
    firmwareVersion: string;
    hardwareVersion: string;
    uniqueDeviceIdentifier: string;
  };
}

interface BleDeviceState {
  name: string;
  status: string;
  deviceStatus?: DeviceStatus;
}

interface HeadsetConnectScreenProps {
  navigation: any;
  route: {
    params: {
      selectedHeadset: {
        id: string;
        name: string;
        description: string;
      };
    };
  };
}

const HeadsetConnectScreen = ({ navigation, route }: any) => {
  const { selectedHeadset } = route.params;
  
  // Configuration state
  const [scanConfig, setScanConfig] = useState<ScanConfig>({
    timeout: 20000, // 20 seconds default
    autoStop: true,
  });

  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [bleDevices, setBleDevices] = useState<BleDevice[]>([]);
  const [selectedBleDevice, setSelectedBleDevice] = useState<BleDevice | null>(null);
  const [scanTimeRemaining, setScanTimeRemaining] = useState<number>(0);

  // Connection state
  const [bleConnecting, setBleConnecting] = useState(false);
  const [audioConnecting, setAudioConnecting] = useState(false);
  const [bleDisconnecting, setBleDisconnecting] = useState(false);
  const [bleDevice, setBleDevice] = useState<BleDeviceState | null>(null);
  const [audioDevice, setAudioDevice] = useState<any | null>(null);
  
  // EEG state
  const [eegRunning, setEegRunning] = useState(false);
  const [eegData, setEegData] = useState<any[]>([]);
  const [showVisualizations, setShowVisualizations] = useState(true);
  const [mockDataEnabled, setMockDataEnabled] = useState(false);

  // LSL state
  const [lslEnabled, setLslEnabled] = useState(false);
  const [lslConnected, setLslConnected] = useState(false);
  const [lslStreaming, setLslStreaming] = useState(false);
  const [lslServerAddress, setLslServerAddress] = useState('localhost');
  const [lslServerPort, setLslServerPort] = useState('16571');

  // Quality indicator for potential future use
  const [qualityIndicator] = useState(() => new QualityIndicatorVersion2());
  const channelNb = selectedHeadset.id === 'melomind' ? 2 : 4; // Melomind uses 2 channels, QPlus uses 4 channels

  // Headset-specific configurations
  const headsetConfig = {
    title: selectedHeadset.name + ' Connect',
    showAudioConnect: selectedHeadset.id === 'melomind', // Only Melomind shows audio connect
    channelCount: selectedHeadset.id === 'melomind' ? 2 : 4, // Melomind uses 2 channels, QPlus uses 4 channels
  };

  useEffect(() => {
    const { CyrebroSDK } = NativeModules;
    const eegEmitter = new NativeEventEmitter(CyrebroSDK);
    const subscription = eegEmitter.addListener('onEEGPacket', (data) => {
      console.log('EEG event qualities:', data.qualities);
      setEegData(prev => [...prev.slice(-19), data]); // keep last 20 packets
      // Update quality scores and progress bar with new EEG data
      updateQualityButtonsAndProgressBar(data.qualities);
      
      // Stream to LSL if enabled and connected
      if (lslEnabled && lslStreaming) {
        const eegSample: EEGSample = {
          timestamp: Date.now(),
          channels: data.channels || [],
          qualities: data.qualities || []
        };
        lslService.pushEEGSample(eegSample).catch(error => {
          console.error('Failed to push EEG sample to LSL:', error);
        });
      }
    });
    return () => {
      subscription.remove();
    };
  }, [lslEnabled, lslStreaming]);

  // Configuration handlers
  const updateScanTimeout = (timeout: string) => {
    const timeoutValue = parseInt(timeout) || 0;
    setScanConfig(prev => ({
      ...prev,
      timeout: timeoutValue * 1000, // Convert to milliseconds
    }));
  };

  const toggleAutoStop = () => {
    setScanConfig(prev => ({
      ...prev,
      autoStop: !prev.autoStop,
    }));
  };

  // Scan for BLE devices
  const handleScan = () => {
    if (scanConfig.timeout <= 0) {
      Alert.alert('Invalid Timeout', 'Please enter a valid timeout value (greater than 0).');
      return;
    }

    setScanning(true);
    setBleDevices([]);
    setSelectedBleDevice(null);
    setBleDevice(null);
    setAudioDevice(null);
    setScanTimeRemaining(scanConfig.timeout / 1000); // Convert to seconds for display

    console.log(`Starting scan with timeout: ${scanConfig.timeout}ms`);

    // Start scanning
    CyrebroSDK.scanDevice().then((result: any) => {
      console.log('scanDevice result:', result);
      setScanning(false);
      let deviceInfoMap = result.split('\n');
      setBleDevices(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          name: deviceInfoMap[0],
          bondState: deviceInfoMap[2],
          address: deviceInfoMap[1] 
        }
      ]);
    }).catch((error: any) => {
      console.error('scanDevice error:', error);
      Alert.alert('Scan Error', 'Failed to start scanning. Please try again.');
      setScanning(false);
    });

    // Auto-stop timer
    if (scanConfig.autoStop) {
      const timer = setTimeout(() => {
        stopScan();
      }, scanConfig.timeout);

      // Countdown timer for display
      const countdownTimer = setInterval(() => {
        setScanTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Store timers for cleanup
      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    }
  };

  // Stop scanning
  const stopScan = () => {
    setScanning(false);
    setScanTimeRemaining(0);
    
    CyrebroSDK.stopScanDevice().then((result: any) => {
      console.log('stopScanDevice result:', result);
    }).catch((error: any) => {
      console.error('stopScanDevice error:', error);
    });
  };

  // Connect BLE
  const handleConnectBLE = () => {
    if (!selectedBleDevice) return;
    setBleConnecting(true);
    let deviceName = selectedBleDevice.name;
    
    CyrebroSDK.connectBLEDevice(deviceName).then((result: any) => {
      console.log('connectBLEDevice result:', result);
      
      try {
        // Parse the JSON string result from DeviceStatus model
        console.log('Parsed device result:', result);
        const deviceStatus = JSON.parse(result);
        console.log('Parsed device status:', deviceStatus);
        
        setBleDevice({
          name: deviceName,
          status: 'Connected',
          deviceStatus: deviceStatus, // Store the full status object
        });
        setBleConnecting(false);
        
        // Show detailed status information
        Alert.alert(
          'BLE Connection Success', 
          `Device: ${deviceName}\nStatus: Connected\nBattery: ${deviceStatus.batteryLevel}%\nAudio Name: ${deviceStatus.deviceInformation.audioName}\nProduct: ${deviceStatus.deviceInformation.productName}`,
          [{ text: 'OK' }]
        );
      } catch (parseError) {
        console.error('Failed to parse device status JSON:', parseError);
        console.log('Raw result:', result);
        
        // Fallback to simple status if JSON parsing fails
        setBleDevice({
          name: deviceName,
          status: 'Connected',
          deviceStatus: { 
            batteryLevel: 0,
            deviceInformation: {
              audioName: 'Unknown',
              bleAddress: 'Unknown',
              productName: 'Unknown',
              firmwareVersion: 'Unknown',
              hardwareVersion: 'Unknown',
              uniqueDeviceIdentifier: 'Unknown'
            }
          },
        });
        setBleConnecting(false);
        Alert.alert('Success', 'BLE device connected successfully!');
      }
    }).catch((error: any) => {
      console.error('connectBLEDevice error:', error);
      setBleConnecting(false);
      Alert.alert('Connection Failed', 'Failed to connect to BLE device. Please try again.');
    });
  };

  // Disconnect BLE
  const handleDisconnectBLE = () => {
    if (!bleDevice) return;
    setBleDisconnecting(true);
    let deviceName = bleDevice.name;
    
    CyrebroSDK.disconnectBLEDevice(deviceName).then((result: any) => {
      console.log('disconnectBLEDevice result:', result);
      setBleDevice(null);
      setBleDisconnecting(false);
      Alert.alert('Success', 'BLE device disconnected successfully!');
    }).catch((error: any) => {
      console.error('disconnectBLEDevice error:', error);
      setBleDisconnecting(false);
      Alert.alert('Disconnection Failed', 'Failed to disconnect from BLE device. Please try again.');
    });
  };



  // EEG Handlers
  const handleStartEEG = () => {
    CyrebroSDK.startEEGRecording().then(() => {
      setEegRunning(true);
      Alert.alert('EEG Started', 'EEG recording has started.');
    }).catch((error: any) => {
      Alert.alert('Error', 'Failed to start EEG.');
      console.error(error);
    });
  };

  const handleStopEEG = () => {
    CyrebroSDK.stopEEGRecording().then(() => {
      setEegRunning(false);
      Alert.alert('EEG Stopped', 'EEG recording has stopped.');
    }).catch((error: any) => {
      Alert.alert('Error', 'Failed to stop EEG.');
      console.error(error);
    });
  };

  const handleStartAdjustment = () => {
    // Navigate to Headset Adjustment screen
    navigation.navigate('HeadsetAdjustment', {
      headsetConfig: {
        id: selectedHeadset.id,
        name: selectedHeadset.name,
        title: selectedHeadset.name + ' Adjustment',
        channelCount: headsetConfig.channelCount,
      },
    });
  };

  const updateQualityButtonsAndProgressBar = (qualities?: number[]) => {
    if (qualities) {
      qualityIndicator.addNext(qualities);
    } else {
      qualityIndicator.addNext([0, 0]);
    }
  };

  // LSL Handlers
  const handleInitializeLSL = async () => {
    try {
      const port = parseInt(lslServerPort) || 16571;
      const success = await lslService.initialize({
        serverAddress: lslServerAddress,
        port: port
      });
      
      if (success) {
        setLslConnected(true);
        Alert.alert('LSL Connected', 'Successfully connected to LSL server.');
      } else {
        Alert.alert('LSL Connection Failed', 'Failed to connect to LSL server.');
      }
    } catch (error) {
      console.error('LSL initialization error:', error);
      Alert.alert('LSL Error', `Failed to initialize LSL: ${error}`);
    }
  };

  const handleCreateLSLOutlets = async () => {
    try {
      if (!lslConnected) {
        Alert.alert('LSL Not Connected', 'Please connect to LSL server first.');
        return;
      }

      // Create EEG outlet
      await lslService.createEEGOutlet(headsetConfig.channelCount, 250);
      
      // Create quality outlet
      await lslService.createQualityOutlet(headsetConfig.channelCount, 10);
      
      // Create event outlet
      await lslService.createEventOutlet();
      
      Alert.alert('LSL Outlets Created', 'EEG, Quality, and Event outlets created successfully.');
    } catch (error) {
      console.error('Failed to create LSL outlets:', error);
      Alert.alert('LSL Error', `Failed to create outlets: ${error}`);
    }
  };

  const handleStartLSLStreaming = async () => {
    try {
      const success = await lslService.startStreaming();
      if (success) {
        setLslStreaming(true);
        Alert.alert('LSL Streaming Started', 'EEG data is now being streamed to LSL.');
      } else {
        Alert.alert('LSL Streaming Failed', 'Failed to start LSL streaming.');
      }
    } catch (error) {
      console.error('Failed to start LSL streaming:', error);
      Alert.alert('LSL Error', `Failed to start streaming: ${error}`);
    }
  };

  const handleStopLSLStreaming = async () => {
    try {
      const success = await lslService.stopStreaming();
      if (success) {
        setLslStreaming(false);
        Alert.alert('LSL Streaming Stopped', 'EEG data streaming has been stopped.');
      } else {
        Alert.alert('LSL Streaming Failed', 'Failed to stop LSL streaming.');
      }
    } catch (error) {
      console.error('Failed to stop LSL streaming:', error);
      Alert.alert('LSL Error', `Failed to stop streaming: ${error}`);
    }
  };

  const handleCloseLSL = async () => {
    try {
      await lslService.close();
      setLslConnected(false);
      setLslStreaming(false);
      setLslEnabled(false);
      Alert.alert('LSL Closed', 'LSL connection has been closed.');
    } catch (error) {
      console.error('Failed to close LSL:', error);
      Alert.alert('LSL Error', `Failed to close LSL: ${error}`);
    }
  };

  const handlePushLSLEvent = async (eventType: string) => {
    try {
      await lslService.pushEvent(eventType, {
        headset: selectedHeadset.name,
        timestamp: Date.now()
      });
      console.log(`LSL event pushed: ${eventType}`);
    } catch (error) {
      console.error('Failed to push LSL event:', error);
    }
  };



  const renderBleDevice = ({ item }: { item: BleDevice }) => (
    <TouchableOpacity
      style={[styles.deviceItem, selectedBleDevice?.id === item.id && styles.selectedDeviceItem]}
      onPress={() => setSelectedBleDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      {item.bondState && (
        <Text style={styles.deviceBondStatus}>Status: {item.bondState}</Text>
      )}
      {item.address && (
        <Text style={styles.deviceAddress}>Address: {item.address}</Text>
      )}
    </TouchableOpacity>
  );



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{headsetConfig.title}</Text>
      
      {/* Configuration Section */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Scan Configuration</Text>
        
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Scan Timeout (seconds):</Text>
          <TextInput
            style={styles.configInput}
            value={(scanConfig.timeout / 1000).toString()}
            onChangeText={updateScanTimeout}
            keyboardType="numeric"
            placeholder="20"
            editable={!scanning}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.toggleButton, scanConfig.autoStop && styles.toggleButtonActive]} 
          onPress={toggleAutoStop}
          disabled={scanning}
        >
          <Text style={styles.toggleButtonText}>
            {scanConfig.autoStop ? '✓' : '✗'} Auto Stop Scan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scan Controls */}
      <View style={styles.scanSection}>
        <Text style={styles.sectionTitle}>Device Scanning</Text>
        
        {scanning && (
          <View style={styles.scanStatus}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.scanStatusText}>
              Scanning... {scanTimeRemaining > 0 ? `(${scanTimeRemaining}s remaining)` : ''}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleScan} 
            disabled={scanning}
          >
            <Text style={styles.buttonText}>Start Scan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={stopScan} 
            disabled={!scanning}
          >
            <Text style={styles.buttonText}>Stop Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Device List */}
      {bleDevices.length > 0 && (
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>Found Devices ({bleDevices.length})</Text>
          <FlatList
            data={bleDevices}
            keyExtractor={(item) => item.id}
            renderItem={renderBleDevice}
            style={styles.deviceList}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Connection Controls */}
      {selectedBleDevice && (
        <View style={styles.connectionSection}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <Text style={styles.selectedDeviceText}>Selected: {selectedBleDevice.name}</Text>
          
          <View style={styles.buttonRow}>
            {!bleDevice ? (
              // Show Connect BLE button when not connected
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleConnectBLE} 
                disabled={bleConnecting}
              >
                <Text style={styles.buttonText}>
                  {bleConnecting ? 'Connecting...' : 'Connect BLE'}
                </Text>
              </TouchableOpacity>
            ) : (
              // Show Disconnect BLE button when connected
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleDisconnectBLE} 
                disabled={bleDisconnecting}
              >
                <Text style={styles.buttonText} numberOfLines={1}>
                  {bleDisconnecting ? 'Disconnecting...' : 'Disconnect BLE'}
                </Text>
              </TouchableOpacity>
            )}
            
           
          </View>
        </View>
      )}

      {/* Connection Status */}
      {(bleDevice || audioDevice) && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          
          {bleDevice && (
            <View style={styles.deviceInfo}>
              <Text style={styles.resultLabel}>BLE Device:</Text>
              <Text style={styles.deviceName}>{bleDevice.name}</Text>
              <Text style={[styles.deviceStatus, styles.statusConnected]}>{bleDevice.status}</Text>
              {bleDevice.deviceStatus && (
                <>
                  <Text style={styles.deviceBattery}>Battery: {bleDevice.deviceStatus.batteryLevel}%</Text>
                  <Text style={styles.deviceAudioName}>Audio Name: {bleDevice.deviceStatus.deviceInformation.audioName}</Text>
                  <Text style={styles.deviceProduct}>Product: {bleDevice.deviceStatus.deviceInformation.productName}</Text>
                  <Text style={styles.deviceFirmware}>Firmware: {bleDevice.deviceStatus.deviceInformation.firmwareVersion}</Text>
                  <Text style={styles.deviceHardware}>Hardware: {bleDevice.deviceStatus.deviceInformation.hardwareVersion}</Text>
                  <Text style={styles.deviceAddress}>BLE Address: {bleDevice.deviceStatus.deviceInformation.bleAddress}</Text>
                  <Text style={styles.deviceUID}>UID: {bleDevice.deviceStatus.deviceInformation.uniqueDeviceIdentifier}</Text>
                </>
              )}


              {/* EEG Buttons */}
              <View style={styles.eegButtonRow}>
                <View style={styles.eegButtonContainer}>
                  {!eegRunning ? (
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={handleStartEEG}
                    >
                      <Text style={styles.buttonText}>Start EEG</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={handleStopEEG}
                    >
                      <Text style={styles.buttonText}>Stop EEG</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.eegButtonContainer}>
                  {/* Visualization Toggle */}
                  <TouchableOpacity
                    style={[styles.button, showVisualizations ? styles.primaryButton : styles.secondaryButton]}
                    onPress={() => setShowVisualizations(!showVisualizations)}
                  >
                    <Text style={styles.buttonText}>
                      {showVisualizations ? 'Hide Table' : 'Show Table'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Headset Adjustment Button */}
              <View style={styles.eegButtonRow}>
                <View style={styles.eegButtonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleStartAdjustment}
                  >
                    <Text style={styles.buttonText}>Start Headset Adjustment</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mock Data Toggle */}
              <View style={styles.mockDataSection}>
                <Text style={styles.mockDataLabel}>Mock EEG Data</Text>
                <Switch
                  value={mockDataEnabled}
                  onValueChange={(value) => {
                    setMockDataEnabled(value);
                    CyrebroSDK.mockEegData(value).then(() => {
                      console.log(`Mock EEG data ${value ? 'enabled' : 'disabled'}`);
                    }).catch((error: any) => {
                      console.error('Failed to toggle mock EEG data:', error);
                      Alert.alert('Error', 'Failed to toggle mock EEG data. Please try again.');
                    });
                  }}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={mockDataEnabled ? '#007AFF' : '#f4f3f4'}
                />
              </View>

              {/* LSL Configuration Section */}
              <View style={styles.lslSection}>
                <Text style={styles.sectionTitle}>LSL (Lab Streaming Layer)</Text>
                
                {/* LSL Enable Toggle */}
                <View style={styles.lslToggleSection}>
                  <Text style={styles.lslToggleLabel}>Enable LSL Streaming</Text>
                  <Switch
                    value={lslEnabled}
                    onValueChange={(value) => {
                      setLslEnabled(value);
                      if (!value) {
                        // Disable LSL when toggle is turned off
                        handleCloseLSL();
                      }
                    }}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={lslEnabled ? '#007AFF' : '#f4f3f4'}
                  />
                </View>

                {lslEnabled && (
                  <>
                    {/* LSL Server Configuration */}
                    <View style={styles.lslConfigSection}>
                      <Text style={styles.lslConfigLabel}>Server Address:</Text>
                      <TextInput
                        style={styles.lslConfigInput}
                        value={lslServerAddress}
                        onChangeText={setLslServerAddress}
                        placeholder="localhost"
                        editable={!lslConnected}
                      />
                    </View>
                    
                    <View style={styles.lslConfigSection}>
                      <Text style={styles.lslConfigLabel}>Port:</Text>
                      <TextInput
                        style={styles.lslConfigInput}
                        value={lslServerPort}
                        onChangeText={setLslServerPort}
                        placeholder="16571"
                        keyboardType="numeric"
                        editable={!lslConnected}
                      />
                    </View>

                    {/* LSL Connection Controls */}
                    <View style={styles.lslButtonRow}>
                      {!lslConnected ? (
                        <TouchableOpacity
                          style={[styles.button, styles.primaryButton]}
                          onPress={handleInitializeLSL}
                        >
                          <Text style={styles.buttonText}>Connect to LSL</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.button, styles.secondaryButton]}
                          onPress={handleCloseLSL}
                        >
                          <Text style={styles.buttonText}>Disconnect LSL</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* LSL Outlet Management */}
                    {lslConnected && (
                      <View style={styles.lslOutletSection}>
                        <TouchableOpacity
                          style={[styles.button, styles.primaryButton]}
                          onPress={handleCreateLSLOutlets}
                        >
                          <Text style={styles.buttonText}>Create LSL Outlets</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* LSL Streaming Controls */}
                    {lslConnected && (
                      <View style={styles.lslStreamingSection}>
                        {!lslStreaming ? (
                          <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleStartLSLStreaming}
                          >
                            <Text style={styles.buttonText}>Start LSL Streaming</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={handleStopLSLStreaming}
                          >
                            <Text style={styles.buttonText}>Stop LSL Streaming</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* LSL Status */}
                    <View style={styles.lslStatusSection}>
                      <Text style={styles.lslStatusText}>
                        Status: {lslConnected ? 'Connected' : 'Disconnected'}
                      </Text>
                      <Text style={styles.lslStatusText}>
                        Streaming: {lslStreaming ? 'Active' : 'Inactive'}
                      </Text>
                    </View>

                    {/* LSL Event Buttons */}
                    {lslStreaming && (
                      <View style={styles.lslEventSection}>
                        <Text style={styles.lslEventLabel}>Push Events:</Text>
                        <View style={styles.lslEventButtonRow}>
                          <TouchableOpacity
                            style={[styles.button, styles.primaryButton, styles.smallButton]}
                            onPress={() => handlePushLSLEvent('session_start')}
                          >
                            <Text style={styles.buttonText}>Session Start</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.button, styles.primaryButton, styles.smallButton]}
                            onPress={() => handlePushLSLEvent('session_end')}
                          >
                            <Text style={styles.buttonText}>Session End</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* EEG Data Display */}
              {eegRunning && (
                <>
                  {/* EEG Visualizations - Only show if enabled */}
                  {showVisualizations && (
                    <>
                      {/* EEG Data Table - Available for all headsets */}
                      <EEGDataTable 
                        eegData={eegData} 
                        isRunning={eegRunning} 
                        channelCount={headsetConfig.channelCount}
                      />
                    </>
                  )}
                  
                  {eegData.length > 0 && (
                    <View style={styles.eegDataBox}>
                      <Text style={styles.sectionTitle}>Latest EEG Data</Text>
                      <Text style={styles.eegDataText} numberOfLines={6}>
                        {JSON.stringify(eegData[eegData.length-1], null, 2)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          
          {audioDevice && (
            <View style={styles.deviceInfo}>
              <Text style={styles.resultLabel}>Audio Device:</Text>
              <Text style={styles.deviceName}>{audioDevice.name}</Text>
              <Text style={[styles.deviceStatus, styles.statusConnected]}>{audioDevice.status}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.backButtonContainer}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.backButtonText}>Back to Home</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minWidth: 150,
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    marginBottom: 10,
  },
  deviceList: {
    width: '100%',
    marginBottom: 10,
  },
  deviceItem: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
    width: '100%',
  },
  selectedDeviceItem: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#e6f0ff',
  },
  deviceInfo: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceBondStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceStatus: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  configSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  configLabel: {
    width: 120,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  configInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  toggleButton: {
    backgroundColor: '#f0f4f8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#e6f0ff',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scanSection: {
    width: '100%',
    marginBottom: 20,
  },
  scanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scanStatusText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceSection: {
    width: '100%',
    marginBottom: 20,
  },
  connectionSection: {
    width: '100%',
    marginBottom: 20,
  },
  selectedDeviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusSection: {
    width: '100%',
    marginBottom: 20,
  },
  statusConnected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  deviceBattery: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceAudioName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceProduct: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceFirmware: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceHardware: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceUID: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  eegButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  eegButtonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  mockDataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  mockDataLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eegDataBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    width: '100%',
  },
  eegDataText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  // LSL Styles
  lslSection: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  lslToggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  lslToggleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lslConfigSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lslConfigLabel: {
    width: 120,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  lslConfigInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    fontSize: 14,
  },
  lslButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lslOutletSection: {
    marginBottom: 10,
  },
  lslStreamingSection: {
    marginBottom: 10,
  },
  lslStatusSection: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  lslStatusText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  lslEventSection: {
    marginBottom: 10,
  },
  lslEventLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lslEventButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: {
    minWidth: 120,
    padding: 12,
    minHeight: 40,
  },
});

export default HeadsetConnectScreen; 