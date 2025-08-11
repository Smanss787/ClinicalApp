import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface BackButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
  style?: any;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  size = 32, 
  color = '#1a2a36',
  style 
}) => {
  // Match XML design: 4dp width × 50dp height proportions
  const containerWidth = size * 0.08; // 4dp equivalent
  const containerHeight = size; // 50dp equivalent
  const strokeWidth = Math.max(1, size * 0.12); // 1dp radius equivalent
  
  // Center point
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  // Match XML positioning: 19.1dp and 19.2dp offsets
  const topOffset = containerHeight * 0.382; // 19.1dp / 50dp
  const bottomOffset = containerHeight * 0.384; // 19.2dp / 50dp
  
  // Calculate line positions to match XML rotation
  const lineLength = containerWidth * 13; // Slightly shorter lines for perfect balance
  
  // Top line: rotated -45 degrees (fromDegrees="-45")
  const topLineX1 = centerX - lineLength / 2;
  const topLineY1 = centerY - topOffset;
  const topLineX2 = centerX + lineLength / 2;
  const topLineY2 = centerY - topOffset;
  
  // Bottom line: rotated 45 degrees (fromDegrees="45")
  const bottomLineX1 = centerX - lineLength / 2;
  const bottomLineY1 = centerY + bottomOffset;
  const bottomLineX2 = centerX + lineLength / 2;
  const bottomLineY2 = centerY + bottomOffset;

  return (
    <TouchableOpacity 
      style={[styles.container, { width: size, height: size }, style]} 
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${containerWidth} ${containerHeight}`}>
        {/* Top line: rotated -45 degrees */}
        <Line
          x1={topLineX1}
          y1={topLineY1}
          x2={topLineX2}
          y2={topLineY2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(-45 ${centerX} ${centerY - topOffset})`}
        />
        
        {/* Bottom line: rotated 45 degrees */}
        <Line
          x1={bottomLineX1}
          y1={bottomLineY1}
          x2={bottomLineX2}
          y2={bottomLineY2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(45 ${centerX} ${centerY + bottomOffset})`}
        />
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
}); 