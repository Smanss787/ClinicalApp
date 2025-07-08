import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface EEGDataTableProps {
  eegData: any[];
  isRunning: boolean;
}

const EEGDataTable: React.FC<EEGDataTableProps> = ({ eegData, isRunning }) => {
  // Memoized data processing for better performance
  const processedData = useMemo(() => {
    if (!isRunning || eegData.length === 0) {
      return { channelsData: [], latestPacket: null };
    }

    const latestPacket = eegData[eegData.length - 1];
    if (!latestPacket || !latestPacket.channelsData) {
      return { channelsData: [], latestPacket };
    }

    try {
      let channelsData: number[][] = [];
      if (typeof latestPacket.channelsData === 'string') {
        channelsData = JSON.parse(latestPacket.channelsData);
      } else {
        channelsData = latestPacket.channelsData;
      }

      return { channelsData, latestPacket };
    } catch (error) {
      console.error('Error parsing channels data:', error);
      return { channelsData: [], latestPacket };
    }
  }, [eegData, isRunning]);

  // Memoized table rows for better performance
  const tableRows = useMemo(() => {
    const { channelsData } = processedData;
    if (channelsData.length === 0) return [];

    // Show only first 15 samples for better performance
    const displaySamples = 15;
    const sampleIndices = Array.from({ length: displaySamples }, (_, i) => i);

    return sampleIndices.map(sampleIndex => (
      <View key={sampleIndex} style={styles.dataRow}>
        <Text style={styles.indexCell}>{sampleIndex}</Text>
        {channelsData.map((channel, channelIndex) => (
          <Text key={channelIndex} style={styles.dataCell}>
            {channel[sampleIndex] ? channel[sampleIndex].toFixed(1) : 'N/A'}
          </Text>
        ))}
      </View>
    ));
  }, [processedData]);

  // Memoized header row
  const headerRow = useMemo(() => {
    const { channelsData } = processedData;
    return (
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Sample</Text>
        {channelsData.map((_, index) => (
          <Text key={index} style={styles.headerCell}>
            Ch{index + 1}
          </Text>
        ))}
      </View>
    );
  }, [processedData]);

  if (!isRunning || eegData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EEG Data Table</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {isRunning ? 'Waiting for EEG data...' : 'Start EEG recording to see data'}
          </Text>
        </View>
      </View>
    );
  }

  const { channelsData, latestPacket } = processedData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EEG Data Table (First 15 samples)</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            {headerRow}
            {tableRows}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Summary Info */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Total: {channelsData[0]?.length || 0} samples
        </Text>
        <Text style={styles.summaryText}>
          Channels: {channelsData.length}
        </Text>
        <Text style={styles.summaryText}>
          Time: {latestPacket?.timestamp || 'N/A'}
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
    height: 100,
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
  tableContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#444444',
  },
  headerCell: {
    width: 70,
    padding: 8,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#666666',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  indexCell: {
    width: 70,
    padding: 6,
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    backgroundColor: '#333333',
    borderRightWidth: 1,
    borderRightColor: '#666666',
  },
  dataCell: {
    width: 70,
    padding: 6,
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#666666',
  },
  summaryContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  summaryText: {
    color: '#888888',
    fontSize: 11,
    marginVertical: 2,
  },
});

export default EEGDataTable; 