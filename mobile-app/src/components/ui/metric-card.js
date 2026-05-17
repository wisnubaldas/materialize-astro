import React from 'react';
import { View } from 'react-native';

import { PatternedCard, patternedTextShadowStyle } from './patterned-card';
import { Text } from './text';

/**
 * Renders a reusable patterned numeric metric card for dashboard counters.
 * @param {{ title: string, value: string|number, caption?: string, variant?: 'blue'|'pastel'|'orange'|'violet', loading?: boolean, className?: string }} props - Metric card props.
 * @returns {React.ReactElement} Patterned metric card.
 */
export function MetricCard({
  title,
  value,
  caption = '',
  variant = 'blue',
  loading = false,
  className = '',
}) {
  return (
    <PatternedCard variant={variant} className={`flex-1 ${className}`}>
      <View className="mt-auto">
        <Text
          className="text-[15px] font-extrabold uppercase text-white"
          numberOfLines={2}
          style={patternedTextShadowStyle}
        >
          {title}
        </Text>
        <Text
          className="mt-2 text-4xl font-black text-white"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          style={patternedTextShadowStyle}
        >
          {loading ? '...' : value}
        </Text>
        {caption ? (
          <Text
            className="mt-1 text-xs font-semibold text-white/90"
            numberOfLines={1}
            style={patternedTextShadowStyle}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </PatternedCard>
  );
}
