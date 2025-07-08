import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 40;
const CHART_HEIGHT = 120;
const CHANNELS = 4;
const SAMPLES_PER_PACKET = 250;
const DISPLAY_SAMPLES = 50; // Reduced for better performance

interface EEGVisualizerProps {
  eegData: any[];
  isRunning: boolean;
}

interface ChannelData {
  samples: number[];
  color: string;
  min: number;
  max: number;
}

const EEGVisualizer: React.FC<EEGVisualizerProps> = ({ eegData, isRunning }) => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const lastUpdateTime = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);

  // Channel colors for visualization
  const channelColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  // Process EEG data and create normalized samples for each channel
  const processEEGData = (data: any[]): ChannelData[] => {
    if (!data || data.length === 0) {
      return [];
    }

    const latestPacket = data[data.length - 1];
    if (!latestPacket || !latestPacket.channelsData) {
      return [];
    }

    try {
      // Parse channelsData if it's a JSON string
      let channelsData: number[][] = [];
      if (typeof latestPacket.channelsData === 'string') {
        channelsData = JSON.parse(latestPacket.channelsData);
      } else {
        channelsData = latestPacket.channelsData;
      }

      const processedChannels: ChannelData[] = [];

      for (let ch = 0; ch < Math.min(CHANNELS, channelsData.length); ch++) {
        const samples = channelsData[ch] || [];
        
        if (samples.length === 0) continue;

        // Take only first DISPLAY_SAMPLES for performance
        const displaySamples = samples.slice(0, DISPLAY_SAMPLES);
        
        // Calculate min/max for normalization
        const min = Math.min(...displaySamples);
        const max = Math.max(...displaySamples);
        const range = max - min || 1;
        
        const normalizedSamples = displaySamples.map(sample => {
          const normalized = ((sample - min) / range) * CHART_HEIGHT;
          return Math.max(0, Math.min(CHART_HEIGHT, normalized));
        });

        processedChannels.push({
          samples: normalizedSamples,
          color: channelColors[ch] || '#FF6B6B',
          min,
          max
        });
      }

      return processedChannels;
    } catch (error) {
      console.error('Error processing EEG data:', error);
      return [];
    }
  };

  // Animation loop for smooth updates
  const animate = () => {
    const now = Date.now();
    if (now - lastUpdateTime.current > 200) { // Reduced update frequency
      setChannels(processEEGData(eegData));
      lastUpdateTime.current = now;
    }
    
    if (isRunning) {
      animationFrame.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning) {
      animate();
    } else {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isRunning, eegData]);

  // Memoized channel rendering for better performance
  const renderedChannels = useMemo(() => {
    return channels.map((channel, channelIndex) => {
      const stepX = CHART_WIDTH / (DISPLAY_SAMPLES - 1);
      
      // Create a simple bar representation instead of individual points
      const bars = channel.samples.map((sample, index) => {
        const barHeight = Math.max(1, sample / 10); // Minimum height of 1
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                left: index * stepX,
                height: barHeight,
                backgroundColor: channel.color,
                opacity: 0.7,
              }
            ]}
          />
        );
      });

      return (
        <View key={channelIndex} style={styles.channelContainer}>
          <View style={styles.channelHeader}>
            <View style={[styles.channelColor, { backgroundColor: channel.color }]} />
            <Text style={styles.channelTitle}>Channel {channelIndex + 1}</Text>
            <Text style={styles.channelStats}>
              Min: {channel.min.toFixed(1)} Max: {channel.max.toFixed(1)}
            </Text>
          </View>
          
          <View style={styles.waveformContainer}>
            {bars}
            {/* Static grid lines */}
            <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.25 }]} />
            <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.5 }]} />
            <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.75 }]} />
          </View>
        </View>
      );
    });
  }, [channels]);

  if (!isRunning || eegData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EEG Visualization</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {isRunning ? 'Waiting for EEG data...' : 'Start EEG recording to see visualization'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-time EEG Visualization</Text>
      
      {/* Data Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Samples: {DISPLAY_SAMPLES} of {SAMPLES_PER_PACKET}
        </Text>
        <Text style={styles.infoText}>
          Channels: {channels.length}
        </Text>
        <Text style={styles.infoText}>
          Update Rate: ~5 FPS
        </Text>
      </View>

      {/* EEG Waveform Display */}
      <View style={styles.channelsContainer}>
        {renderedChannels}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholder: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoText: {
    color: '#888888',
    fontSize: 12,
    marginVertical: 2,
  },
  channelsContainer: {
    maxHeight: 400,
  },
  channelContainer: {
    marginBottom: 16,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  channelColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  channelTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  channelStats: {
    color: '#888888',
    fontSize: 11,
  },
  waveformContainer: {
    position: 'relative',
    height: CHART_HEIGHT,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    width: 3,
    borderRadius: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#444444',
  },
});

export default EEGVisualizer; 