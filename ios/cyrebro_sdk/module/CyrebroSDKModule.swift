//
//  CyrebroSDKModule.swift
//  clinicalApp
//
//  Created by Ngo Thanh Tuan on 7/4/25.
//

import Foundation
import React

@objc(CyrebroModule)
class CyrebroModule: NSObject {
    
    @objc(innitSDK:withRejecter:)
    func innitSDK(headserId: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual SDK initialization logic here
        print("Cyrebro.SDK: innitSDK called headserId: \(headserId) (iOS)")
        resolve("SDK initialized successfully (iOS)")
    }
    
    @objc(scanDevice:withRejecter:)
    func scanDevice(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual BLE scan logic here
        print("Cyrebro.SDK: scanDevice called (iOS)")
        resolve("BLE scan started (iOS)")
    }
    
    @objc(isBluetoothEnabled:withRejecter:)
    func isBluetoothEnabled(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual Bluetooth status check logic here
        print("Cyrebro.SDK: isBluetoothEnabled called (iOS)")
        resolve("true")
    }
    
    @objc(startEEGRecording:withRejecter:)
    func startEEGRecording(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual EEG recording start logic here
        print("Cyrebro.SDK: startEEGRecording called (iOS)")
        resolve("true")
    }
    
    @objc(stopEEGRecording:withRejecter:)
    func stopEEGRecording(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual EEG recording stop logic here
        print("Cyrebro.SDK: stopEEGRecording called (iOS)")
        resolve("true")
    }
    
    @objc(isLocationEnabled:withRejecter:)
    func isLocationEnabled(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual location status check logic here
        print("Cyrebro.SDK: isLocationEnabled called (iOS)")
        resolve("true")
    }
    
    @objc(stopScanDevice:withRejecter:)
    func stopScanDevice(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual BLE scan stop logic here
        print("Cyrebro.SDK: stopScanDevice called (iOS)")
        resolve("BLE scan stopped (iOS)")
    }
    
    @objc(connectBLEDevice:withResolver:withRejecter:)
    func connectBLEDevice(deviceName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual BLE connection logic here
        print("Cyrebro.SDK: connectBLEDevice called with deviceName: \(deviceName) (iOS)")
        resolve("BLE device \(deviceName) connected (iOS)")
    }
    
    @objc(disconnectBLEDevice:withResolver:withRejecter:)
    func disconnectBLEDevice(deviceId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual BLE disconnection logic here
        print("Cyrebro.SDK: disconnectBLEDevice called with deviceId: \(deviceId) (iOS)")
        resolve("BLE device \(deviceId) disconnected (iOS)")
    }
    
    @objc(connectAudioDevice:withResolver:withRejecter:)
    func connectAudioDevice(deviceId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual audio device connection logic here
        print("Cyrebro.SDK: connectAudioDevice called with deviceId: \(deviceId) (iOS)")
        resolve("Audio device \(deviceId) connected (iOS)")
    }
    
    @objc(disconnectAudioDevice:withResolver:withRejecter:)
    func disconnectAudioDevice(deviceId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO: Add actual audio device disconnection logic here
        print("Cyrebro.SDK: disconnectAudioDevice called with deviceId: \(deviceId) (iOS)")
        resolve("Audio device \(deviceId) disconnected (iOS)")
    }
    
    // Helper method to send events to JS (equivalent to Android's sendEvent)
    private func sendEvent(eventName: String, params: [String: Any]) {
        print("Cyrebro.SDK: eventName: \(eventName) params: \(params) (iOS)")
        // TODO: Implement event emission to React Native
        // This would typically use RCTEventEmitter or similar mechanism
    }
}

@objc(CyrebroModule)
extension CyrebroModule: RCTBridgeModule {
    static func moduleName() -> String! {
        return "CyrebroSDK"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
