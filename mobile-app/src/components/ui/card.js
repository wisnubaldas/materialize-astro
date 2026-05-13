import React from 'react';
import { View } from 'react-native';

import { cn } from './utils/cn';
import { TextClassContext } from './utils/text-context';

/**
 * Renders a reusable card container.
 * @param {{ className?: string, children?: React.ReactNode }} props - Card props.
 * @returns {React.ReactElement} Card container.
 */
export function Card({ className = '', ...props }) {
  return <View className={cn('rounded-2xl border border-slate-200 bg-white', className)} {...props} />;
}

/**
 * Renders the header area of a card.
 * @param {{ className?: string, children?: React.ReactNode }} props - Card header props.
 * @returns {React.ReactElement} Card header container.
 */
export function CardHeader({ className = '', ...props }) {
  return <View className={cn('gap-1 p-5 pb-3', className)} {...props} />;
}

/**
 * Provides title text styling to child text inside a card.
 * @param {{ className?: string, children?: React.ReactNode }} props - Card title props.
 * @returns {React.ReactElement} Card title slot.
 */
export function CardTitle({ className = '', ...props }) {
  return (
    <TextClassContext.Provider value={cn('text-xl font-extrabold text-slate-950', className)}>
      <View {...props} />
    </TextClassContext.Provider>
  );
}

/**
 * Provides description text styling to child text inside a card.
 * @param {{ className?: string, children?: React.ReactNode }} props - Card description props.
 * @returns {React.ReactElement} Card description slot.
 */
export function CardDescription({ className = '', ...props }) {
  return (
    <TextClassContext.Provider value={cn('text-sm leading-5 text-slate-500', className)}>
      <View {...props} />
    </TextClassContext.Provider>
  );
}

/**
 * Renders the main content area of a card.
 * @param {{ className?: string, children?: React.ReactNode }} props - Card content props.
 * @returns {React.ReactElement} Card content container.
 */
export function CardContent({ className = '', ...props }) {
  return <View className={cn('p-5', className)} {...props} />;
}

/**
 * Renders the footer area of a card.
 * @param {{ className?: string, children?: React.ReactNode }} props - Card footer props.
 * @returns {React.ReactElement} Card footer container.
 */
export function CardFooter({ className = '', ...props }) {
  return <View className={cn('flex-row items-center p-5 pt-0', className)} {...props} />;
}
