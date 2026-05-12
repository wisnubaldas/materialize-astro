import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useAuth } from '../auth/AuthContext.jsx';
import { routePaths } from '../config/env.js';

/**
 * Displays a simple loading screen while authentication state is being restored.
 * @returns {JSX.Element} Loading page.
 */
function AuthLoadingPage() {
  return (
    <IonPage>
      <IonContent fullscreen className="center-content">
        <IonSpinner name="crescent" />
        <p className="muted-text">Memeriksa sesi login...</p>
      </IonContent>
    </IonPage>
  );
}

/**
 * Protects routes that require an authenticated user.
 * @param {{ component: React.ComponentType, [key: string]: any }} props - Route props and target component.
 * @returns {JSX.Element} Protected route wrapper.
 */
export default function ProtectedRoute({ component: Component, ...rest }) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (isLoading) {
          return <AuthLoadingPage />;
        }

        return isAuthenticated ? <Component {...props} /> : <Redirect to={routePaths.login} />;
      }}
    />
  );
}
