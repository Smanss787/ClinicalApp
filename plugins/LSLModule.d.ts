import { NativeModules } from 'react-native';

interface LSLModuleType {
  // MARK: - LSL Connection Management
  /**
   * Initialize LSL server connection
   * @param serverAddress - LSL server address (default: "localhost")
   * @param port - LSL server port (default: 16571)
   */
  initializeLSL(serverAddress?: string, port?: number): Promise<boolean>;

  /**
   * Close LSL connection and cleanup resources
   */
  closeLSL(): Promise<boolean>;

  // MARK: - LSL Outlet Management
  /**
   * Create a new LSL outlet for streaming data
   * @param name - Unique outlet name
   * @param type - Data type (e.g., "EEG", "Quality", "Events")
   * @param channelCount - Number of channels
   * @param sampleRate - Sample rate in Hz
   * @param dataFormat - Data format (e.g., "float32", "double64")
   */
  createOutlet(
    name: string,
    type: string,
    channelCount: number,
    sampleRate: number,
    dataFormat: string
  ): Promise<string>;

  /**
   * Remove an LSL outlet
   * @param outletName - Name of the outlet to remove
   */
  removeOutlet(outletName: string): Promise<boolean>;

  /**
   * Get list of active LSL outlets
   */
  getActiveOutlets(): Promise<string[]>;

  // MARK: - Data Streaming
  /**
   * Push EEG sample data to LSL outlet
   * @param outletName - Name of the target outlet
   * @param sample - Array of sample values (one per channel)
   */
  pushSample(outletName: string, sample: number[]): Promise<boolean>;

  /**
   * Start streaming EEG data to LSL
   */
  startStreaming(): Promise<boolean>;

  /**
   * Stop streaming EEG data to LSL
   */
  stopStreaming(): Promise<boolean>;
}

const LSLModule: LSLModuleType;
export default LSLModule; 