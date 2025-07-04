import Foundation
import React

@objc(CyrebroModule)
class CyrebroModule: NSObject {
  @objc(innitSDK:withRejecter:)
  func innitSDK(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // TODO: Add actual SDK initialization logic here
    print("Cyrebro.SDK: innitSDK called (iOS)")
    resolve("SDK initialized successfully (iOS)")
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
