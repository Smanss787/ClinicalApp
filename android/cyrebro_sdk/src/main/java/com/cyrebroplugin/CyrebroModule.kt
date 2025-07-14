package com.cyrebroplugin

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresPermission
import com.cyrebroplugin.DataManager.ML_BLE_DIS_CONNECTED
import com.cyrebroplugin.model.DeviceStatus
import com.cyrebroplugin.utility.JsonUtil
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.Gson
import com.mybraintech.sdk.core.listener.BatteryLevelListener
import com.mybraintech.sdk.core.listener.ConnectionListener
import com.mybraintech.sdk.core.listener.EEGListener
import com.mybraintech.sdk.core.model.DeviceInformation
import com.mybraintech.sdk.core.model.EnumMBTDevice
import com.mybraintech.sdk.core.model.MBTErrorCode
import com.mybraintech.sdk.core.model.MbtEEGPacket

/**
 * React Native module for Cyrebro SDK integration.
 * This module handles BLE device connection, EEG recording, and other device management functionalities.
 * @param reactContext The ReactApplicationContext for interacting with React Native.
 */
class CyrebroModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    
    companion object {
        private const val TAG = "CyrebroModule"
        private const val MELOMIND_DEVICE_ID = 1
        private const val QPLUS_DEVICE_ID = 2
    }

    override fun getName(): String = "CyrebroSDK"

    // MARK: - SDK Initialization
    
    /**
     * Initializes the Cyrebro SDK with the specified headset type.
     * @param headsetId The ID of the headset to initialize (1 for MELOMIND, 2 for Q_PLUS).
     * @param promise A Promise that will be resolved or rejected based on the initialization result.
     */
    @ReactMethod
    fun innitSDK(headsetId: Int, promise: Promise) {
        Log.v(TAG, "Initializing SDK with headsetId: $headsetId")
        try {

            val deviceType = when (headsetId) {
                MELOMIND_DEVICE_ID -> EnumMBTDevice.MELOMIND
                QPLUS_DEVICE_ID -> EnumMBTDevice.Q_PLUS
                else -> throw IllegalArgumentException("Invalid headsetId: $headsetId. Valid values are $MELOMIND_DEVICE_ID for MELOMIND and $QPLUS_DEVICE_ID for Q_PLUS.")
            }
            
            MBTSDKV3BluetoothManager.setupMbtSdk(reactContext, deviceType, promise)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize SDK: ${e.message}")
            promise.reject("SDK_INIT_ERROR", e.message, e)
        }
    }

    // MARK: - Device Scanning
    
    /**
     * Starts scanning for nearby BLE devices.
     * @param promise A Promise that will be resolved or rejected based on the scan result.
     */
    @ReactMethod
    fun scanDevice(promise: Promise) {

        try {
            Log.v(TAG, "Starting BLE device scan")
            MBTSDKV3BluetoothManager.scanBle("", promise)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start device scan: ${e.message}")
            promise.reject("SCAN_ERROR", e.message, e)
        }
    }

    /**
     * Stops the ongoing BLE device scan.
     * @param promise A Promise that will be resolved when the scan is stopped.
     */
    @ReactMethod
    fun stopScanDevice(promise: Promise) {
        try {
            Log.v(TAG, "Stopping BLE scan")
            MBTSDKV3BluetoothManager.stopScan()
            promise.resolve("BLE scan stopped successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop BLE scan: ${e.message}")
            promise.reject("STOP_SCAN_ERROR", e.message, e)
        }
    }

    // MARK: - Device Connection
    
    /**
     * Connects to a BLE device with the specified name.
     * @param deviceName The name of the device to connect to.
     * @param promise A Promise that will be resolved with the device status upon successful connection, or rejected on failure.
     */
    @ReactMethod
    fun connectBLEDevice(deviceName: String, promise: Promise) {
        val connectionListener = createConnectionListener(promise)
        
        try {
            Log.v(TAG, "Connecting to BLE device: $deviceName")
            // Workaround for directly showing the pairing confirm dialog on the front of screen
            MBTSDKV3BluetoothManager.scanAudio()
            MBTSDKV3BluetoothManager.connectToMLBle(deviceName, connectionListener)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect BLE device: ${e.message}")
            promise.reject("CONNECTION_ERROR", e.message, e)
        }
    }

    /**
     * Disconnects from a BLE device.
     * @param deviceId The ID of the device to disconnect from.
     * @param promise A Promise that will be resolved on successful disconnection.
     */
    @ReactMethod
    fun disconnectBLEDevice(deviceId: String, promise: Promise) {
        try {
            Log.v(TAG, "Disconnecting BLE device: $deviceId")
            // TODO: Implement actual BLE disconnection logic
            promise.resolve("BLE device $deviceId disconnected successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to disconnect BLE device: ${e.message}")
            promise.reject("DISCONNECTION_ERROR", e.message, e)
        }
    }

    // MARK: - EEG Recording
    
    /**
     * Starts EEG recording.
     * @param promise A Promise that will be resolved when EEG recording starts successfully.
     */
    @ReactMethod
    fun startEEGRecording(promise: Promise) {
        try {
            Log.v(TAG, "Starting EEG recording")
            MBTSDKV3BluetoothManager.startStopEEG(createEEGListener(promise))
            promise.resolve("EEG recording started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start EEG recording: ${e.message}")
            promise.reject("EEG_START_ERROR", e.message, e)
        }
    }

    /**
     * Stops EEG recording.
     * @param promise A Promise that will be resolved when EEG recording stops successfully.
     */
    @ReactMethod
    fun stopEEGRecording(promise: Promise) {
        try {
            Log.v(TAG, "Stopping EEG recording")
            MBTSDKV3BluetoothManager.stopStreaming()
            promise.resolve("EEG recording stopped successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop EEG recording: ${e.message}")
            promise.reject("EEG_STOP_ERROR", e.message, e)
        }
    }

    // MARK: - Mock Data
    
    /**
     * Enables or disables mock EEG data.
     * @param enable Set to true to enable mock data, false to disable.
     * @param promise A Promise that will be resolved with the new mock data status.
     */
    @ReactMethod
    fun mockEegData(enable: Boolean, promise: Promise) {
        Log.v(TAG, "Toggling mock EEG data: $enable")
        try {
            DataManager.shouldMockingEeg = enable
            val status = if (enable) "enabled" else "disabled"
            Log.v(TAG, "Mock EEG data $status")
            promise.resolve("Mock EEG data is now $status")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to toggle mock EEG data: ${e.message}")
            promise.reject("MOCK_DATA_ERROR", e.message, e)
        }
    }

    // MARK: - System Services
    
    /**
     * Checks if Bluetooth is enabled on the device.
     * @param promise A Promise that will be resolved with true if Bluetooth is enabled, or rejected otherwise.
     */
    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        Log.v(TAG, "Checking Bluetooth status")
        try {
            val isEnabled = BluetoothAdapter.getDefaultAdapter().isEnabled
            if (isEnabled) {
                promise.resolve(true)
            } else {
                promise.reject("BLUETOOTH_DISABLED", "Bluetooth is not enabled")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check Bluetooth status: ${e.message}")
            promise.reject("BLUETOOTH_CHECK_ERROR", e.message, e)
        }
    }

    /**
     * Checks if Location services are enabled on the device.
     * @param promise A Promise that will be resolved with true if Location is enabled, or rejected otherwise.
     */
    @ReactMethod
    fun isLocationEnabled(promise: Promise) {
        Log.v(TAG, "Checking Location services status")
        try {
            val isEnabled = MBTSDKV3BluetoothManager.isLocationEnabled(reactContext)
            if (isEnabled) {
                promise.resolve(true)
            } else {
                promise.reject("LOCATION_DISABLED", "Location services are not enabled")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check location status: ${e.message}")
            promise.reject("LOCATION_CHECK_ERROR", e.message, e)
        }
    }

    // MARK: - App Management
    
    /**
     * Exits the application.
     * @param promise A Promise that will be resolved before exiting the app.
     */
    @ReactMethod
    fun exitApp(promise: Promise) {
        Log.v(TAG, "Exiting application")
        try {
            Log.v(TAG, "Exiting application")
            promise.resolve(true)
            System.exit(0)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to exit app: ${e.message}")
            promise.reject("EXIT_ERROR", e.message, e)
        }
    }

    // MARK: - Audio Device Management (Placeholder implementations)
    
    /**
     * Connects to an audio device.
     * (Placeholder implementation)
     * @param deviceId The ID of the audio device to connect to.
     * @param promise A Promise that will be resolved on successful connection.
     */
    @ReactMethod
    fun connectAudioDevice(deviceId: String, promise: Promise) {
        Log.v(TAG, "Connecting to audio device: $deviceId")
        try {
            Log.v(TAG, "Connecting to audio device: $deviceId")
            // TODO: Implement actual audio device connection logic
            promise.resolve("Audio device $deviceId connected successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect audio device: ${e.message}")
            promise.reject("AUDIO_CONNECTION_ERROR", e.message, e)
        }
    }

    /**
     * Disconnects from an audio device.
     * (Placeholder implementation)
     * @param deviceId The ID of the audio device to disconnect from.
     * @param promise A Promise that will be resolved on successful disconnection.
     */
    @ReactMethod
    fun disconnectAudioDevice(deviceId: String, promise: Promise) {
        Log.v(TAG, "Disconnecting audio device: $deviceId")
        try {
            Log.v(TAG, "Disconnecting audio device: $deviceId")
            // TODO: Implement actual audio device disconnection logic
            promise.resolve("Audio device $deviceId disconnected successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to disconnect audio device: ${e.message}")
            promise.reject("AUDIO_DISCONNECTION_ERROR", e.message, e)
        }
    }

    // MARK: - Lifecycle Events
    
    override fun onHostResume() {
        Log.v(TAG, "onHostResume")
    }

    override fun onHostPause() {
        Log.v(TAG, "onHostPause")
    }

    override fun onHostDestroy() {
        Log.v(TAG, "onHostDestroy")
    }

    // MARK: - Private Helper Methods

    /**
     * Creates a [ConnectionListener] to handle BLE connection events.
     * @param promise The promise to be resolved or rejected based on connection events.
     * @return A [ConnectionListener] instance.
     */
    @SuppressLint("MissingPermission")
    private fun createConnectionListener(promise: Promise): ConnectionListener {
        return object : ConnectionListener {
            override fun onAudioDisconnected() {
                Log.e(TAG, "Audio disconnected")
            }


            override fun onBonded(device: BluetoothDevice) {
                Log.d(TAG, "Device bonded: ${device.name}")
            }

            override fun onBondingFailed(device: BluetoothDevice) {
                Log.e(TAG, "Bonding failed for device: ${device.name}")
            }

            override fun onBondingRequired(device: BluetoothDevice) {
                Log.v(TAG, "Bonding required for device: ${device.name}")
            }

            override fun onConnectionError(error: Throwable, errorCode: MBTErrorCode) {
                Log.e(TAG, "Connection error: ${error.message}, errorCode: $errorCode")
                promise.reject(ML_BLE_DIS_CONNECTED, error.message, error)
            }

            override fun onDeviceDisconnected() {
                Log.e(TAG, "Device disconnected")
                promise.reject(ML_BLE_DIS_CONNECTED, "Device disconnected")
            }

            override fun onDeviceReady(message: String) {
                Log.v(TAG, "Device ready: $message")
                getDeviceInformation(promise)
            }

            override fun onServiceDiscovered(message: String) {
                Log.v(TAG, "Service discovered: $message")
            }
        }
    }

    /**
     * Creates an [EEGListener] to handle EEG data and status changes.
     * @param promise The promise to be rejected in case of an EEG error.
     * @return An [EEGListener] instance.
     */
    private fun createEEGListener(promise: Promise): EEGListener {
        return object : EEGListener {
            override fun onEEGStatusChange(isEnabled: Boolean) {
                Log.v(TAG, "EEG status changed: $isEnabled")
            }

            override fun onEegError(error: Throwable) {
                Log.e(TAG, "EEG error: ${error.message}")
                promise.reject("EEG_ERROR", error.message, error)
            }

            override fun onEegPacket(mbtEEGPacket: MbtEEGPacket) {
                Log.v(TAG, "EEG packet received - channels: ${mbtEEGPacket.channelsData.size}, qualities: ${mbtEEGPacket.qualities.size}")
                sendEEGPacketEvent(mbtEEGPacket)
            }
        }
    }

    /**
     * Retrieves device information and subsequently the battery level.
     * @param promise The promise to be resolved with the device status.
     */
    private fun getDeviceInformation(promise: Promise) {
        MBTSDKV3BluetoothManager.getDeviceInformation(object : BLEInformationListener {
            override fun onDeviceInformationFound(information: DeviceInformation) {
                Log.v(TAG, "Device information found: ${Gson().toJson(information)}")
                getBatteryLevel(information, promise)
            }
        })
    }

    /**
     * Retrieves the battery level of the device.
     * @param information The device information.
     * @param promise The promise to be resolved with the device status.
     */
    private fun getBatteryLevel(information: DeviceInformation, promise: Promise) {
        MBTSDKV3BluetoothManager.getBatteryLevel(object : BatteryLevelListener {
            override fun onBatteryLevel(level: Float) {
                Log.v(TAG, "Battery level: $level")
                val deviceStatus = DeviceStatus(information, level)
                promise.resolve(JsonUtil().toJsonString(deviceStatus))
            }

            override fun onBatteryLevelError(error: Throwable) {
                Log.e(TAG, "Battery level error: ${error.message}")
                val deviceStatus = DeviceStatus(information, -1f)
                promise.resolve(JsonUtil().toJsonString(deviceStatus))
            }
        })
    }

    /**
     * Sends an EEG packet event to React Native.
     * @param mbtEEGPacket The EEG packet to be sent.
     */
    private fun sendEEGPacketEvent(mbtEEGPacket: MbtEEGPacket) {
        val params = Arguments.createMap().apply {
            putString("channelsData", Gson().toJson(mbtEEGPacket.channelsData))
            putArray("qualities", Arguments.createArray().apply {
                mbtEEGPacket.qualities.forEach { quality ->
                    pushDouble(quality.toDouble())
                }
            })
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        sendEvent("onEEGPacket", params)
    }

    /**
     * Sends an event to React Native.
     * @param eventName The name of the event to send.
     * @param params The event parameters.
     */
    private fun sendEvent(eventName: String, params: WritableMap) {
        Log.v(TAG, "Sending event: $eventName")
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
