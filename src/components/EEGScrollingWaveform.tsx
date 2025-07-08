import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 40;
const CHART_HEIGHT = 100;
const BUFFER_SIZE = 200; // Reduced buffer size for better performance
const SAMPLES_PER_UPDATE = 20; // Process fewer samples per update

interface EEGScrollingWaveformProps {
  eegData: any[];
  isRunning: boolean;
}

interface SamplePoint {
  x: number;
  y: number;
  channel: number;
}

const EEGScrollingWaveform: React.FC<EEGScrollingWaveformProps> = ({ eegData, isRunning }) => {
  const [sampleBuffer, setSampleBuffer] = useState<SamplePoint[]>([]);
  const [channelColors] = useState(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']);
  const animationFrame = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  // Process new EEG data and add to buffer
  const processNewData = (data: any[]) => {
    if (!data || data.length === 0) return;

    const latestPacket = data[data.length - 1];
    if (!latestPacket || !latestPacket.channelsData) return;

    try {
      let channelsData: number[][] = [];
      if (typeof latestPacket.channelsData === 'string') {
        channelsData = JSON.parse(latestPacket.channelsData);
      } else {
        channelsData = latestPacket.channelsData;
      }

      const newSamples: SamplePoint[] = [];
      const stepX = CHART_WIDTH / (BUFFER_SIZE - 1);

      channelsData.forEach((channel, channelIndex) => {
        if (channel && channel.length > 0) {
          // Take only first SAMPLES_PER_UPDATE samples from each packet for performance
          const samples = channel.slice(0, SAMPLES_PER_UPDATE);
          
          // Normalize samples
          const min = Math.min(...samples);
          const max = Math.max(...samples);
          const range = max - min || 1;
          
          samples.forEach((sample, sampleIndex) => {
            const normalizedY = ((sample - min) / range) * CHART_HEIGHT;
            newSamples.push({
              x: (sampleBuffer.length + sampleIndex) * stepX,
              y: Math.max(0, Math.min(CHART_HEIGHT, CHART_HEIGHT - normalizedY)),
              channel: channelIndex
            });
          });
        }
      });

      setSampleBuffer(prev => {
        const updated = [...prev, ...newSamples];
        // Keep only the last BUFFER_SIZE samples
        return updated.slice(-BUFFER_SIZE);
      });

    } catch (error) {
      console.error('Error processing EEG data for scrolling waveform:', error);
    }
  };

  // Animation loop
  const animate = () => {
    const now = Date.now();
    if (now - lastUpdateTime.current > 100) { // Reduced update frequency
      processNewData(eegData);
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
      // Clear buffer when stopped
      setSampleBuffer([]);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isRunning, eegData]);

  // Memoized channel samples for better performance
  const channelSamples = useMemo(() => {
    return channelColors.map((_, channelIndex) => 
      sampleBuffer.filter(sample => sample.channel === channelIndex)
    );
  }, [sampleBuffer, channelColors]);

  // Memoized rendered samples for better performance
  const renderedSamples = useMemo(() => {
    return channelSamples.map((samples, channelIndex) => (
      <View key={channelIndex} style={styles.channelLayer}>
        {samples.map((sample, sampleIndex) => (
          <View
            key={`${channelIndex}-${sampleIndex}`}
            style={[
              styles.samplePoint,
              {
                left: sample.x,
                top: sample.y,
                backgroundColor: channelColors[channelIndex],
              }
            ]}
          />
        ))}
      </View>
    ));
  }, [channelSamples, channelColors]);

  if (!isRunning) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scrolling EEG Waveform</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Start EEG recording to see real-time scrolling waveform
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-time Scrolling EEG</Text>
      
      {/* Channel Legend */}
      <View style={styles.legend}>
        {channelColors.map((color, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: color }]} />
            <Text style={styles.legendText}>Ch{index + 1}</Text>
          </View>
        ))}
      </View>

      {/* Scrolling Waveform Display */}
      <View style={styles.waveformContainer}>
        {renderedSamples}
        
        {/* Static grid lines */}
        <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.25 }]} />
        <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.5 }]} />
        <View style={[styles.gridLine, { top: CHART_HEIGHT * 0.75 }]} />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Buffer: {sampleBuffer.length} samples
        </Text>
        <Text style={styles.infoText}>
          Channels: {channelSamples.filter(ch => ch.length > 0).length}
        </Text>
        <Text style={styles.infoText}>
          Update Rate: ~10 FPS
        </Text>
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
    fontSize: 16,
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
    fontSize: 14,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  waveformContainer: {
    position: 'relative',
    height: CHART_HEIGHT,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  channelLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  samplePoint: {
    position: 'absolute',
    width: 1,
    height: 1,
    borderRadius: 0.5,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#444444',
  },
  infoContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  infoText: {
    color: '#888888',
    fontSize: 11,
    marginVertical: 2,
  },
});

export default EEGScrollingWaveform; 