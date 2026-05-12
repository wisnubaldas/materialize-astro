import React from 'react';
import { IonButton, IonContent, IonGrid, IonPage, IonRow, IonCol } from '@ionic/react';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext.jsx';
import AppHeader from '../components/AppHeader.jsx';
import DashboardCard from '../components/DashboardCard.jsx';
import { routePaths } from '../config/env.js';

const dashboardCards = [
  {
    title: 'Total Data',
    value: 24,
    description: 'Contoh ringkasan jumlah data yang dapat diganti dengan data API.'
  },
  {
    title: 'Pending',
    value: 7,
    description: 'Contoh data proses yang masih menunggu tindak lanjut.'
  },
  {
    title: 'Selesai',
    value: 17,
    description: 'Contoh data yang sudah selesai diproses.'
  }
];

/**
 * Renders a simple authenticated dashboard page.
 * @returns {JSX.Element} Dashboard page.
 */
export default function DashboardPage() {
  const history = useHistory();
  const { user, logout } = useAuth();

  /**
   * Logs out the current user and returns to the login screen.
   * @returns {Promise<void>} Resolves after logout is completed.
   */
  async function handleLogout() {
    await logout();
    history.replace(routePaths.login);
  }

  return (
    <IonPage>
      <AppHeader title="Dashboard" />
      <IonContent fullscreen className="dashboard-page">
        <section className="dashboard-hero">
          <p className="eyebrow-text">Selamat datang</p>
          <h1>{user?.name || user?.username || 'User'}</h1>
          <p className="muted-text">Ini adalah dashboard awal yang bisa dikembangkan sesuai kebutuhan aplikasi.</p>
        </section>

        <IonGrid fixed>
          <IonRow>
            {dashboardCards.map((card) => (
              <IonCol size="12" sizeMd="4" key={card.title}>
                <DashboardCard title={card.title} value={card.value} description={card.description} />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <div className="dashboard-actions">
          <IonButton expand="block" onClick={handleLogout} color="medium">
            Logout
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
