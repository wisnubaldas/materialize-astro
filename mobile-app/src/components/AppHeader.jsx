import React from 'react';
import { IonHeader, IonTitle, IonToolbar } from '@ionic/react';

/**
 * Renders a consistent Ionic header for top-level pages.
 * @param {{ title: string }} props - Header props.
 * @returns {JSX.Element} Ionic header component.
 */
export default function AppHeader({ title }) {
  return (
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
}
