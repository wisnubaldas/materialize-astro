import React from 'react';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext.jsx';
import ProtectedRoute from './guards/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { routePaths } from './config/env.js';

/**
 * Defines the root application shell, global providers, and route structure.
 * All route-level authentication is delegated to ProtectedRoute.
 */
export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path={routePaths.login} component={LoginPage} />
            <ProtectedRoute exact path={routePaths.dashboard} component={DashboardPage} />
            <Redirect exact from="/" to={routePaths.dashboard} />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
