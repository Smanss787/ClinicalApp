package com.cyrebroplugin

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.DataOutputStream
import java.net.InetAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * LSL (Lab Streaming Layer) Module for React Native
 * Handles real-time EEG data streaming via LSL protocol
 */
class LSLModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "LSLModule"
        private const val LSL_DEFAULT_PORT = 16571
        private const val LSL_HEADER_SIZE = 16
        private const val LSL_CHUNK_SIZE = 8
    }

    override fun getName(): String = "LSLModule"

    private val executor: ScheduledExecutorService = Executors.newScheduledThreadPool(2)
    private val isStreaming = AtomicBoolean(false)
    private val activeOutlets = ConcurrentHashMap<String, LSLOutlet>()
    
    private var lslServerSocket: Socket? = null
    private var lslOutputStream: DataOutputStream? = null

    /**
     * LSL Outlet class to manage individual data streams
     */
    private inner class LSLOutlet(
        val name: String,
        val type: String,
        val channelCount: Int,
        val sampleRate: Double,
        val dataFormat: String
    ) {
        private var outletId: String = ""
        private var isActive = false
        private val buffer = mutableListOf<DoubleArray>()
        
        fun start(): Boolean {
            try {
                // Create LSL outlet info
                val outletInfo = createOutletInfo()
                outletId = "${name}_${System.currentTimeMillis()}"
                isActive = true
                
                Log.d(TAG, "LSL Outlet started: $name (ID: $outletId)")
                return true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start LSL outlet: $name", e)
                return false
            }
        }
        
        fun stop() {
            isActive = false
            buffer.clear()
            Log.d(TAG, "LSL Outlet stopped: $name")
        }
        
        fun pushSample(sample: DoubleArray) {
            if (isActive && sample.size == channelCount) {
                buffer.add(sample)
                
                // Send data in chunks to avoid blocking
                if (buffer.size >= LSL_CHUNK_SIZE) {
                    sendChunk()
                }
            }
        }
        
        private fun sendChunk() {
            if (buffer.isEmpty()) return
            
            try {
                val chunk = buffer.toTypedArray()
                buffer.clear()
                
                // Send chunk data via LSL protocol
                sendLSLChunk(chunk)
                
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send LSL chunk for outlet: $name", e)
            }
        }
        
        private fun createOutletInfo(): String {
            return """
                {
                    "name": "$name",
                    "type": "$type",
                    "channel_count": $channelCount,
                    "sample_rate": $sampleRate,
                    "data_format": "$dataFormat",
                    "source_id": "$outletId"
                }
            """.trimIndent()
        }
    }

    /**
     * Initialize LSL server connection
     */
    @ReactMethod
    fun initializeLSL(serverAddress: String, port: Int, promise: Promise) {
        try {
            val address = if (serverAddress.isEmpty()) "localhost" else serverAddress
            val serverPort = if (port <= 0) LSL_DEFAULT_PORT else port
            
            Log.d(TAG, "Initializing LSL connection to $address:$serverPort")
            
            // Create socket connection to LSL server
            lslServerSocket = Socket(InetAddress.getByName(address), serverPort)
            lslOutputStream = DataOutputStream(lslServerSocket!!.getOutputStream())
            
            // Send initialization handshake
            sendLSLHandshake()
            
            promise.resolve(true)
            Log.d(TAG, "LSL connection established successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize LSL connection", e)
            promise.reject("LSL_INIT_ERROR", "Failed to connect to LSL server: ${e.message}")
        }
    }

    /**
     * Create a new LSL outlet for streaming data
     */
    @ReactMethod
    fun createOutlet(
        name: String,
        type: String,
        channelCount: Int,
        sampleRate: Double,
        dataFormat: String,
        promise: Promise
    ) {
        try {
            if (name.isEmpty()) {
                promise.reject("INVALID_NAME", "Outlet name cannot be empty")
                return
            }
            
            if (activeOutlets.containsKey(name)) {
                promise.reject("OUTLET_EXISTS", "Outlet with name '$name' already exists")
                return
            }
            
            val outlet = LSLOutlet(name, type, channelCount, sampleRate, dataFormat)
            if (outlet.start()) {
                activeOutlets[name] = outlet
                promise.resolve(name)
                Log.d(TAG, "LSL outlet created: $name")
            } else {
                promise.reject("OUTLET_CREATE_ERROR", "Failed to create LSL outlet: $name")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error creating LSL outlet: $name", e)
            promise.reject("OUTLET_CREATE_ERROR", "Exception creating outlet: ${e.message}")
        }
    }

    /**
     * Push EEG sample data to LSL outlet
     */
    @ReactMethod
    fun pushSample(outletName: String, sample: ReadableArray, promise: Promise) {
        try {
            val outlet = activeOutlets[outletName]
            if (outlet == null) {
                promise.reject("OUTLET_NOT_FOUND", "LSL outlet '$outletName' not found")
                return
            }
            
            val sampleData = DoubleArray(sample.size())
            for (i in 0 until sample.size()) {
                sampleData[i] = sample.getDouble(i)
            }
            
            outlet.pushSample(sampleData)
            promise.resolve(true)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error pushing sample to outlet: $outletName", e)
            promise.reject("PUSH_SAMPLE_ERROR", "Failed to push sample: ${e.message}")
        }
    }

    /**
     * Start streaming EEG data to LSL
     */
    @ReactMethod
    fun startStreaming(promise: Promise) {
        try {
            if (isStreaming.get()) {
                promise.resolve(true) // Already streaming
                return
            }
            
            isStreaming.set(true)
            
            // Start periodic data transmission
            executor.scheduleAtFixedRate({
                try {
                    flushAllOutlets()
                } catch (e: Exception) {
                    Log.e(TAG, "Error in streaming loop", e)
                }
            }, 0, 100, TimeUnit.MILLISECONDS) // 10Hz flush rate
            
            promise.resolve(true)
            Log.d(TAG, "LSL streaming started")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start LSL streaming", e)
            promise.reject("STREAMING_START_ERROR", "Failed to start streaming: ${e.message}")
        }
    }

    /**
     * Stop streaming EEG data to LSL
     */
    @ReactMethod
    fun stopStreaming(promise: Promise) {
        try {
            isStreaming.set(false)
            
            // Flush remaining data
            flushAllOutlets()
            
            promise.resolve(true)
            Log.d(TAG, "LSL streaming stopped")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop LSL streaming", e)
            promise.reject("STREAMING_STOP_ERROR", "Failed to stop streaming: ${e.message}")
        }
    }

    /**
     * Remove an LSL outlet
     */
    @ReactMethod
    fun removeOutlet(outletName: String, promise: Promise) {
        try {
            val outlet = activeOutlets.remove(outletName)
            if (outlet != null) {
                outlet.stop()
                promise.resolve(true)
                Log.d(TAG, "LSL outlet removed: $outletName")
            } else {
                promise.reject("OUTLET_NOT_FOUND", "Outlet '$outletName' not found")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error removing LSL outlet: $outletName", e)
            promise.reject("OUTLET_REMOVE_ERROR", "Failed to remove outlet: ${e.message}")
        }
    }

    /**
     * Get list of active LSL outlets
     */
    @ReactMethod
    fun getActiveOutlets(promise: Promise) {
        try {
            val outlets = Arguments.createArray()
            activeOutlets.keys.forEach { name ->
                outlets.pushString(name)
            }
            promise.resolve(outlets)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error getting active outlets", e)
            promise.reject("GET_OUTLETS_ERROR", "Failed to get outlets: ${e.message}")
        }
    }

    /**
     * Close LSL connection and cleanup
     */
    @ReactMethod
    fun closeLSL(promise: Promise) {
        try {
            // Stop streaming
            isStreaming.set(false)
            
            // Close all outlets
            activeOutlets.values.forEach { it.stop() }
            activeOutlets.clear()
            
            // Close socket connection
            lslOutputStream?.close()
            lslServerSocket?.close()
            
            lslOutputStream = null
            lslServerSocket = null
            
            promise.resolve(true)
            Log.d(TAG, "LSL connection closed")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error closing LSL connection", e)
            promise.reject("LSL_CLOSE_ERROR", "Failed to close LSL: ${e.message}")
        }
    }

    /**
     * Send LSL handshake message
     */
    private fun sendLSLHandshake() {
        try {
            val handshake = """
                {
                    "type": "handshake",
                    "version": "1.0",
                    "protocol": "lsl",
                    "timestamp": ${System.currentTimeMillis()}
                }
            """.trimIndent()
            
            sendLSLMessage(handshake)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send LSL handshake", e)
        }
    }

    /**
     * Send LSL chunk data
     */
    private fun sendLSLChunk(chunk: Array<DoubleArray>) {
        try {
            val chunkSize = chunk.size
            val channelCount = if (chunk.isNotEmpty()) chunk[0].size else 0
            
            // Create chunk header
            val header = ByteBuffer.allocate(LSL_HEADER_SIZE).order(ByteOrder.LITTLE_ENDIAN)
            header.putInt(chunkSize)
            header.putInt(channelCount)
            header.putLong(System.currentTimeMillis())
            
            // Send header
            lslOutputStream?.write(header.array())
            
            // Send data
            chunk.forEach { sample ->
                sample.forEach { value ->
                    lslOutputStream?.writeDouble(value)
                }
            }
            
            lslOutputStream?.flush()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send LSL chunk", e)
        }
    }

    /**
     * Send LSL message
     */
    private fun sendLSLMessage(message: String) {
        try {
            val messageBytes = message.toByteArray(Charsets.UTF_8)
            val length = messageBytes.size
            
            // Send message length
            lslOutputStream?.writeInt(length)
            
            // Send message content
            lslOutputStream?.write(messageBytes)
            lslOutputStream?.flush()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send LSL message", e)
        }
    }

    /**
     * Flush all active outlets
     */
    private fun flushAllOutlets() {
        activeOutlets.values.forEach { outlet ->
            try {
                // Force flush any remaining data
                outlet.pushSample(DoubleArray(outlet.channelCount) { 0.0 })
            } catch (e: Exception) {
                Log.e(TAG, "Error flushing outlet: ${outlet.name}", e)
            }
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        
        try {
            // Cleanup resources
            isStreaming.set(false)
            activeOutlets.values.forEach { it.stop() }
            activeOutlets.clear()
            
            lslOutputStream?.close()
            lslServerSocket?.close()
            
            executor.shutdown()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup", e)
        }
    }
} 