import Foundation
import React
import Network

/**
 * LSL (Lab Streaming Layer) Module for React Native iOS
 * Handles real-time EEG data streaming via LSL protocol
 */
@objc(LSLModule)
class LSLModule: NSObject {
    
    private static let TAG = "LSLModule"
    private static let LSL_DEFAULT_PORT: UInt16 = 16571
    private static let LSL_HEADER_SIZE = 16
    private static let LSL_CHUNK_SIZE = 8
    
    private var executor: DispatchQueue?
    private var isStreaming = false
    private var activeOutlets: [String: LSLOutlet] = [:]
    
    private var lslConnection: NWConnection?
    private var lslOutputStream: OutputStream?
    
    /**
     * LSL Outlet class to manage individual data streams
     */
    private class LSLOutlet {
        let name: String
        let type: String
        let channelCount: Int
        let sampleRate: Double
        let dataFormat: String
        
        private var outletId: String = ""
        private var isActive = false
        private var buffer: [[Double]] = []
        
        init(name: String, type: String, channelCount: Int, sampleRate: Double, dataFormat: String) {
            self.name = name
            self.type = type
            self.channelCount = channelCount
            self.sampleRate = sampleRate
            self.dataFormat = dataFormat
        }
        
        func start() -> Bool {
            do {
                // Create LSL outlet info
                let outletInfo = createOutletInfo()
                outletId = "\(name)_\(Int(Date().timeIntervalSince1970 * 1000))"
                isActive = true
                
                print("\(LSLModule.TAG): LSL Outlet started: \(name) (ID: \(outletId))")
                return true
            } catch {
                print("\(LSLModule.TAG): Failed to start LSL outlet: \(name), error: \(error)")
                return false
            }
        }
        
        func stop() {
            isActive = false
            buffer.removeAll()
            print("\(LSLModule.TAG): LSL Outlet stopped: \(name)")
        }
        
        func pushSample(sample: [Double]) {
            if isActive && sample.count == channelCount {
                buffer.append(sample)
                
                // Send data in chunks to avoid blocking
                if buffer.count >= LSL_CHUNK_SIZE {
                    sendChunk()
                }
            }
        }
        
        private func sendChunk() {
            if buffer.isEmpty { return }
            
            do {
                let chunk = buffer
                buffer.removeAll()
                
                // Send chunk data via LSL protocol
                sendLSLChunk(chunk)
                
            } catch {
                print("\(LSLModule.TAG): Failed to send LSL chunk for outlet: \(name), error: \(error)")
            }
        }
        
        private func createOutletInfo() -> String {
            return """
            {
                "name": "\(name)",
                "type": "\(type)",
                "channel_count": \(channelCount),
                "sample_rate": \(sampleRate),
                "data_format": "\(dataFormat)",
                "source_id": "\(outletId)"
            }
            """
        }
        
        private func sendLSLChunk(_ chunk: [[Double]]) {
            // Implementation for sending LSL chunk data
            // This would involve creating the proper LSL protocol headers and data
            print("\(LSLModule.TAG): Sending LSL chunk for outlet: \(name), samples: \(chunk.count)")
        }
    }
    
    /**
     * Initialize LSL server connection
     */
    @objc(initializeLSL:port:withResolver:withRejecter:)
    func initializeLSL(serverAddress: String, port: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let address = serverAddress.isEmpty ? "localhost" : serverAddress
        let serverPort = port <= 0 ? Int(LSLModule.LSL_DEFAULT_PORT) : port
        
        print("\(LSLModule.TAG): Initializing LSL connection to \(address):\(serverPort)")
        
        // Create network connection to LSL server
        let endpoint = NWEndpoint.hostPort(host: NWEndpoint.Host(address), port: NWEndpoint.Port(integerLiteral: UInt16(serverPort)))
        lslConnection = NWConnection(to: endpoint, using: .tcp)
        
        lslConnection?.stateUpdateHandler = { [weak self] state in
            switch state {
            case .ready:
                print("\(LSLModule.TAG): LSL connection established successfully")
                resolve(true)
            case .failed(let error):
                print("\(LSLModule.TAG): LSL connection failed: \(error)")
                reject("LSL_INIT_ERROR", "Failed to connect to LSL server: \(error)", error)
            case .cancelled:
                print("\(LSLModule.TAG): LSL connection cancelled")
                reject("LSL_INIT_ERROR", "LSL connection was cancelled", nil)
            default:
                break
            }
        }
        
        lslConnection?.start(queue: .global())
        
        // Send initialization handshake
        sendLSLHandshake()
    }
    
    /**
     * Create a new LSL outlet for streaming data
     */
    @objc(createOutlet:type:channelCount:sampleRate:dataFormat:withResolver:withRejecter:)
    func createOutlet(name: String, type: String, channelCount: Int, sampleRate: Double, dataFormat: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        if name.isEmpty {
            reject("INVALID_NAME", "Outlet name cannot be empty", nil)
            return
        }
        
        if activeOutlets[name] != nil {
            reject("OUTLET_EXISTS", "Outlet with name '\(name)' already exists", nil)
            return
        }
        
        let outlet = LSLOutlet(name: name, type: type, channelCount: channelCount, sampleRate: sampleRate, dataFormat: dataFormat)
        if outlet.start() {
            activeOutlets[name] = outlet
            resolve(name)
            print("\(LSLModule.TAG): LSL outlet created: \(name)")
        } else {
            reject("OUTLET_CREATE_ERROR", "Failed to create LSL outlet: \(name)", nil)
        }
    }
    
    /**
     * Push EEG sample data to LSL outlet
     */
    @objc(pushSample:sample:withResolver:withRejecter:)
    func pushSample(outletName: String, sample: [Double], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let outlet = activeOutlets[outletName] else {
            reject("OUTLET_NOT_FOUND", "LSL outlet '\(outletName)' not found", nil)
            return
        }
        
        outlet.pushSample(sample: sample)
        resolve(true)
    }
    
    /**
     * Start streaming EEG data to LSL
     */
    @objc(startStreaming:withRejecter:)
    func startStreaming(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        if isStreaming {
            resolve(true) // Already streaming
            return
        }
        
        isStreaming = true
        
        // Start periodic data transmission
        executor = DispatchQueue(label: "LSLStreamingQueue")
        executor?.async { [weak self] in
            while self?.isStreaming == true {
                self?.flushAllOutlets()
                Thread.sleep(forTimeInterval: 0.1) // 10Hz flush rate
            }
        }
        
        resolve(true)
        print("\(LSLModule.TAG): LSL streaming started")
    }
    
    /**
     * Stop streaming EEG data to LSL
     */
    @objc(stopStreaming:withRejecter:)
    func stopStreaming(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        isStreaming = false
        
        // Flush remaining data
        flushAllOutlets()
        
        resolve(true)
        print("\(LSLModule.TAG): LSL streaming stopped")
    }
    
    /**
     * Remove an LSL outlet
     */
    @objc(removeOutlet:withResolver:withRejecter:)
    func removeOutlet(outletName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let outlet = activeOutlets.removeValue(forKey: outletName) else {
            reject("OUTLET_NOT_FOUND", "Outlet '\(outletName)' not found", nil)
            return
        }
        
        outlet.stop()
        resolve(true)
        print("\(LSLModule.TAG): LSL outlet removed: \(outletName)")
    }
    
    /**
     * Get list of active LSL outlets
     */
    @objc(getActiveOutlets:withRejecter:)
    func getActiveOutlets(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let outlets = Array(activeOutlets.keys)
        resolve(outlets)
    }
    
    /**
     * Close LSL connection and cleanup
     */
    @objc(closeLSL:withRejecter:)
    func closeLSL(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Stop streaming
        isStreaming = false
        
        // Close all outlets
        activeOutlets.values.forEach { $0.stop() }
        activeOutlets.removeAll()
        
        // Close network connection
        lslConnection?.cancel()
        lslConnection = nil
        
        resolve(true)
        print("\(LSLModule.TAG): LSL connection closed")
    }
    
    /**
     * Send LSL handshake message
     */
    private func sendLSLHandshake() {
        let handshake = """
        {
            "type": "handshake",
            "version": "1.0",
            "protocol": "lsl",
            "timestamp": \(Int(Date().timeIntervalSince1970 * 1000))
        }
        """
        
        sendLSLMessage(handshake)
    }
    
    /**
     * Send LSL message
     */
    private func sendLSLMessage(_ message: String) {
        guard let data = message.data(using: .utf8) else { return }
        
        lslConnection?.send(content: data, completion: .contentProcessed { error in
            if let error = error {
                print("\(LSLModule.TAG): Failed to send LSL message: \(error)")
            }
        })
    }
    
    /**
     * Flush all active outlets
     */
    private func flushAllOutlets() {
        activeOutlets.values.forEach { outlet in
            // Force flush any remaining data
            outlet.pushSample(sample: Array(repeating: 0.0, count: outlet.channelCount))
        }
    }
}

@objc(LSLModule)
extension LSLModule: RCTBridgeModule {
    static func moduleName() -> String! {
        return "LSLModule"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
} 