package com.cyrebroplugin

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.content.Context
import android.location.LocationManager
import android.media.AudioManager
import com.cyrebroplugin.DataManager.ML_AUDIO_CONNECTED
import com.cyrebroplugin.DataManager.ML_BLE_CONNECTED_WITH_DEVICE_INFORMATION
import com.cyrebroplugin.model.SampleData
import com.facebook.common.logging.FLog.d
import com.facebook.react.bridge.Promise
import com.google.gson.Gson
import com.mybraintech.android.jnibrainbox.RelaxIndexSessionOutputData
import com.mybraintech.sdk.MbtClient
import com.mybraintech.sdk.MbtClientManager
import com.mybraintech.sdk.core.acquisition.EEGCalibrateResult
import com.mybraintech.sdk.core.acquisition.EEGRecordedDatas
import com.mybraintech.sdk.core.bluetooth.devices.EnumBluetoothConnection
import com.mybraintech.sdk.core.listener.BatteryLevelListener
import com.mybraintech.sdk.core.listener.ConnectionListener
import com.mybraintech.sdk.core.listener.DeviceInformationListener
import com.mybraintech.sdk.core.listener.EEGListener
import com.mybraintech.sdk.core.listener.RecordingListener
import com.mybraintech.sdk.core.listener.ScanResultListener
import com.mybraintech.sdk.core.model.DeviceInformation
import com.mybraintech.sdk.core.model.EnumEEGFilterConfig
import com.mybraintech.sdk.core.model.EnumMBTDevice
import com.mybraintech.sdk.core.model.MbtDevice
import com.mybraintech.sdk.core.model.MbtEEGPacket
import com.mybraintech.sdk.core.model.RecordingOption
import com.mybraintech.sdk.core.model.StreamingParams
import com.mybraintech.sdk.util.toJson
import org.json.JSONArray
import kotlin.math.sin

/**
 * CyrebroSDK Implementation
 * 
 * Manages Bluetooth Low Energy (BLE) connections and EEG data processing for Cyrebro headsets.
 * This class provides a high-level interface for device discovery, connection management,
 * and EEG data acquisition using the MyBrainTech SDK.
 * 
 * Features:
 * - BLE device scanning and connection
 * - Audio connection management via A2DP
 * - EEG data streaming and processing
 * - Device information retrieval
 * - Battery level monitoring
 * - Recording and calibration functionality
 * 
 * @author Cyrebro Team
 * @since 1.0.0
 */
object CyrebroSDKImpl {


        /** Tag for logging purposes */
         val TAG = "CyrebroSDKImpl"
        
        // EEG Data Configuration
        private  val EEG_PACKET_SIZE = 250
        private  val CHANNEL_DATA_SIZE = 7500
        private  val MELOMIND_CHANNELS = 2
        private  val QPLUS_CHANNELS = 4
        
        // BLE Configuration
        private  val SCAN_TIMEOUT_MS = 30000L
        private  val CONNECTION_TIMEOUT_MS = 10000L
        private  val RECONNECT_DELAY_MS = 2000L
        private  val MAX_RECONNECT_ATTEMPTS = 3
        
        // Logging Tags
        private  val LOG_TAG_SETUP = "[Setup]"
        private  val LOG_TAG_SCAN = "[Scan]"
        private  val LOG_TAG_CONNECTION = "[Connection]"
        private  val LOG_TAG_EEG = "[EEG]"
        private  val LOG_TAG_AUDIO = "[Audio]"


    /** MyBrainTech client instance for SDK operations */
    var mbtClient: MbtClient? = null
    
    /** List of discovered BLE devices during scanning */
    var discoveredDevices: MutableList<MbtDevice> = mutableListOf<MbtDevice>()
    
    /** Currently connected BLE device */
    var connectedBleDevice: MbtDevice? = null
        set(value) {
            field = value
            logInfo("Connected BLE device set to: ${value}")
        }

    /** Firmware version of the connected device */
    var deviceFirmwareVersion: String? = null
    
    /** Flag indicating if audio connection is established */
    var isAudioConnected: Boolean = false

    /** Type of the connected device (Melomind, QPlus, etc.) */
    var currentDeviceType: EnumMBTDevice? = null

    /** EEG filter configuration mode */
    private var eegFilterMode = EnumEEGFilterConfig.NO_FILTER
    
    /** Device information listener instance */
    private val deviceInformationListener: DeviceInformationListener by lazy { createDeviceInformationListener() }
    
    /** Connection listener for handling connection events */
    private var connectionListener: ConnectionListener? = null
    
    /** Current connection state */
    private var connectionState = ConnectionState.DISCONNECTED
    
    /** Type of Bluetooth connection (BLE + Audio) */
    var bluetoothConnectionType = EnumBluetoothConnection.BLE_AUDIO

    /** Flag indicating if SDK has been initialized */
    var isSdkInitialized = false

    /**
     * Connection states for the device
     */
    enum class ConnectionState {
        DISCONNECTED,
        SCANNING,
        CONNECTING,
        CONNECTED,
        ERROR
    }

    /**
     * Checks if ODA (On-Demand Authentication) is requested
     * 
     * @return false - ODA is not currently supported
     */
    fun isOdaRequest(): Boolean {
        return false
    }

    /**
     * Initializes the MyBrainTech SDK with the specified device type
     * 
     * @param context Application context
     * @param deviceType Type of device to initialize (Melomind, QPlus, etc.)
     * @param promise Promise to resolve with initialization result
     */
    @SuppressLint("MissingPermission")
    fun setupMbtSdk(context: Context, deviceType: EnumMBTDevice, promise: Promise) {
        logInfo("$LOG_TAG_SETUP Setting up MBT SDK, initialized: $isSdkInitialized")
        
        if (isSdkInitialized) {
            promise.resolve("SDK already initialized")
            return
        }
        
        try {
            initializeClient(context, deviceType)
            setupAudioManager(context)
            validateInitialConnection()
            markSdkAsInitialized()
            promise.resolve("SDK initialized successfully")
        } catch (e: Exception) {
            logError("$LOG_TAG_SETUP Failed to initialize SDK", e)
            promise.reject("INITIALIZATION_ERROR", e.message, e)
        }
    }

    /**
     * Initializes the MBT client
     */
    private fun initializeClient(context: Context, deviceType: EnumMBTDevice) {
        currentDeviceType = deviceType
        logInfo("$LOG_TAG_SETUP Initializing client for device type: $deviceType")
        
        if (mbtClient == null) {
            mbtClient = MbtClientManager.getMbtClient(context, deviceType)
            logInfo("$LOG_TAG_SETUP MBT client created: $mbtClient")
        }
    }

    /**
     * Sets up the audio manager
     */
    private fun setupAudioManager(context: Context) {
        audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        logInfo("$LOG_TAG_SETUP Audio manager initialized")
    }

    /**
     * Validates the initial connection status
     */
    private fun validateInitialConnection() {
        val connectionStatus = mbtClient?.getBleConnectionStatus()
        logInfo("$LOG_TAG_SETUP Connection established: ${connectionStatus?.isConnectionEstablished}")
        
        if (connectionStatus?.isConnectionEstablished == true) {
            logInfo("$LOG_TAG_SETUP BLE device name: ${connectionStatus.mbtDevice?.bluetoothDevice?.name}")
        }
    }

    /**
     * Marks the SDK as initialized
     */
    private fun markSdkAsInitialized() {
        isSdkInitialized = true
        logInfo("$LOG_TAG_SETUP SDK initialization completed")
    }

    /**
     * Retrieves the battery level of the connected device
     * 
     * @param batteryLevelListener Listener to receive battery level updates
     */
    fun getBatteryLevel(batteryLevelListener: BatteryLevelListener) {
        logInfo("Getting battery level")
        
        if (isDeviceConnected()) {
            mbtClient?.getBatteryLevel(batteryLevelListener)
        } else {
            logWarning("No device connected for battery level check")
        }
    }

    /**
     * Starts recording EEG data with the specified options
     * 
     * @param recordingOption Recording configuration options
     * @param listener Listener to handle recording events
     */
    fun startRecording(recordingOption: RecordingOption, listener: RecordingListener) {
        logInfo("Starting recording")
        
        if (isDeviceConnected()) {
            mbtClient?.startRecording(recordingOption, listener)
        } else {
            listener.onRecordingError(Exception("Device not connected"))
        }
    }

    /**
     * Stops the current recording session
     */
    fun stopRecording() {
        logInfo("Stopping recording")
        mbtClient?.stopRecording()
    }

    /** Audio manager for A2DP connection management */
    var audioManager: AudioManager? = null

    /**
     * Scans for BLE devices with the specified target name
     * 
     * @param targetDeviceName Name of the device to scan for
     * @param promise Promise to resolve with scan results
     */
    @SuppressLint("MissingPermission")
    fun scanBle(targetDeviceName: String, promise: Promise) {
        logInfo("$LOG_TAG_SCAN Scanning BLE devices, target: $targetDeviceName")
        
        if (connectionState == ConnectionState.SCANNING) {
            promise.resolve("Stop scan")
            return
        }
        
        try {
            startBleScan(targetDeviceName, promise)
        } catch (e: Exception) {
            logError("$LOG_TAG_SCAN Failed to start scan", e)
            promise.reject("SCAN_ERROR", e.message, e)
        }
    }

    /**
     * Starts the BLE scanning process
     */
    private fun startBleScan(targetDeviceName: String, promise: Promise) {
        logInfo("$LOG_TAG_SCAN Starting BLE scan")
        updateConnectionState(ConnectionState.SCANNING)
        
        mbtClient?.startScan(targetDeviceName, createScanResultListener(promise))
    }

    /**
     * Creates the scan result listener
     */
    private fun createScanResultListener(promise: Promise): ScanResultListener {
        return object : ScanResultListener {
            override fun onMbtDevices(mbtDevices: List<MbtDevice>) {
                handleMbtDevicesFound(mbtDevices, promise)
            }

            override fun onOtherDevices(otherDevices: List<BluetoothDevice>) {
                logVerbose("$LOG_TAG_SCAN Found other devices")
                updateConnectionState(ConnectionState.DISCONNECTED)
            }

            override fun onScanError(error: Throwable) {
                logError("$LOG_TAG_SCAN Scan error: ${error.message}")
                updateConnectionState(ConnectionState.ERROR)
                mbtClient?.stopScan()
                promise.resolve(error.message)
            }
        }
    }

    /**
     * Handles MBT devices found during scan
     */
    private fun handleMbtDevicesFound(mbtDevices: List<MbtDevice>, promise: Promise) {
        val firstDevice = mbtDevices.first()
        val bluetoothDevice = firstDevice.bluetoothDevice
        
        logInfo("$LOG_TAG_SCAN Found ${mbtDevices.size} MBT devices")
        
        val bondStateString = getBondStateString(bluetoothDevice.bondState)
        val scanResult = "${bluetoothDevice.name}\n${bluetoothDevice.address}\n${bondStateString}"
        
        discoveredDevices.clear()
        discoveredDevices.add(firstDevice)
        
        mbtClient?.stopScan()
        updateConnectionState(ConnectionState.DISCONNECTED)
        
        promise.resolve(scanResult)
    }

    /**
     * Gets the bond state string representation
     */
    private fun getBondStateString(bondState: Int): String {
        return when (bondState) {
            BluetoothDevice.BOND_NONE -> "Not Bonded"
            BluetoothDevice.BOND_BONDING -> "Bonding..."
            BluetoothDevice.BOND_BONDED -> "Bonded"
            else -> "Unknown Bond State"
        }
    }

    /**
     * Scans for audio devices via A2DP
     */
    @SuppressLint("MissingPermission")
    fun scanAudio() {
        logInfo("$LOG_TAG_AUDIO Scanning for audio devices")
        mbtClient?.startScanAudio("", null)
    }

    /**
     * Gets the list of currently connected A2DP devices
     * 
     * @return List of connected Bluetooth devices
     */
    @SuppressLint("MissingPermission")
    fun getA2DPConnectedDevice(): List<BluetoothDevice> {
        val a2dp = mbtClient?.getA2DP()
        val connectedDevices = a2dp?.connectedDevices ?: arrayListOf()
        return connectedDevices
    }
    
    /** Listener for BLE information updates */
    var bleInformationListener: BLEInformationListener? = null

    /**
     * Retrieves device information from the connected device
     * 
     * @param bleDeviceListener Listener to receive device information
     */
    fun getDeviceInformation(bleDeviceListener: BLEInformationListener) {
        bleInformationListener = bleDeviceListener
        logInfo("Getting device information with listener: $deviceInformationListener")
        mbtClient?.getDeviceInformation(deviceInformationListener)
    }

    /**
     * Connects to audio device via BLE
     * 
     * @param listener Connection listener for audio connection events
     */
    @SuppressLint("MissingPermission")
    fun connectToMLAudioBle(listener: ConnectionListener) {
        logInfo("$LOG_TAG_AUDIO Connecting to audio device via BLE")
        mbtClient?.connectAudioViaBLE(listener)
    }

    /**
     * Connects to a specific BLE device by name
     * 
     * @param deviceName Name of the device to connect to
     * @param listener Connection listener for BLE connection events
     */
    @SuppressLint("MissingPermission")
    fun connectToMLBle(deviceName: String?, listener: ConnectionListener) {
        logInfo("$LOG_TAG_CONNECTION Connecting to BLE device: $deviceName")
        
        val targetDevice = discoveredDevices.find { it.bluetoothDevice.name == deviceName }
        
        if (targetDevice == null) {
            logWarning("$LOG_TAG_CONNECTION Target device not found: $deviceName")
            return
        }
        
        attemptBleConnection(targetDevice, listener)
    }

    /**
     * Attempts to connect to a BLE device
     */
    private fun attemptBleConnection(targetDevice: MbtDevice, listener: ConnectionListener) {
        val isBleConnectionEstablished = mbtClient?.getBleConnectionStatus()?.isConnectionEstablished
        logInfo("$LOG_TAG_CONNECTION BLE connection status: $isBleConnectionEstablished")
        
        if (isBleConnectionEstablished == false) {
            logInfo("$LOG_TAG_CONNECTION Connecting with type: $bluetoothConnectionType")
            updateConnectionState(ConnectionState.CONNECTING)
            mbtClient?.connect(targetDevice, listener, bluetoothConnectionType)
        }
    }

    /**
     * Stops the current BLE scan
     */
    fun stopScan() {
        try {
            logInfo("$LOG_TAG_SCAN Stopping BLE scan")
            mbtClient?.stopScan()
            updateConnectionState(ConnectionState.DISCONNECTED)
        } catch (ex: Exception) {
            logError("$LOG_TAG_SCAN Failed to stop scan", ex)
        }
    }

    /**
     * Stops the current audio scan
     */
    fun stopAudioScan() {
        try {
            logInfo("$LOG_TAG_AUDIO Stopping audio scan")
            mbtClient?.stopScanAudio()
        } catch (ex: Exception) {
            logError("$LOG_TAG_AUDIO Failed to stop audio scan", ex)
        }
    }

    /**
     * Stops EEG data streaming
     */
    fun stopStreaming() {
        logInfo("$LOG_TAG_EEG Stopping EEG streaming")
        mbtClient?.stopStreaming()
    }

    /** Device information cache */
    var cachedDeviceInformation: DeviceInformation? = null
    
    /**
     * Creates and returns a device information listener
     * 
     * @return DeviceInformationListener instance
     */
    private fun createDeviceInformationListener(): DeviceInformationListener {
        return object : DeviceInformationListener {
            @SuppressLint("MissingPermission")
            override fun onDeviceInformation(deviceInformation: DeviceInformation) {
                handleDeviceInformationReceived(deviceInformation)
            }

            override fun onDeviceInformationError(error: Throwable) {
                logError("Device information error: $error")
            }
        }
    }

    /**
     * Handles received device information
     */
    private fun handleDeviceInformationReceived(deviceInformation: DeviceInformation) {
        cachedDeviceInformation = deviceInformation
        logInfo("Device information received: ${deviceInformation.toJson()}")
        
        connectionListener?.onDeviceReady(ML_BLE_CONNECTED_WITH_DEVICE_INFORMATION)
        deviceFirmwareVersion = deviceInformation.firmwareVersion
        
        bleInformationListener?.onDeviceInformationFound(deviceInformation)
        
        if (!isAudioConnected) {
            handleAudioConnection(deviceInformation.audioName)
        }
    }

    /**
     * Handles audio connection setup
     */
    private fun handleAudioConnection(targetAudioName: String?) {
        targetAudioName?.let { targetName ->
            val connectedDevices = getA2DPConnectedDevice()
            val connectedDeviceCount = connectedDevices.size
            
            logInfo("$LOG_TAG_AUDIO Checking A2DP connections: $connectedDeviceCount devices")
            
            if (connectedDeviceCount > 0) {
                checkExistingAudioConnection(connectedDevices, targetName)
            } else {
                connectionListener?.let { connectToMLAudioBle(it) }
            }
        }
    }

    /**
     * Checks for existing audio connection
     */
    private fun checkExistingAudioConnection(connectedDevices: List<BluetoothDevice>, targetName: String) {
        for (connectedDevice in connectedDevices) {
            val connectedAudioDeviceName = connectedDevice.name
            logInfo("$LOG_TAG_AUDIO Checking audio device: $connectedAudioDeviceName vs target: $targetName")
            
            if (connectedAudioDeviceName.equals(targetName)) {
                connectionListener?.onDeviceReady(ML_AUDIO_CONNECTED)
                break
            }
        }
    }

    /**
     * SDK EEG listener for processing EEG data packets
     */
    val sdkEegListener = object : EEGListener {
        override fun onEEGStatusChange(isEnabled: Boolean) {
            logInfo("$LOG_TAG_EEG EEG status changed: $isEnabled")
            currentEegListener?.onEEGStatusChange(isEnabled)
        }

        override fun onEegError(error: Throwable) {
            logError("$LOG_TAG_EEG EEG error: $error")
            currentEegListener?.onEegError(error)
        }

        override fun onEegPacket(mbtEEGPacket: MbtEEGPacket) {
            val processedPacket = processEegPacket(mbtEEGPacket)
            currentEegListener?.onEegPacket(processedPacket)
        }
    }
    
    /** Current EEG listener for data processing */
    var currentEegListener: EEGListener? = null

    /**
     * Processes EEG packet with optional mock data generation
     */
    private fun processEegPacket(originalPacket: MbtEEGPacket): MbtEEGPacket {
        if (!DataManager.shouldMockingEeg) {
            return originalPacket
        }
        
        return generateMockEegPacket()
    }

    /**
     * Generates mock EEG data packet
     */
    private fun generateMockEegPacket(): MbtEEGPacket {
        val sampleData = if (currentDeviceType == EnumMBTDevice.MELOMIND) {
            SampleData.eegSampleMelomind
        } else {
            SampleData.eegSample
        }
        
        val mockEegPacket: MbtEEGPacket = Gson().fromJson(sampleData, MbtEEGPacket::class.java)
        val channelData = jsonArrayStringToArrayOfFloatArray(SampleData.channelData)
        
        populateMockChannelData(mockEegPacket, channelData)
        
        logInfo("$LOG_TAG_EEG Mock EEG packet generated - channels: ${mockEegPacket.channelsData.size}")
        logInfo("$LOG_TAG_EEG Mock EEG packet generated - qualities: ${mockEegPacket.qualities}")
        
        return mockEegPacket
    }

    /**
     * Populates mock channel data
     */
    private fun populateMockChannelData(mockEegPacket: MbtEEGPacket, channelData: Array<FloatArray>) {
        for (i in 0 until EEG_PACKET_SIZE) {
            // Populate first two channels for all devices
            val randomIndex1 = (0 until CHANNEL_DATA_SIZE).random()
            mockEegPacket.channelsData[0][i] = channelData[0][randomIndex1]
            val randomIndex2 = (0 until CHANNEL_DATA_SIZE).random()
            mockEegPacket.channelsData[1][i] = channelData[1][randomIndex2]
            
            // Populate additional channels for QPlus
            if (currentDeviceType == EnumMBTDevice.Q_PLUS) {
                val randomIndex3 = (0 until CHANNEL_DATA_SIZE).random()
                mockEegPacket.channelsData[2][i] = channelData[2][randomIndex3]
                val randomIndex4 = (0 until CHANNEL_DATA_SIZE).random()
                mockEegPacket.channelsData[3][i] = channelData[3][randomIndex4]
            }
        }
    }

    /**
     * Converts JSON array string to array of float arrays
     * 
     * @param jsonArrayString JSON string representation of the array
     * @return Array of FloatArray containing the parsed data
     */
    private fun jsonArrayStringToArrayOfFloatArray(jsonArrayString: String): Array<FloatArray> {
        val jsonArray = JSONArray(jsonArrayString)
        val array = Array(jsonArray.length()) { FloatArray(0) }
        
        for (i in 0 until jsonArray.length()) {
            val innerJsonArray = jsonArray.getJSONArray(i)
            val innerArray = FloatArray(innerJsonArray.length())
            
            for (j in 0 until innerJsonArray.length()) {
                innerArray[j] = innerJsonArray.getDouble(j).toFloat()
            }
            array[i] = innerArray
        }
        return array
    }

    /**
     * Sets the EEG listener for data processing
     * 
     * @param listener EEG listener to receive data packets
     */
    fun setEEGListener(listener: EEGListener) {
        currentEegListener = listener
        logInfo("$LOG_TAG_EEG EEG listener set: $currentEegListener")
        mbtClient?.setEEGListener(sdkEegListener)
    }

    /**
     * Starts or stops EEG data streaming
     * 
     * @param listener EEG listener for data processing
     */
    fun startStopEEG(listener: EEGListener) {
        logInfo("$LOG_TAG_EEG Starting/stopping EEG, listener: $listener")

        if (!isDeviceConnected()) {
            logWarning("$LOG_TAG_EEG Cannot start streaming - device not connected")
            return
        }

        if (mbtClient?.isEEGEnabled() == false) {
            startEegStreaming(listener)
        } else {
            stopStreaming()
        }
    }

    /**
     * Starts EEG streaming
     */
    private fun startEegStreaming(listener: EEGListener) {
        setEEGListener(listener)
        logInfo("$LOG_TAG_EEG Starting EEG streaming")
        
        mbtClient?.startStreaming(
            StreamingParams.Builder()
                .setEEG(true)
                .setTriggerStatus(false)
                .setAccelerometer(false)
                .setQualityChecker(true)
                .setEEGFilterConfig(eegFilterMode)
                .build()
        )
    }

    /**
     * Disconnects from the BLE device
     */
    fun actionDisconnected() {
        logError("$LOG_TAG_CONNECTION Disconnecting from BLE")
        mbtClient?.disconnect()
        updateConnectionState(ConnectionState.DISCONNECTED)
    }

    /**
     * Disconnects from the audio device
     */
    fun actionAudioDisconnected() {
        logInfo("$LOG_TAG_AUDIO Disconnecting from audio device")
        mbtClient?.disconnectAudioViaBLE()
    }

    /**
     * Secures a list of floats by replacing NaN values with 0
     * 
     * @param floatList List of float values to secure
     * @return List with NaN values replaced by 0
     */
    fun secureNaN(floatList: ArrayList<Float>): ArrayList<Float> {
        for (i in floatList.indices) {
            if (floatList[i].isNaN()) {
                floatList[i] = 0f
            }
        }
        return floatList
    }

    /**
     * Calibrates EEG data using the provided packets
     * 
     * @param eegPackets List of EEG packets for calibration
     * @return Calibration result or null if calibration fails
     */
    fun calibrate(eegPackets: List<MbtEEGPacket>): EEGCalibrateResult? {
        try {
            logInfo("$LOG_TAG_EEG Calibrating with ${eegPackets.size} packets")
            val recordedData = EEGRecordedDatas()
            recordedData.eegPackets = eegPackets
            return mbtClient?.eegCalibration(recordedData)
        } catch (ex: Exception) {
            logError("$LOG_TAG_EEG Calibration failed", ex)
            return null
        }
    }

    /**
     * Starts a relaxing index session with calibration results
     * 
     * @param calibrationResult Calibration result from previous calibration
     */
    fun startRelaxingIndexSession(calibrationResult: EEGCalibrateResult) {
        logInfo("$LOG_TAG_EEG Starting relaxing index session with calibration: $calibrationResult")
        mbtClient?.eggStartRelaxingIndexSession(calibrationResult)
    }

    /**
     * Ends the current relaxing index session
     * 
     * @return Relaxing index session output data or null
     */
    fun endRelaxingIndexSession(): RelaxIndexSessionOutputData? {
        logInfo("$LOG_TAG_EEG Ending relaxing index session")
        return mbtClient?.eggEngRelaxingIndexSession()
    }

    /**
     * Computes relaxing index from EEG packets
     * 
     * @param eegPackets List of EEG packets for computation
     * @return Relaxing index value or -1 if computation fails
     */
    fun computeRelaxIndex(eegPackets: List<MbtEEGPacket>): Float {
        val recordedData = EEGRecordedDatas()
        val packetCount = eegPackets.size
        logInfo("$LOG_TAG_EEG Computing relax index with $packetCount packets")
        
        if (packetCount > 0) {
            recordedData.eegPackets = eegPackets
            return mbtClient?.eegRelaxingIndex(recordedData) ?: -1f
        } else {
            return -1f
        }
    }

    /**
     * Computes statistics with threshold and SNR values
     * 
     * @param threshold Threshold value for computation
     * @param snrValues Array of SNR values
     * @return HashMap containing computed statistics or null
     */
    fun computeStatistic(threshold: Float, snrValues: Array<Float>): HashMap<String, Float>? {
        return mbtClient?.computeStatistics(threshold, snrValues)
    }

    /**
     * Checks if location services are enabled
     * 
     * @param context Application context
     * @return true if location is enabled, false otherwise
     */
    fun isLocationEnabled(context: Context): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    /**
     * Checks if a device is currently connected
     * 
     * @return true if device is connected, false otherwise
     */
    fun isDeviceConnected(): Boolean {
        val bleDeviceConnected = mbtClient?.getBleConnectionStatus()?.isConnectionEstablished == true
        logInfo("$LOG_TAG_CONNECTION Device connection check - BLE device: $connectedBleDevice, BLE connected: $bleDeviceConnected, Audio connected: $isAudioConnected")
        return (isAudioConnected) && bleDeviceConnected && connectedBleDevice != null
    }

    /**
     * Resets the Bluetooth scanning state
     */
    fun resetBluetoothScanningState() {
        logInfo("$LOG_TAG_SCAN Resetting Bluetooth scanning state")
        updateConnectionState(ConnectionState.DISCONNECTED)
        mbtClient?.stopScan()
    }

    /**
     * Resets all Bluetooth connections and states
     */
    fun resetBluetooth() {
        logInfo("$LOG_TAG_CONNECTION Resetting Bluetooth connections")
        actionDisconnected()
        resetBluetoothScanningState()
        stopAudioScan()
        isAudioConnected = false
    }

    /**
     * Updates the connection state and logs the change
     */
    private fun updateConnectionState(newState: ConnectionState) {
        val oldState = connectionState
        connectionState = newState
        logInfo("$LOG_TAG_CONNECTION State changed: $oldState -> $newState")
    }

    // ============================================================================
    // LOGGING UTILITIES
    // ============================================================================

    /**
     * Logs an info message
     */
    private fun logInfo(message: String) {
        TNLog.i(TAG, message)
    }

    /**
     * Logs a debug message
     */
    private fun logDebug(message: String) {
        TNLog.d(TAG, message)
    }

    /**
     * Logs a verbose message
     */
    private fun logVerbose(message: String) {
        TNLog.v(TAG, message)
    }

    /**
     * Logs a warning message
     */
    private fun logWarning(message: String) {
        TNLog.w(TAG, message)
    }

    /**
     * Logs an error message
     */
    private fun logError(message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            TNLog.e(TAG, message, throwable)
        } else {
            TNLog.e(TAG, message)
        }
    }
}