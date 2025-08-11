import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CyrebroSDK from '../../plugins/CyrebroModule';
import { QualityIndicatorVersion2 } from '../helper/QualityIndicatorVersion2';
import { BackButton } from '../components/BackButton';
import { COLORS } from '../constants/styles';

const { width: screenWidth } = Dimensions.get('window');

const HeadsetAdjustmentScreen = ({ navigation, route }: any) => {
  const { headsetConfig } = route.params;
  
  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [qualityHistory, setQualityHistory] = useState<number[]>([]);
  const [currentQuality, setCurrentQuality] = useState(0);
  const [successCriteria, setSuccessCriteria] = useState({
    goodQualityTime: 0,
    totalGoodQualityTime: 0,
  });
  
  // Animation
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Quality indicator
  const qualityIndicator = useRef(new QualityIndicatorVersion2()).current;
  
  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const qualityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const TOTAL_TIME = 30; // 30 seconds
  const SUCCESS_THRESHOLD = 15; // 15 seconds of good quality
  const QUALITY_THRESHOLD = 0.5; // Quality threshold for progress

  useEffect(() => {
    startAdjustment();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    // Pulse animation for active state
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRunning]);

  const startAdjustment = async () => {
    try {
      // Start EEG recording
      await CyrebroSDK.startEEGRecording();
      setIsRunning(true);
      
      // Start quality monitoring
      startQualityMonitoring();
      
      // Start timer
      startTimer();
      
    } catch (error) {
      console.error('Failed to start EEG recording:', error);
      Alert.alert('Error', 'Failed to start EEG recording. Please try again.');
    }
  };

  const startQualityMonitoring = () => {
    qualityTimerRef.current = setInterval(() => {
      // Simulate quality data - replace with actual quality data from SDK
      const mockQuality = Math.random(); // 0-1 range
      updateQuality(mockQuality);
    }, 1000); // Check quality every second
  };

  const updateQuality = (quality: number) => {
    setCurrentQuality(quality);
    setQualityHistory(prev => [...prev, quality]);
    
    // Update quality indicator
    const channelCount = headsetConfig.channelCount;
    const qualities = Array(channelCount).fill(quality);
    qualityIndicator.addNext(qualities);
    
    // Check if quality is good enough for progress
    if (quality >= QUALITY_THRESHOLD) {
      setSuccessCriteria(prev => ({
        ...prev,
        goodQualityTime: prev.goodQualityTime + 1,
        totalGoodQualityTime: prev.totalGoodQualityTime + 1,
      }));
    } else {
      setSuccessCriteria(prev => ({
        ...prev,
        goodQualityTime: 0, // Reset consecutive good quality time
      }));
    }
    
    // Update progress based on quality
    updateProgress();
  };

  const updateProgress = () => {
    const timeProgress = (timeElapsed / TOTAL_TIME) * 100;
    const qualityProgress = (successCriteria.totalGoodQualityTime / SUCCESS_THRESHOLD) * 100;
    
    // Progress is based on both time and quality
    const newProgress = Math.min(100, (timeProgress + qualityProgress) / 2);
    setProgress(newProgress);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        
        if (newTime >= TOTAL_TIME) {
          handleAdjustmentComplete();
          return prev;
        }
        
        return newTime;
      });
    }, 1000);
  };

  const handleAdjustmentComplete = () => {
    cleanup();
    setIsRunning(false);
    
    // Check if success criteria met
    if (successCriteria.totalGoodQualityTime >= SUCCESS_THRESHOLD) {
      showSuccess();
    } else {
      showFailure();
    }
  };

  const showSuccess = () => {
    Alert.alert(
      'Headset Adjustment Complete',
      'Your headset is properly adjusted and ready for use!',
      [
        {
          text: 'Continue',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  const showFailure = () => {
    Alert.alert(
      'Adjustment Incomplete',
      'The headset adjustment was not successful. Please check the headset placement and try again.',
      [
        {
          text: 'Try Again',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (qualityTimerRef.current) {
      clearInterval(qualityTimerRef.current);
      qualityTimerRef.current = null;
    }
  };

  const handleStop = async () => {
    try {
      await CyrebroSDK.stopEEGRecording();
      cleanup();
      setIsRunning(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to stop EEG recording:', error);
      Alert.alert('Error', 'Failed to stop EEG recording.');
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return '#4CAF50'; // Green
    if (quality >= 0.5) return '#FFD700'; // Yellow
    return '#FF4B4B'; // Red
  };

  const getQualityText = (quality: number) => {
    if (quality >= 0.8) return 'Excellent';
    if (quality >= 0.5) return 'Good';
    return 'Poor';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleStop} />
        <Text style={styles.headerTitle}>Headset Adjustment</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{headsetConfig.title}</Text>
        <Text style={styles.subtitle}>Please keep your headset still while we adjust the signal quality</Text>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Adjustment Progress</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          {/* Time Remaining */}
          <Text style={styles.timeText}>
            Time Remaining: {Math.max(0, TOTAL_TIME - timeElapsed)}s
          </Text>
        </View>

        {/* Quality Section */}
        <View style={styles.qualitySection}>
          <Text style={styles.qualityTitle}>Signal Quality</Text>
          
          <Animated.View
            style={[
              styles.qualityIndicator,
              {
                backgroundColor: getQualityColor(currentQuality),
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            <Text style={styles.qualityValue}>{Math.round(currentQuality * 100)}%</Text>
            <Text style={styles.qualityLabel}>{getQualityText(currentQuality)}</Text>
          </Animated.View>

          {/* Quality History */}
          <View style={styles.qualityHistory}>
            <Text style={styles.qualityHistoryTitle}>Quality History</Text>
            <View style={styles.qualityHistoryBar}>
              {qualityHistory.slice(-10).map((quality, index) => (
                <View
                  key={index}
                  style={[
                    styles.qualityHistoryDot,
                    { backgroundColor: getQualityColor(quality) },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Success Criteria */}
        <View style={styles.criteriaSection}>
          <Text style={styles.criteriaTitle}>Success Criteria</Text>
          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Good Quality Time:</Text>
            <Text style={styles.criteriaValue}>
              {successCriteria.totalGoodQualityTime}s / {SUCCESS_THRESHOLD}s
            </Text>
          </View>
          <View style={styles.criteriaRow}>
            <Text style={styles.criteriaLabel}>Consecutive Good Quality:</Text>
            <Text style={styles.criteriaValue}>
              {successCriteria.goodQualityTime}s
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <Animated.View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isRunning ? '#4CAF50' : '#FF4B4B',
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isRunning ? 'Adjusting...' : 'Stopped'}
          </Text>
        </View>
      </View>

      {/* Stop Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
          <Text style={styles.stopButtonText}>Stop Adjustment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  progressSection: {
    marginBottom: 30,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  qualitySection: {
    marginBottom: 30,
  },
  qualityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  qualityIndicator: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  qualityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  qualityLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  qualityHistory: {
    marginBottom: 20,
  },
  qualityHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  qualityHistoryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
  },
  qualityHistoryDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  criteriaSection: {
    marginBottom: 30,
  },
  criteriaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  criteriaLabel: {
    fontSize: 14,
    color: '#666',
  },
  criteriaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  stopButton: {
    backgroundColor: '#FF4B4B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HeadsetAdjustmentScreen; 