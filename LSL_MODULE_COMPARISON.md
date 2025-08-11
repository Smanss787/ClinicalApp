# LSL Module Implementation Comparison: Android vs iOS

This document compares the LSL (Lab Streaming Layer) module implementations for Android and iOS platforms.

## Overview

Both implementations provide the same core functionality for real-time EEG data streaming via the LSL protocol, but are written in their respective platform languages and frameworks.

## File Structure

### Android Implementation
```
android/cyrebro_sdk/src/main/java/com/cyrebroplugin/
├── LSLModule.kt          # Main React Native module
├── LSL.java              # LSL library wrapper
└── CyrebroModule.kt      # Other Cyrebro functionality
```

### iOS Implementation
```
ios/cyrebro_sdk/module/
├── LSLModule.swift       # Main React Native module
├── LSL.swift             # LSL library implementation
├── LSLModule.m           # Objective-C bridge
├── LSLModulePackage.swift # Module registration
├── cyrebro_sdk.podspec   # CocoaPods specification
├── cyrebro_sdk-Bridging-Header.h # Swift/Obj-C bridge
└── module.modulemap      # Module map
```

## Core Features Comparison

| Feature | Android | iOS |
|---------|---------|-----|
| **Language** | Kotlin | Swift |
| **Framework** | React Native | React Native |
| **Network** | Java Socket API | Network Framework |
| **Threading** | ExecutorService | DispatchQueue |
| **Memory Management** | Garbage Collection | ARC |
| **Error Handling** | Exception handling | Error protocol |

## API Methods

Both implementations expose identical React Native APIs:

### Core Methods
- `initializeLSL(serverAddress, port)` - Initialize LSL connection
- `createOutlet(name, type, channelCount, sampleRate, dataFormat)` - Create data stream outlet
- `pushSample(outletName, sample)` - Push EEG sample data
- `startStreaming()` - Start data streaming
- `stopStreaming()` - Stop data streaming
- `removeOutlet(outletName)` - Remove outlet
- `getActiveOutlets()` - List active outlets
- `closeLSL()` - Cleanup and close connection

## Implementation Details

### Android (Kotlin)

**Key Components:**
- Uses JNA (Java Native Access) for LSL library integration
- Implements custom LSL protocol over TCP sockets
- Uses `ConcurrentHashMap` for thread-safe outlet management
- Employs `ScheduledExecutorService` for periodic data transmission

**Network Implementation:**
```kotlin
// Socket-based implementation
lslServerSocket = Socket(InetAddress.getByName(address), serverPort)
lslOutputStream = DataOutputStream(lslServerSocket!!.getOutputStream())
```

**Threading:**
```kotlin
private val executor: ScheduledExecutorService = Executors.newScheduledThreadPool(2)
executor.scheduleAtFixedRate({ flushAllOutlets() }, 0, 100, TimeUnit.MILLISECONDS)
```

### iOS (Swift)

**Key Components:**
- Uses Network Framework for modern networking
- Implements LSL protocol with Swift's data handling
- Uses Swift dictionaries and arrays for outlet management
- Employs `Timer` for periodic data transmission

**Network Implementation:**
```swift
// Network Framework implementation
let endpoint = NWEndpoint.hostPort(host: NWEndpoint.Host("localhost"), port: NWEndpoint.Port(integerLiteral: 16571))
connection = NWConnection(to: endpoint, using: .tcp)
```

**Threading:**
```swift
private let queue = DispatchQueue(label: "lsl.outlet", qos: .userInitiated)
streamingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
    self?.flushAllOutlets()
}
```

## Data Handling

### Android
```kotlin
// ByteBuffer for binary data
val header = ByteBuffer.allocate(LSL_HEADER_SIZE).order(ByteOrder.LITTLE_ENDIAN)
header.putInt(chunkSize)
header.putInt(channelCount)
header.putLong(System.currentTimeMillis())
```

### iOS
```swift
// Data struct for binary data
var header = Data()
header.append(contentsOf: withUnsafeBytes(of: chunkSize.littleEndian) { Data($0) })
header.append(contentsOf: withUnsafeBytes(of: channelCount.littleEndian) { Data($0) })
header.append(contentsOf: withUnsafeBytes(of: Int64(Date().timeIntervalSince1970 * 1000).littleEndian) { Data($0) })
```

## Error Handling

### Android
```kotlin
try {
    // Operation
    promise.resolve(result)
} catch (e: Exception) {
    Log.e(TAG, "Error message", e)
    promise.reject("ERROR_CODE", "Error description", e)
}
```

### iOS
```swift
do {
    // Operation
    resolver(result)
} catch {
    print("\(TAG): Error message, error: \(error)")
    rejecter("ERROR_CODE", "Error description", error)
}
```

## Memory Management

### Android
- Automatic garbage collection
- Manual cleanup in `onCatalystInstanceDestroy()`
- Weak references for callbacks

### iOS
- Automatic Reference Counting (ARC)
- Manual cleanup in `deinit`
- Weak references with `[weak self]`

## Performance Characteristics

| Aspect | Android | iOS |
|--------|---------|-----|
| **Memory Usage** | Higher (GC overhead) | Lower (ARC) |
| **CPU Usage** | Moderate | Lower |
| **Network Latency** | Similar | Similar |
| **Battery Impact** | Higher | Lower |

## Build Integration

### Android
- Integrated into existing Android project
- Uses Gradle build system
- Native library dependencies via JNA

### iOS
- CocoaPods integration
- Swift module with bridging header
- Network Framework (built-in)

## Testing

Both implementations include comprehensive test suites:

### Android
- JUnit tests for LSLModule
- Integration tests for network functionality
- Mock testing for LSL library

### iOS
- XCTest framework
- Unit tests for all public methods
- Integration tests for network functionality

## Deployment

### Android
- Bundled with APK
- No additional dependencies required
- Works on Android 5.0+

### iOS
- Bundled with app bundle
- Network Framework included in iOS 13.0+
- Requires iOS 13.0+

## Conclusion

Both implementations provide feature parity with the same React Native API surface. The iOS implementation leverages modern Swift features and the Network Framework for better performance and reliability, while the Android implementation uses proven Java networking APIs with JNA for LSL library integration.

The choice between platforms should be based on:
- **Performance requirements** (iOS generally better)
- **Development team expertise** (Kotlin vs Swift)
- **Target platform constraints** (Android 5.0+ vs iOS 13.0+)
- **Integration complexity** (Android simpler, iOS more modern)

Both implementations are production-ready and provide the same LSL functionality for real-time EEG data streaming. 