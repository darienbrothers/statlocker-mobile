/**
 * Confetti Animation Component
 * 
 * Creates celebratory confetti effects for onboarding milestones
 * with configurable intensity and colors.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { useOnboardingTheme, useOnboardingAnimation } from '../OnboardingThemeProvider';

interface ConfettiParticle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

interface ConfettiAnimationProps {
  /** Whether the animation should be active */
  active: boolean;
  /** Type of celebration - affects particle count and duration */
  type?: 'micro' | 'milestone' | 'completion';
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Custom colors to use (overrides theme colors) */
  colors?: string[];
  /** Custom particle count (overrides type default) */
  particleCount?: number;
}

export function ConfettiAnimation({
  active,
  type = 'micro',
  onComplete,
  colors: customColors,
  particleCount: customParticleCount,
}: ConfettiAnimationProps) {
  const { getCelebrationConfig } = useOnboardingTheme();
  const { shouldAnimate } = useOnboardingAnimation();
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const config = getCelebrationConfig(type);
  
  // Use custom values or config defaults
  const particleCount = customParticleCount ?? config.particles;
  const colors = customColors ?? config.colors;
  const duration = config.duration;

  // Create particles
  useEffect(() => {
    if (!shouldAnimate) return;

    particlesRef.current = Array.from({ length: particleCount }, (_, index) => ({
      id: index,
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
    }));
  }, [particleCount, colors, screenWidth, shouldAnimate]);

  // Animation logic
  useEffect(() => {
    if (!active || !shouldAnimate) {
      return;
    }

    const particles = particlesRef.current;
    if (particles.length === 0) return;

    // Create staggered animations for each particle
    const animations = particles.map((particle, index) => {
      const delay = (index / particles.length) * 200; // Stagger start times
      const fallDistance = screenHeight + 100;
      const horizontalDrift = (Math.random() - 0.5) * 200;

      return Animated.sequence([
        // Delay before starting
        Animated.delay(delay),
        
        // Entrance: scale up
        Animated.timing(particle.scale, {
          toValue: Math.random() * 0.5 + 0.5, // Random scale 0.5-1.0
          duration: 150,
          useNativeDriver: true,
        }),
        
        // Main animation: fall and rotate
        Animated.parallel([
          // Fall down
          Animated.timing(particle.y, {
            toValue: fallDistance,
            duration: duration - 150,
            useNativeDriver: true,
          }),
          
          // Drift horizontally
          Animated.timing(particle.x, {
            toValue: particle.x._value + horizontalDrift,
            duration: duration - 150,
            useNativeDriver: true,
          }),
          
          // Rotate
          Animated.timing(particle.rotation, {
            toValue: Math.random() * 720 + 360, // 1-3 full rotations
            duration: duration - 150,
            useNativeDriver: true,
          }),
          
          // Fade out near the end
          Animated.sequence([
            Animated.delay((duration - 150) * 0.7),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: (duration - 150) * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    // Run all particle animations
    animationRef.current = Animated.parallel(animations);
    
    animationRef.current.start((finished) => {
      if (finished && onComplete) {
        onComplete();
      }
    });

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [active, shouldAnimate, duration, screenHeight, onComplete]);

  // Don't render if animations are disabled
  if (!shouldAnimate || !active) {
    return null;
  }

  const renderParticle = (particle: ConfettiParticle) => {
    const transform = [
      { translateX: particle.x },
      { translateY: particle.y },
      { rotate: particle.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        })
      },
      { scale: particle.scale },
    ];

    const particleStyle = {
      position: 'absolute' as const,
      width: 8,
      height: 8,
      backgroundColor: particle.color,
      transform,
    };

    // Different shapes
    switch (particle.shape) {
      case 'circle':
        return (
          <Animated.View
            key={particle.id}
            style={[particleStyle, { borderRadius: 4 }]}
          />
        );
      case 'square':
        return (
          <Animated.View
            key={particle.id}
            style={particleStyle}
          />
        );
      case 'triangle':
        return (
          <Animated.View
            key={particle.id}
            style={[
              particleStyle,
              {
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 4,
                borderRightWidth: 4,
                borderBottomWidth: 8,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: particle.color,
              },
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {particlesRef.current.map(renderParticle)}
    </View>
  );
}

/**
 * Hook for triggering confetti animations
 * 
 * @example
 * const { triggerConfetti, isAnimating } = useConfetti();
 * 
 * const handleGoalSelection = () => {
 *   // ... goal selection logic
 *   triggerConfetti('micro');
 * };
 */
export function useConfetti() {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationType, setAnimationType] = React.useState<'micro' | 'milestone' | 'completion'>('micro');

  const triggerConfetti = React.useCallback((type: 'micro' | 'milestone' | 'completion' = 'micro') => {
    setAnimationType(type);
    setIsAnimating(true);
  }, []);

  const handleComplete = React.useCallback(() => {
    setIsAnimating(false);
  }, []);

  return {
    isAnimating,
    animationType,
    triggerConfetti,
    ConfettiComponent: React.useCallback(
      (props: Omit<ConfettiAnimationProps, 'active' | 'type' | 'onComplete'>) => (
        <ConfettiAnimation
          {...props}
          active={isAnimating}
          type={animationType}
          onComplete={handleComplete}
        />
      ),
      [isAnimating, animationType, handleComplete]
    ),
  };
}