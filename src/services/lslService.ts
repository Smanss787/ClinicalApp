import LSLModule from '../../plugins/LSLModule';

export interface LSLConfig {
  serverAddress?: string;
  port?: number;
  sampleRate?: number;
  dataFormat?: string;
}

export interface LSLOutletConfig {
  name: string;
  type: string;
  channelCount: number;
  sampleRate: number;
  dataFormat: string;
}

export interface EEGSample {
  timestamp: number;
  channels: number[];
  qualities?: number[];
}

class LSLService {
  private isInitialized = false;
  private isStreaming = false;
  private activeOutlets = new Map<string, LSLOutletConfig>();
  private eegOutletName = 'EEG_Data';
  private qualityOutletName = 'EEG_Quality';
  private eventOutletName = 'EEG_Events';

  /**
   * Initialize LSL connection
   */
  async initialize(config: LSLConfig = {}): Promise<boolean> {
    try {
      const { serverAddress = 'localhost', port = 16571 } = config;
      
      console.log(`Initializing LSL connection to ${serverAddress}:${port}`);
      
      const result = await LSLModule.initializeLSL(serverAddress, port);
      this.isInitialized = result;
      
      if (result) {
        console.log('LSL connection established successfully');
      } else {
        console.error('Failed to initialize LSL connection');
      }
      
      return result;
    } catch (error) {
      console.error('LSL initialization error:', error);
      throw error;
    }
  }

  /**
   * Create EEG data outlet
   */
  async createEEGOutlet(channelCount: number, sampleRate: number = 250): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('LSL not initialized. Call initialize() first.');
      }

      const outletConfig: LSLOutletConfig = {
        name: this.eegOutletName,
        type: 'EEG',
        channelCount,
        sampleRate,
        dataFormat: 'float32'
      };

      await LSLModule.createOutlet(
        outletConfig.name,
        outletConfig.type,
        outletConfig.channelCount,
        outletConfig.sampleRate,
        outletConfig.dataFormat
      );

      this.activeOutlets.set(outletConfig.name, outletConfig);
      console.log(`EEG outlet created: ${outletConfig.name} (${channelCount} channels, ${sampleRate}Hz)`);
      
      return true;
    } catch (error) {
      console.error('Failed to create EEG outlet:', error);
      throw error;
    }
  }

  /**
   * Create quality indicator outlet
   */
  async createQualityOutlet(channelCount: number, sampleRate: number = 10): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('LSL not initialized. Call initialize() first.');
      }

      const outletConfig: LSLOutletConfig = {
        name: this.qualityOutletName,
        type: 'Quality',
        channelCount,
        sampleRate,
        dataFormat: 'float32'
      };

      await LSLModule.createOutlet(
        outletConfig.name,
        outletConfig.type,
        outletConfig.channelCount,
        outletConfig.sampleRate,
        outletConfig.dataFormat
      );

      this.activeOutlets.set(outletConfig.name, outletConfig);
      console.log(`Quality outlet created: ${outletConfig.name} (${channelCount} channels, ${sampleRate}Hz)`);
      
      return true;
    } catch (error) {
      console.error('Failed to create quality outlet:', error);
      throw error;
    }
  }

  /**
   * Create event marker outlet
   */
  async createEventOutlet(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('LSL not initialized. Call initialize() first.');
      }

      const outletConfig: LSLOutletConfig = {
        name: this.eventOutletName,
        type: 'Events',
        channelCount: 1,
        sampleRate: 0, // Irregular rate for events
        dataFormat: 'string'
      };

      await LSLModule.createOutlet(
        outletConfig.name,
        outletConfig.type,
        outletConfig.channelCount,
        outletConfig.sampleRate,
        outletConfig.dataFormat
      );

      this.activeOutlets.set(outletConfig.name, outletConfig);
      console.log(`Event outlet created: ${outletConfig.name}`);
      
      return true;
    } catch (error) {
      console.error('Failed to create event outlet:', error);
      throw error;
    }
  }

  /**
   * Push EEG sample data to LSL
   */
  async pushEEGSample(sample: EEGSample): Promise<boolean> {
    try {
      if (!this.isStreaming || !this.activeOutlets.has(this.eegOutletName)) {
        return false;
      }

      // Push EEG data
      await LSLModule.pushSample(this.eegOutletName, sample.channels);
      
      // Push quality data if available
      if (sample.qualities && this.activeOutlets.has(this.qualityOutletName)) {
        await LSLModule.pushSample(this.qualityOutletName, sample.qualities);
      }

      return true;
    } catch (error) {
      console.error('Failed to push EEG sample:', error);
      return false;
    }
  }

  /**
   * Push event marker to LSL
   */
  async pushEvent(eventType: string, eventData?: any): Promise<boolean> {
    try {
      if (!this.isStreaming || !this.activeOutlets.has(this.eventOutletName)) {
        return false;
      }

      const eventString = JSON.stringify({
        type: eventType,
        data: eventData,
        timestamp: Date.now()
      });

      // For string events, we need to convert to a numeric representation
      const eventCode = this.hashString(eventString);
      await LSLModule.pushSample(this.eventOutletName, [eventCode]);
      return true;
    } catch (error) {
      console.error('Failed to push event:', error);
      return false;
    }
  }

  /**
   * Start LSL streaming
   */
  async startStreaming(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('LSL not initialized. Call initialize() first.');
      }

      if (this.activeOutlets.size === 0) {
        throw new Error('No outlets created. Create outlets before starting streaming.');
      }

      const result = await LSLModule.startStreaming();
      this.isStreaming = result;
      
      if (result) {
        console.log('LSL streaming started');
      } else {
        console.error('Failed to start LSL streaming');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to start LSL streaming:', error);
      throw error;
    }
  }

  /**
   * Stop LSL streaming
   */
  async stopStreaming(): Promise<boolean> {
    try {
      const result = await LSLModule.stopStreaming();
      this.isStreaming = false;
      
      if (result) {
        console.log('LSL streaming stopped');
      } else {
        console.error('Failed to stop LSL streaming');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to stop LSL streaming:', error);
      throw error;
    }
  }

  /**
   * Get active outlets
   */
  async getActiveOutlets(): Promise<string[]> {
    try {
      return await LSLModule.getActiveOutlets();
    } catch (error) {
      console.error('Failed to get active outlets:', error);
      return [];
    }
  }

  /**
   * Remove an outlet
   */
  async removeOutlet(outletName: string): Promise<boolean> {
    try {
      const result = await LSLModule.removeOutlet(outletName);
      if (result) {
        this.activeOutlets.delete(outletName);
        console.log(`Outlet removed: ${outletName}`);
      }
      return result;
    } catch (error) {
      console.error(`Failed to remove outlet ${outletName}:`, error);
      return false;
    }
  }

  /**
   * Close LSL connection and cleanup
   */
  async close(): Promise<boolean> {
    try {
      // Stop streaming first
      if (this.isStreaming) {
        await this.stopStreaming();
      }

      // Remove all outlets
      const outletNames = Array.from(this.activeOutlets.keys());
      for (const outletName of outletNames) {
        await this.removeOutlet(outletName);
      }

      // Close LSL connection
      const result = await LSLModule.closeLSL();
      this.isInitialized = false;
      this.activeOutlets.clear();
      
      if (result) {
        console.log('LSL connection closed');
      } else {
        console.error('Failed to close LSL connection');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to close LSL:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isStreaming: this.isStreaming,
      activeOutlets: Array.from(this.activeOutlets.keys()),
      outletCount: this.activeOutlets.size
    };
  }

  /**
   * Simple hash function for string to number conversion
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if LSL is ready for streaming
   */
  isReady(): boolean {
    return this.isInitialized && this.isStreaming && this.activeOutlets.size > 0;
  }
}

// Export singleton instance
export const lslService = new LSLService();
export default lslService; 