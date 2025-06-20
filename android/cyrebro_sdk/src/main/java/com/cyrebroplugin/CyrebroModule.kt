package com.cyrebroplugin

import android.util.Log
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.mybraintech.sdk.MbtClient
import com.mybraintech.sdk.MbtClientManager
import com.mybraintech.sdk.core.model.EnumMBTDevice

class CyrebroModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    companion object {
        private const val TAG = "CyrebroModule"
    }


    private var buildInfo: String = ""
    var mbtClient: MbtClient? = null
    @ReactMethod
    fun innitSDK(promise: Promise) {
        try {
            Log.d("Cyrebro.SDK", "SDK innitSDK called")
            if (mbtClient == null) {
                mbtClient = MbtClientManager.getMbtClient(reactContext, EnumMBTDevice.Q_PLUS)
               Log.d(TAG, "[setupMbtSdk] mbtClient:${mbtClient}")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Log.d("Cyrebro.SDK", "Exception e:" + e.message)
            promise.reject(e)
        }
    }
    fun setBuildInfo(buildInfo: String) {
        this.buildInfo = buildInfo
    }

    override fun getName(): String {

        return "CyrebroSDK"
    }

    override fun onHostResume() {
        Log.d("Cyrebro.SDK", "onHostResume ")
    }

    override fun onHostPause() {
      Log.d("Cyrebro.SDK", "onHostPause ")
    }

    override fun onHostDestroy() {
        Log.d("Cyrebro.SDK", "onHostDestroy ")
    }

    // ...implement other methods and logic as in the Java version...
}

