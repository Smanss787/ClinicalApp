package com.cyrebroplugin.model

import com.mybraintech.sdk.core.model.DeviceInformation

// Model class to hold DeviceInformation and batteryLevel
class DeviceStatus(
    val deviceInformation: DeviceInformation,
    val batteryLevel: Float
)

