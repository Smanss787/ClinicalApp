package com.cyrebroplugin

import com.mybraintech.sdk.core.model.DeviceInformation

interface BLEInformationListener {
    fun onDeviceInformationFound(information: DeviceInformation)
}