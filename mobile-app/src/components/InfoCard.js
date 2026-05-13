import React from 'react';

import { Card, CardContent } from './ui/card';
import { Text } from './ui/text';

/**
 * Displays a compact dashboard information card.
 * @param {{ title: string, value: string|number, description: string }} props - Card content.
 * @returns {React.ReactElement} Information card.
 */
export default function InfoCard({ title, value, description }) {
  return (
    <Card>
      <CardContent className="gap-2">
        <Text variant="label" className="text-xs uppercase text-slate-500">
          {title}
        </Text>
        <Text variant="title">{value}</Text>
        <Text variant="muted">{description}</Text>
      </CardContent>
    </Card>
  );
}
