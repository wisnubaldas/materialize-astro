import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

import { cn } from './utils/cn';

export const patternedCardThemes = {
  blue: {
    gradient: ['#1D1AD8', '#38A6F2', '#4ADE80'],
    layers: [
      {
        color: 'rgba(45, 212, 191, 0.42)',
        style: { right: -125, top: 12, transform: [{ rotate: '-18deg' }] },
      },
      {
        color: 'rgba(96, 165, 250, 0.42)',
        style: { left: -118, bottom: -104, transform: [{ rotate: '-18deg' }] },
      },
      {
        color: 'rgba(255,255,255,0.16)',
        style: { right: -170, bottom: -115, transform: [{ rotate: '18deg' }] },
      },
    ],
  },
  pastel: {
    gradient: ['#A5A6F6', '#F5D7F6', '#93C5FD'],
    layers: [
      {
        color: 'rgba(99, 102, 241, 0.30)',
        style: { left: -120, top: -72, transform: [{ rotate: '36deg' }] },
      },
      {
        color: 'rgba(59, 130, 246, 0.38)',
        style: { right: -84, top: -58, transform: [{ rotate: '-38deg' }] },
      },
      {
        color: 'rgba(124, 58, 237, 0.24)',
        style: { left: 52, bottom: -132, transform: [{ rotate: '-30deg' }] },
      },
    ],
  },
  violet: {
    gradient: ['#4338CA', '#7C3AED', '#8B5CF6'],
    layers: [
      {
        color: 'rgba(37, 99, 235, 0.42)',
        style: { left: 18, top: -110, transform: [{ rotate: '20deg' }] },
      },
      {
        color: 'rgba(217, 70, 239, 0.34)',
        style: { right: -118, top: 36, transform: [{ rotate: '-18deg' }] },
      },
      {
        color: 'rgba(129, 140, 248, 0.42)',
        style: { left: 16, bottom: -118, transform: [{ rotate: '-34deg' }] },
      },
    ],
  },
  orange: {
    gradient: ['#FB923C', '#F97316', '#EF4444'],
    layers: [
      {
        color: 'rgba(251, 191, 36, 0.34)',
        style: { right: -120, top: -70, transform: [{ rotate: '22deg' }] },
      },
      {
        color: 'rgba(220, 38, 38, 0.30)',
        style: { left: -140, bottom: -100, transform: [{ rotate: '14deg' }] },
      },
      {
        color: 'rgba(255,255,255,0.12)',
        style: { right: -162, bottom: -115, transform: [{ rotate: '-18deg' }] },
      },
    ],
  },
};

export const patternedTextShadowStyle = {
  textShadowColor: 'rgba(15, 23, 42, 0.55)',
  textShadowOffset: { width: 1, height: 2 },
  textShadowRadius: 3,
};

const cardStyle = {
  minHeight: 150,
  overflow: 'hidden',
  borderRadius: 8,
};

const bandStyle = {
  position: 'absolute',
  height: 190,
  width: 320,
  borderRadius: 150,
};

/**
 * Renders a reusable patterned gradient card shell.
 * @param {{ variant?: 'blue'|'pastel'|'orange'|'violet', className?: string, style?: object|Array, children?: React.ReactNode }} props - Patterned card props.
 * @returns {React.ReactElement} Patterned card shell.
 */
export function PatternedCard({
  variant = 'blue',
  className = '',
  style,
  children,
}) {
  const theme = patternedCardThemes[variant] || patternedCardThemes.blue;

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={cn('p-4', className)}
      style={[cardStyle, style]}
    >
      {theme.layers.map((layer, index) => (
        <View
          key={`${variant}-layer-${index}`}
          pointerEvents="none"
          style={[bandStyle, layer.style, { backgroundColor: layer.color }]}
        />
      ))}

      {children}
    </LinearGradient>
  );
}
