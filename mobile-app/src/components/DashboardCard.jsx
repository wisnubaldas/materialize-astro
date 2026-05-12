import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';

/**
 * Displays a compact dashboard metric card.
 * @param {{ title: string, value: string|number, description: string }} props - Dashboard card content.
 * @returns {JSX.Element} Ionic card component.
 */
export default function DashboardCard({ title, value, description }) {
  return (
    <IonCard className="dashboard-card">
      <IonCardHeader>
        <IonCardSubtitle>{title}</IonCardSubtitle>
        <IonCardTitle>{value}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>{description}</IonCardContent>
    </IonCard>
  );
}
