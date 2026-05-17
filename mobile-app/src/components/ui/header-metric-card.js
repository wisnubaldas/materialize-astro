import React from 'react';
import { View } from 'react-native';

import { PatternedCard, patternedTextShadowStyle } from './patterned-card';
import { Text } from './text';

/**
 * Renders a reusable patterned header card with an optional action above the title.
 * @param {{ title: string, subtitle?: string, action?: React.ReactNode, variant?: 'blue'|'pastel'|'orange'|'violet', className?: string }} props - Header card props.
 * @returns {React.ReactElement} Header metric card.
 */
export function HeaderMetricCard({
  title,
  subtitle = '',
  action = null,
  variant = 'violet',
  className = '',
}) {
  return (
    <PatternedCard
      variant={variant}
      className={`justify-end ${className}`}
      style={{ minHeight: 150 }}
    >
      <View className="mt-auto">
        {action ? <View className="mb-4">{action}</View> : null}
        <Text
          className="text-[18px] font-extrabold uppercase text-white"
          numberOfLines={2}
          style={patternedTextShadowStyle}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="mt-2 text-sm font-semibold text-white/90"
            numberOfLines={2}
            style={patternedTextShadowStyle}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </PatternedCard>
  );
}
