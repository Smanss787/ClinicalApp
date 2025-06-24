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

object MBTSDKV3BluetoothManager {

    val TAG: String = MBTSDKV3BluetoothManager::class.java.simpleName
    var mbtClient: MbtClient? = null
    var scannedDevices: MutableList<MbtDevice> = mutableListOf<MbtDevice>()
    var melomindBleDevice: MbtDevice? = null
        set(value) {
            field = value
            TNLog.d(TAG, " the ble mbtDevice set to:${value}")
        }

    var firmwareVersion: String? = null
    var audioConnected: Boolean = false

    private var filterMode = EnumEEGFilterConfig.NO_FILTER
    private val deviceInformationListener: DeviceInformationListener by lazy { createDeviceInformationListener() }
    private var connectionListener: ConnectionListener? = null
    public var isScanning: Boolean = false
    public var wasDisconnectedInSomeWhere: Boolean = false

    var connectionType = EnumBluetoothConnection.BLE_AUDIO

    fun isOdaRequest(): Boolean {
        return false
    }


    var sdkInnit = false

    @SuppressLint("MissingPermission")
    fun setupMbtSdk(context: Context, deviceType: EnumMBTDevice,promiss: Promise) {
        TNLog.d(TAG, " setupMbtSdk sdkInnit:${sdkInnit}")
        if (!sdkInnit) {

            TNLog.d(TAG, "[setupMbtSdk] start setupMbtSdk")
            var useDeviceType = deviceType

            audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

            if (mbtClient == null) {
                mbtClient = MbtClientManager.getMbtClient(context, useDeviceType)
                TNLog.d(TAG, "[setupMbtSdk] mbtClient:${mbtClient}")
            }
            mbtClient?.initA2DP()
            val connectionStatus = mbtClient?.getBleConnectionStatus()
            TNLog.i(
                TAG,
                "[setupMbtSdk] isConnectionEstablished = ${connectionStatus?.isConnectionEstablished}"
            )
            if (connectionStatus?.isConnectionEstablished == true) {

                TNLog.i(
                    TAG,
                    "[setupMbtSdk] bluetoothDevice[BLE] name = ${connectionStatus?.mbtDevice?.bluetoothDevice?.name}"
                )
            }
            sdkInnit = true
            promiss.resolve("SDK initialized successfully")
        } else {
            promiss.resolve("SDK already initialized")
        }
    }

    fun getBatteryLevel(batteryLevelListener: BatteryLevelListener) {
        TNLog.d(TAG,"getBatteryLevel")
        if (mbtClient?.getBleConnectionStatus()?.isConnectionEstablished == true) {
            mbtClient?.getBatteryLevel(batteryLevelListener)
        } else {
            TNLog.d(
                TAG,
                "no device"
            )
        }
    }

    fun startRecording(recordingOption: RecordingOption, listener: RecordingListener) {
        TNLog.d(TAG, " startRecording ")
        val isDeviceConnected = isDeviceConnected()
        if (isDeviceConnected) {

            mbtClient?.startRecording(recordingOption, listener)
        } else {
            listener.onRecordingError(Exception("Device not connected"))
        }
    }

    fun stopRecording() {
        TNLog.d(TAG, " stopRecording ")
        mbtClient?.stopRecording()
    }

    var audioManager: AudioManager? = null

    @SuppressLint("MissingPermission")
    fun scanBle(targetName:String,promise: Promise) {
        TNLog.i(TAG, "scanBle isScanning:$isScanning targetName:$targetName")
        if (!isScanning) {
            TNLog.d(TAG, "scanBle isScanning is false start to scan")
            mbtClient?.startScan(targetName,object: ScanResultListener {
                override fun onMbtDevices(mbtDevices: List<MbtDevice>) {
                    val firstBleItem = mbtDevices.first()
                    val device = firstBleItem.bluetoothDevice
                    TNLog.d("Cyrebro.SDK", "onMbtDevices size: ${mbtDevices.size}")
                    val bondStateString = when (device.bondState) {
                        BluetoothDevice.BOND_NONE -> "Not Bonded"
                        BluetoothDevice.BOND_BONDING -> "Bonding..."
                        BluetoothDevice.BOND_BONDED -> "Bonded"
                        else -> "Unknown Bond State"
                    }
                    val dataTobeResolved = "${device.name}\n${device.address}\n${bondStateString}"
                    promise.resolve(dataTobeResolved)
                    scannedDevices.clear()
                    scannedDevices.add(firstBleItem)
                    mbtClient?.stopScan()
                    isScanning = false
                }

                override fun onOtherDevices(otherDevices: List<BluetoothDevice>) {
                    TNLog.v("Cyrebro.SDK", "onOtherDevices")
                    isScanning = false
                }

                override fun onScanError(error: Throwable) {
                    TNLog.e("Cyrebro.SDK", "onScanError:${error.message}")
                    isScanning = false
                    mbtClient?.stopScan()
                    promise.resolve(error.message)
                }

            })
            isScanning = true
        } else {
            promise.resolve("Stop scan")
        }
    }

    @SuppressLint("MissingPermission")
    fun scanAudio() {
        TNLog.i(TAG, "scanAudio isAudioScanning");
        mbtClient?.startScanAudio("",null)
    }

    @SuppressLint("MissingPermission")
    fun getA2DPConnectedDevice(): List<BluetoothDevice> {
        val a2dp = mbtClient?.getA2DP()

        val connectedDevices = a2dp?.connectedDevices ?: arrayListOf()
        return connectedDevices
    }
    var bleInformationListener:BLEInformationListener? = null


    fun getDeviceInformation(bleDeviceListener: BLEInformationListener) {
        bleInformationListener = bleDeviceListener
        TNLog.d(TAG, "getDeviceInformation with listener:$deviceInformationListener")
        mbtClient?.getDeviceInformation(deviceInformationListener)
    }


    @SuppressLint("MissingPermission")
    fun connectToMLAudioBle( listener: ConnectionListener) {
        mbtClient?.connectAudioViaBLE(listener)
    }



    @SuppressLint("MissingPermission")
    fun connectToMLBle(deviceName: String?, listener: ConnectionListener) {
        val tobeConnectDevice = scannedDevices.find { it -> it.bluetoothDevice.name == deviceName }
        TNLog.d(
            TAG,
            "connectToMLBle called with ML scanned device(mbtDevice):${tobeConnectDevice?.bluetoothDevice?.name} connectionListener:$listener"
        )
        if (tobeConnectDevice != null) {
            val isBleConnectionEstablished =
                mbtClient?.getBleConnectionStatus()?.isConnectionEstablished
            TNLog.d(
                TAG,
                "connectToMLBle from SDK isBleConnectionEstablished:$isBleConnectionEstablished"
            )
            TNLog.d(
                TAG,
                "connectToMLBle  from SDK BleConnectionStatus mbtDevice:${mbtClient?.getBleConnectionStatus()?.mbtDevice}"
            )
            if (isBleConnectionEstablished == false) {

                TNLog.d(TAG, "connectToMLBle called  mbtClient.connect with type:$connectionType")
                mbtClient?.connect(
                    tobeConnectDevice,
                    listener,
                    connectionType
                )
            }
        } else {
            TNLog.d(TAG, "connectToMLBle called with no device not connect any more")
        }
    }


    fun stopScan() {
        try {
            TNLog.d(TAG, "stopScan ")
            mbtClient?.stopScan()
        } catch (ex: Exception) {
            ex.printStackTrace()
        }
    }

    fun stopAudioScan() {
        try {
            TNLog.d(TAG, "stopAudioScan ")
            mbtClient?.stopScanAudio()
        } catch (ex: Exception) {
            ex.printStackTrace()
        }
    }


    fun stopStreaming() {
        TNLog.d(TAG, "stopStreaming...")
        mbtClient?.stopStreaming()

    }



    var mDeviceInformation: DeviceInformation? = null
    private fun createDeviceInformationListener(): DeviceInformationListener {
        return object : DeviceInformationListener {
            @SuppressLint("MissingPermission")
            override fun onDeviceInformation(deviceInformation: DeviceInformation) {

                mDeviceInformation = deviceInformation
                TNLog.d(
                    TAG,
                    "onDeviceInformation : ${deviceInformation.toJson()}"
                )

                TNLog.d(
                    TAG,
                    "onDeviceInformation connectionListener: ${connectionListener}"
                )
                connectionListener?.onDeviceReady(ML_BLE_CONNECTED_WITH_DEVICE_INFORMATION)
                firmwareVersion = deviceInformation.firmwareVersion
                val targetAudioName = deviceInformation.audioName
                bleInformationListener?.onDeviceInformationFound(deviceInformation)

                if (!audioConnected) {

                    targetAudioName.let { targetName ->

                        val connectedDevices = getA2DPConnectedDevice()
                        val connectedDeviceSize = connectedDevices.size
                        TNLog.d(
                            TAG,
                            "onDeviceInformation check again the bluetooth status  a2dp connectedDevices:${connectedDeviceSize}"
                        )
                        if (connectedDeviceSize > 0) {
                            for (cDevice in connectedDevices) {
                                val connectedAudioDeviceName = cDevice.name
                                TNLog.d(
                                    TAG,
                                    "onDeviceInformation on timeout double check again the bluetooth status  a2dp connectedAudioDeviceName:${connectedAudioDeviceName} targetName:$targetName send the callback audio connected "
                                )
                                if (connectedAudioDeviceName.equals(targetName)) {
                                    connectionListener?.onDeviceReady(ML_AUDIO_CONNECTED)
                                    break
                                }
                            }

                        } else {
                            connectionListener?.let { connectToMLAudioBle(it) }
                        }


                    }
                }

            }

            override fun onDeviceInformationError(error: Throwable) {

                TNLog.d(TAG, "onDeviceInformation onDeviceInformationError error :$error")

            }

        }
    }

    val sdkEegListener = object : EEGListener {
        fun jsonArrayStringToArrayOfFloatArray(jsonArrayString: String): Array<FloatArray> {
            val jsonArray = JSONArray(jsonArrayString)
            val array = Array(jsonArray.length()) { FloatArray(0) } // Initialize an empty array of FloatArray
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

        override fun onEEGStatusChange(isEnabled: Boolean) {
            TNLog.d(TAG, "onEEGStatusChange isEnabled:"+isEnabled)
            usingEegListener?.onEEGStatusChange(isEnabled)
        }

        override fun onEegError(error: Throwable) {
            TNLog.d(TAG, "onEegError error:"+error)
            usingEegListener?.onEegError(error)
        }

        override fun onEegPacket(mbtEEGPacket: MbtEEGPacket) {
            var processedPackage = mbtEEGPacket
            val shouldMockEeg = DataManager.shouldMockingEeg
            if (shouldMockEeg) {
                val newEEG1: MbtEEGPacket =
                    Gson().fromJson(SampleData.eegSample, MbtEEGPacket::class.java)
                val channelData = jsonArrayStringToArrayOfFloatArray(SampleData.channelData)
                for (i in 0..249) {
                    val selectedIndex = (0..7499).random()
                    newEEG1.channelsData[0][i] = channelData[0][selectedIndex]
                    val selectedIndex2 = (0..7499).random()
                    newEEG1.channelsData[1][i] = channelData[1][selectedIndex2]
                    val selectedIndex3 = (0..7499).random()
                    newEEG1.channelsData[2][i] = channelData[2][selectedIndex3]
                    val selectedIndex4 = (0..7499).random()
                    newEEG1.channelsData[3][i] = channelData[3][selectedIndex4]

                }
                processedPackage = newEEG1
            }

//            TNLog.d(TAG, "sdk eeg listener on eeg packages:" + usingEegListener)
            usingEegListener?.onEegPacket(processedPackage)
        }
    }
    var usingEegListener: EEGListener? = null
    //EEG streaming

    fun setEEGListener(listener: EEGListener) {

        usingEegListener = listener
        TNLog.d(TAG, "[EEG-Upload-Debug] setEEGListener listener:" + usingEegListener)

        mbtClient?.setEEGListener(sdkEegListener)
    }

    fun startStopEEG(listener: EEGListener) {

        TNLog.d(TAG, "startStopEEG listener:"+listener)

        if (mbtClient?.getBleConnectionStatus()?.isConnectionEstablished == true) {
            if (mbtClient?.isEEGEnabled() == false) {
                setEEGListener(listener)
                TNLog.d(TAG, "startStreaming...")
                mbtClient?.startStreaming(
                    StreamingParams.Builder()
                        .setEEG(true)
                        .setTriggerStatus(false)
                        .setAccelerometer(false)
                        .setQualityChecker(true)
                        .setEEGFilterConfig(filterMode)
                        .build()
                )
            } else {
                stopStreaming()
            }
        } else {

            TNLog.d(TAG, "could not startStreaming...")
        }

    }


    fun actionDisconnected() {
        TNLog.e(TAG, "actionDisconnecting from ble...")
        mbtClient?.disconnect()
    }

    fun actionAudioDisconnected() {
//        TNLog.e(TAG, "actionAudioDisconnected from a2dp with device:$mbtAudioDevice")
//        mbtAudioDevice?.let { mbtClient?.disconnectAudio(it) }
        mbtClient?.disconnectAudioViaBLE()
    }



    fun secureNaN(list: ArrayList<Float>): ArrayList<Float> {
        for (i in list.indices) {
            if (list[i].isNaN()) {
                list[i] = 0f
            }
        }
        return list
    }

    fun calibrate(eegPackets: List<MbtEEGPacket>): EEGCalibrateResult? {
        try {

            d(TAG, " calibrate with with list:${eegPackets}")
            val data = EEGRecordedDatas()
            data.eegPackets = eegPackets
            return mbtClient?.eegCalibration(data)
        } catch (ex: Exception) {
            ex.printStackTrace()
            return null
        }
    }

    fun startRelaxingIndexSession(calibrationResult: EEGCalibrateResult) {
        d(TAG, " startRelaxingIndexSession with calibrationResult:$calibrationResult")
        mbtClient?.eggStartRelaxingIndexSession(calibrationResult)
    }

    fun endRelaxingIndexSession(): RelaxIndexSessionOutputData? {
        d(TAG, " endRelaxingIndexSession ")
        return mbtClient?.eggEngRelaxingIndexSession()
    }

    fun computeRelaxIndex(eegPackets: List<MbtEEGPacket>): Float {
        val data = EEGRecordedDatas()
        val packageSize = eegPackets.size
        d(TAG, " computeRelaxIndex eegPackets packageSize:${packageSize}")
        if (packageSize > 0) {

            data.eegPackets = eegPackets
            return mbtClient?.eegRelaxingIndex(data) ?: -1f
        } else {
            return -1f
        }
    }


    fun computeStatistic(threshold: Float, snrValues: Array<Float>): HashMap<String, Float>? {
        return mbtClient?.computeStatistics(threshold, snrValues)
    }

    fun isLocationEnabled(context: Context): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    fun isDeviceConnected(): Boolean {
        val bleDeviceConnected =
            mbtClient?.getBleConnectionStatus()?.isConnectionEstablished == true
        d(
            TAG,
            " isDeviceConnected mbtBleDevice:$melomindBleDevice bleDeviceConnected:$bleDeviceConnected  audioConnected:$audioConnected "
        )
//            if (!isConnectedToAudioBluetooth) {
//                isConnectedToAudioBluetooth = audioManager?.isBluetoothA2dpOn() ?: false
//                if (isConnectedToAudioBluetooth) {
//                    audioConnected = true
//                }
//            }
//            d(TAG, " isDeviceConnected isConnectedToAudioBluetooth:$isConnectedToAudioBluetooth")
//            return (mbtDevice != null) && (audioConnected || isConnectedToAudioBluetooth)
        return (audioConnected) && bleDeviceConnected && melomindBleDevice!=null
    }


    fun resetBluetoothScanningState() {
        d(TAG, " resetBluetoothScanningState to false")
        isScanning = false
        mbtClient?.stopScan()
    }

    fun resetBluetooth() {
        d(TAG, " resetBluetooth called")
        actionDisconnected()
        resetBluetoothScanningState()
        stopAudioScan()
//        mbtDevice = null
        audioConnected = false
    }





}