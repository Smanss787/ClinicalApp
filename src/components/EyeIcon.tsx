import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface EyeIconProps {
  showPassword: boolean;
  size?: number;
  color?: string;
}

export const EyeIcon: React.FC<EyeIconProps> = ({ 
  showPassword, 
  size = 23, 
  color = '#1a2a36' 
}) => {
  // Alpha logic: when password is hidden (showPassword = false), alpha = 1.0 (fully opaque)
  // when password is shown (showPassword = true), alpha = 0.35 (partially transparent)
  const alpha = showPassword ? 0.35 : 1.0;
  
  // Convert hex color to rgba for alpha support
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const iconColor = hexToRgba(color, alpha);

  return (
    <View style={[styles.container, { width: size, height: size * 0.7 }]}>
      <Svg width={size} height={size * 0.7} viewBox="0 0 23 16" fill="none">
        {/* Eye pupil */}
        <Path
          d="M11.3769 5.11481C9.75796 5.11481 8.44696 6.44584 8.44696 8.09124C8.44696 9.73492 9.75796 11.0677 11.3769 11.0677C12.9976 11.0677 14.3086 9.73492 14.3086 8.09124C14.3103 6.44584 12.9976 5.11481 11.3769 5.11481Z"
          fill={iconColor}
        />
        {/* Eye outline */}
        <Path
          d="M22.4126 7.65708C20.1382 3.12822 15.9105 0.314378 11.3786 0.314378C6.84633 0.314378 2.61859 3.12822 0.344574 7.65708L0.1265 8.08951L0.344574 8.52195C2.61859 13.0508 6.84633 15.8651 11.3786 15.8651C15.9105 15.8651 20.1382 13.0525 22.4126 8.52195L22.6307 8.08951L22.4126 7.65708ZM11.3786 13.9594C7.69989 13.9594 4.23924 11.7228 2.24463 8.09124C4.23924 4.45795 7.69989 2.22141 11.3786 2.22141C15.0573 2.22141 18.518 4.45795 20.5126 8.09124C18.518 11.7228 15.0573 13.9594 11.3786 13.9594Z"
          fill={iconColor}
        />
        {/* Diagonal line for hidden state */}
        {showPassword && (
          <Path
            d="M2 2L21 14"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 