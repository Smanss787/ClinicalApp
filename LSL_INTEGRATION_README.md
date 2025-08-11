# LSL (Lab Streaming Layer) Integration

This document describes the LSL integration for the React Native Clinical App, which enables real-time EEG data streaming to external applications and research tools.

## Overview

The LSL integration allows the Clinical App to stream EEG data, quality indicators, and event markers to any LSL-compatible application. This is particularly useful for:

- **Research applications** - Stream data to analysis tools like MATLAB, Python, or specialized BCI software
- **Multi-device synchronization** - Combine EEG data with other sensors (eye tracking, motion capture, etc.)
- **Real-time processing** - Send data to real-time analysis pipelines
- **Data recording** - Stream to recording applications for offline analysis

## Architecture

### Components

1. **LSLModule (Android Native)** - Core LSL functionality implemented in Kotlin
2. **LSLService (TypeScript)** - High-level service for managing LSL connections and data streaming
3. **HeadsetConnectScreen** - UI integration for LSL configuration and control
4. **LSL Test Server** - Python server for testing and debugging

### Data Streams

The app creates three LSL outlets:

1. **EEG_Data** - Raw EEG channel data (2-4 channels depending on headset)
2. **EEG_Quality** - Signal quality indicators for each channel
3. **EEG_Events** - Event markers (session start/end, user interactions)

## Setup Instructions

### 1. Build the App

```bash
# Install dependencies
npm install

# For Android
npm run android

# For iOS
npm run ios
```

### 2. Start LSL Test Server (Optional)

For testing and debugging, you can use the included Python test server:

```bash
# Make sure you have Python 3.6+ installed
python3 lsl_test_server.py
```

The server will start on `localhost:16571` and display received data.

### 3. Configure LSL in the App

1. Open the Clinical App
2. Navigate to a headset connection screen
3. Connect to your EEG device
4. Enable LSL streaming in the LSL section
5. Configure server address and port
6. Connect to LSL server
7. Create LSL outlets
8. Start streaming

## Usage

### Basic LSL Streaming

1. **Enable LSL**: Toggle "Enable LSL Streaming" in the LSL section
2. **Configure Server**: Set server address (default: localhost) and port (default: 16571)
3. **Connect**: Tap "Connect to LSL" to establish connection
4. **Create Outlets**: Tap "Create LSL Outlets" to set up data streams
5. **Start Streaming**: Tap "Start LSL Streaming" to begin data transmission
6. **Start EEG**: Start EEG recording to begin streaming data

### Event Markers

While streaming, you can push event markers:

- **Session Start** - Marks the beginning of a recording session
- **Session End** - Marks the end of a recording session

### Advanced Configuration

#### Custom LSL Server

You can connect to any LSL-compatible server by changing the server address and port in the app.

#### Multiple Outlets

The app automatically creates three outlets:
- EEG data (250Hz sample rate)
- Quality indicators (10Hz sample rate)  
- Event markers (irregular rate)

#### Data Format

- **EEG Data**: Float32 values for each channel
- **Quality Data**: Float32 values (0-1) for signal quality
- **Event Data**: String-encoded JSON events

## API Reference

### LSLService

```typescript
// Initialize LSL connection
await lslService.initialize({
  serverAddress: 'localhost',
  port: 16571
});

// Create EEG outlet
await lslService.createEEGOutlet(channelCount, sampleRate);

// Start streaming
await lslService.startStreaming();

// Push EEG sample
await lslService.pushEEGSample({
  timestamp: Date.now(),
  channels: [value1, value2, ...],
  qualities: [quality1, quality2, ...]
});

// Push event
await lslService.pushEvent('session_start', { data: 'value' });

// Stop streaming
await lslService.stopStreaming();

// Close connection
await lslService.close();
```

### LSLModule (Native)

```kotlin
// Initialize connection
LSLModule.initializeLSL(serverAddress, port)

// Create outlet
LSLModule.createOutlet(name, type, channelCount, sampleRate, dataFormat)

// Push sample
LSLModule.pushSample(outletName, sampleArray)

// Start/stop streaming
LSLModule.startStreaming()
LSLModule.stopStreaming()
```

## Integration with External Tools

### MATLAB

```matlab
% Connect to LSL stream
lib = lsl_loadlib();
inlet = lsl_inlet(lib, 'name', 'EEG_Data');

% Read data
[data, timestamp] = inlet.pull_sample();
```

### Python

```python
import pylsl

# Find EEG stream
streams = pylsl.resolve_stream('name', 'EEG_Data')
inlet = pylsl.StreamInlet(streams[0])

# Read data
sample, timestamp = inlet.pull_sample()
```

### LabRecorder

Use LabRecorder to record LSL streams for offline analysis:

1. Start LabRecorder
2. Select the EEG_Data, EEG_Quality, and EEG_Events streams
3. Start recording
4. Begin streaming from the Clinical App

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if LSL server is running
   - Verify server address and port
   - Check network connectivity

2. **No Data Received**
   - Ensure EEG recording is started
   - Check if LSL streaming is enabled
   - Verify outlets are created

3. **Performance Issues**
   - Reduce sample rate if needed
   - Check network bandwidth
   - Monitor device performance

### Debug Information

Enable debug logging in the app to see detailed LSL information:

```typescript
// In the app, check console logs for:
// - LSL connection status
// - Outlet creation messages
// - Data transmission logs
// - Error messages
```

### Testing

Use the included test server to verify LSL functionality:

```bash
python3 lsl_test_server.py
```

The server will display:
- Connection status
- Received data chunks
- Sample counts
- Error messages

## Security Considerations

- LSL connections are unencrypted by default
- Use VPN or secure network for sensitive data
- Consider implementing authentication for production use
- Monitor network traffic for data leaks

## Performance Optimization

- **Sample Rate**: Adjust based on application needs (250Hz default)
- **Chunk Size**: Optimize for your use case (8 samples default)
- **Network**: Use local network for best performance
- **Device**: Ensure sufficient processing power

## Future Enhancements

- **Encryption**: Add SSL/TLS support for secure streaming
- **Compression**: Implement data compression for bandwidth optimization
- **Multiple Streams**: Support for additional data types
- **Web Interface**: Web-based LSL server for remote access
- **Recording**: Built-in LSL recording functionality

## Support

For issues or questions about the LSL integration:

1. Check the troubleshooting section
2. Review console logs for error messages
3. Test with the included test server
4. Verify LSL server compatibility

## References

- [Lab Streaming Layer Documentation](https://labstreaminglayer.org/)
- [LSL Python Library](https://github.com/labstreaminglayer/liblsl-Python)
- [LSL MATLAB Library](https://github.com/labstreaminglayer/liblsl-Matlab)
- [LSL C++ Library](https://github.com/labstreaminglayer/liblsl) 