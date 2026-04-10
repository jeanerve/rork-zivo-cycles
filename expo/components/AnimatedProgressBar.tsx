import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface AnimatedProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showGlow?: boolean;
}

export default React.memo(function AnimatedProgressBar({
  progress,
  color = Colors.green,
  height = 6,
  showGlow = true,
}: AnimatedProgressBarProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(progress, 1),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width,
            backgroundColor: color,
            height,
          },
        ]}
      />
      {showGlow && (
        <Animated.View
          style={[
            styles.glow,
            {
              width,
              backgroundColor: color,
              height: height + 4,
            },
          ]}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    borderRadius: 8,
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: 0,
    borderRadius: 8,
    opacity: 0.2,
  },
});
