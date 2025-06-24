package com.cyrebroplugin

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.os.Build
import android.util.Log
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

class CyrebroModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    companion object {
        private const val TAG = "CyrebroModule"
    }


    private var buildInfo: String = ""
    @ReactMethod
    fun innitSDK(promise: Promise) {
        try {
            Log.d("Cyrebro.SDK", "SDK innitSDK called")
            MBTSDKV3BluetoothManager.setupMbtSdk(reactContext,EnumMBTDevice.Q_PLUS,promise)
        } catch (e: Exception) {
            e.printStackTrace()
            Log.d("Cyrebro.SDK", "Exception e:" + e.message)
            promise.reject(e)
        }
    }
    private fun getRequiredPermissions(): Array<String> {
        if (Build.VERSION.SDK_INT >= 31) { //Android 12 ~ API 31
            return arrayOf(
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        } else { // up to Android 9 ~ API 28
            return arrayOf(
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        }
    }
    @ReactMethod
    fun scanDevice(promise: Promise) {
        try {
            TNLog.v("Cyrebro.SDK", "SDK innitSDK called")
            MBTSDKV3BluetoothManager.scanBle("", promise)
        } catch (e: Exception) {
            e.printStackTrace()
            TNLog.v("Cyrebro.SDK", "Exception e:" + e.message)
            promise.reject(e)
        }
    }
    @ReactMethod
    fun isBluetoothEnabled(promise: Promise) {
        val result = BluetoothAdapter.getDefaultAdapter().isEnabled
        if (result) {
            promise.resolve("true")
        } else {
            promise.reject("false")
        }
    }

    @ReactMethod
    fun startEEGRecording(promise: Promise) {
        try {
            TNLog.v("Cyrebro.SDK", "Starting EEG recording")
            MBTSDKV3BluetoothManager.startStopEEG(object : EEGListener {
                override fun onEEGStatusChange(isEnabled: Boolean) {
                    TNLog.v("Cyrebro.SDK", "Starting EEG recording onEEGStatusChange")
                }

                override fun onEegError(error: Throwable) {
                    TNLog.v("Cyrebro.SDK", "Starting EEG recording onEegError:${error.message}")
                    promise.reject(error.message.toString())
                }

                override fun onEegPacket(mbtEEGPacket: MbtEEGPacket) {
                    TNLog.v("Cyrebro.SDK", "Starting EEG recording onEegPacket channelsData:${mbtEEGPacket.channelsData.size}")
                    TNLog.v("Cyrebro.SDK", "Starting EEG recording onEegPacket statusData:${mbtEEGPacket.statusData.size}")
                    TNLog.v("Cyrebro.SDK", "Starting EEG recording onEegPacket qualities:${mbtEEGPacket.qualities.size}")
                    TNLog.v("Cyrebro.SDK", "Starting EEG recording onEegPacket features:${mbtEEGPacket.features}")
                    // Convert mbtEEGPacket to WritableMap
                    val params = Arguments.createMap()
                    // Example: send channel data as JSON string (customize as needed)
                    params.putString("channelsData", com.google.gson.Gson().toJson(mbtEEGPacket.channelsData))
                    params.putDouble("timestamp", System.currentTimeMillis().toDouble())
                    sendEvent("onEEGPacket", params)
                }
            })
            promise.resolve("true")
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to start EEG recording: ${e.message}")
            promise.reject(e)
        }
    }

    @ReactMethod
    fun stopEEGRecording(promise: Promise) {
        try {
            TNLog.v("Cyrebro.SDK", "Stopping EEG recording")
           MBTSDKV3BluetoothManager.stopStreaming()
            promise.resolve("true")
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to stop EEG recording: ${e.message}")
            promise.reject(e)
        }
    }

    @ReactMethod
    fun isLocationEnabled(promise: Promise) {
        val result = MBTSDKV3BluetoothManager.isLocationEnabled(reactContext)
        if (result) {
            promise.resolve("true")
        } else {
            promise.reject("false")
        }
    }

    fun setBuildInfo(buildInfo: String) {
        this.buildInfo = buildInfo
    }

    override fun getName(): String {

        return "CyrebroSDK"
    }

    override fun onHostResume() {
        TNLog.v("Cyrebro.SDK", "onHostResume ")
    }

    override fun onHostPause() {
      TNLog.v("Cyrebro.SDK", "onHostPause ")
    }

    override fun onHostDestroy() {
        TNLog.v("Cyrebro.SDK", "onHostDestroy ")
    }
    @ReactMethod
    fun stopScanDevice(promise: Promise) {
        try {
            TNLog.v("Cyrebro.SDK", "Stopping BLE scan")
            MBTSDKV3BluetoothManager.stopScan()
            promise.resolve("BLE scan stopped")
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to stop BLE scan: ${e.message}")
            promise.reject(e)
        }
    }

    @ReactMethod
    fun connectBLEDevice(deviceName: String, promise: Promise) {

        val bluetoothConnectionListen = object: ConnectionListener {
            override fun onAudioDisconnected() {
                TNLog.e("Cyrebro.SDK", "onAudioDisconnected ")
            }

            override fun onBonded(device: BluetoothDevice) {

                TNLog.d("Cyrebro.SDK", "onBonded ")
            }

            override fun onBondingFailed(device: BluetoothDevice) {
                TNLog.e("Cyrebro.SDK", "onBondingFailed ")
            }

            override fun onBondingRequired(device: BluetoothDevice) {

                TNLog.v("Cyrebro.SDK", "onBondingRequired ")
            }

            override fun onConnectionError(
                error: Throwable,
                errorCode: MBTErrorCode
            ) {
                TNLog.e("Cyrebro.SDK", "onConnectionError error: ${error.message}, errorCode: $errorCode")
                promise.reject(ML_BLE_DIS_CONNECTED,error)
            }

            override fun onDeviceDisconnected() {
                TNLog.e("Cyrebro.SDK", "onDeviceDisconnected ")
                promise.reject(ML_BLE_DIS_CONNECTED)
            }

            override fun onDeviceReady(message: String) {

                TNLog.v("Cyrebro.SDK", "onDeviceReady :$message")
                // do get the device info here
                MBTSDKV3BluetoothManager.getDeviceInformation(object : BLEInformationListener {
                    override fun onDeviceInformationFound(information: DeviceInformation) {
                        TNLog.v("Cyrebro.SDK", "Device Information: ${Gson().toJson(information)}")
                        //get device Battery level
                        MBTSDKV3BluetoothManager.getBatteryLevel(object : BatteryLevelListener {
                            override fun onBatteryLevel(float: Float) {
                                TNLog.v("Cyrebro.SDK", "Device onBatteryLevel: ${float}")
                                val deviceStatus = DeviceStatus(information, float)
                                promise.resolve(JsonUtil().toJsonString(deviceStatus))

                            }
                            // Handle error in getting battery level
                            override fun onBatteryLevelError(error: Throwable) {
                                val deviceStatus = DeviceStatus(information, -1f)
                                promise.resolve(JsonUtil().toJsonString(deviceStatus))
                            }

                        })
                    }


                })

            }

            override fun onServiceDiscovered(message: String) {
                TNLog.v("Cyrebro.SDK", "onServiceDiscovered ")
            }

        }

        try {
            //work around for directly showing the pairing confirm dialog on the front of screen
            MBTSDKV3BluetoothManager.scanAudio()
            // TODO: Implement BLE connection TNLogic here
            TNLog.v("Cyrebro.SDK", "Connecting to BLE device: $deviceName")
            MBTSDKV3BluetoothManager.connectToMLBle(deviceName,bluetoothConnectionListen )
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to connect BLE device: ${e.message}")
            promise.reject(e)
        }
    }

    @ReactMethod
    fun disconnectBLEDevice(deviceId: String, promise: Promise) {
        try {
            // TODO: Implement BLE disconnection TNLogic here
            TNLog.v("Cyrebro.SDK", "Disconnecting BLE device: $deviceId")
            promise.resolve("BLE device $deviceId disconnected")
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to disconnect BLE device: ${e.message}")
            promise.reject(e)
        }
    }

    @ReactMethod
    fun connectAudioDevice(deviceId: String, promise: Promise) {
        try {
            // TODO: Implement audio device connection TNLogic here
            TNLog.v("Cyrebro.SDK", "Connecting to audio device: $deviceId")
            promise.resolve("Audio device $deviceId connected")
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to connect audio device: ${e.message}")
            promise.reject(e)
        }
    }

    @ReactMethod
    fun disconnectAudioDevice(deviceId: String, promise: Promise) {
        try {
            // TODO: Implement audio device disconnection TNLogic here
            TNLog.v("Cyrebro.SDK", "Disconnecting audio device: $deviceId")
            promise.resolve("Audio device $deviceId disconnected")
        } catch (e: Exception) {
            TNLog.e("Cyrebro.SDK", "Failed to disconnect audio device: ${e.message}")
            promise.reject(e)
        }
    }

    // Helper to send events to JS
    private fun sendEvent(eventName: String, params: WritableMap) {
        TNLog.v("Cyrebro.SDK", "eventName:${eventName} params:${params}")
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // ...implement other methods and logic as in the Java version...
}
