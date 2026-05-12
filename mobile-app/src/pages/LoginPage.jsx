import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonPage,
  IonText,
  IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext.jsx';
import { appConfig, routePaths } from '../config/env.js';
import { validateLoginForm } from '../utils/validators.js';

/**
 * Renders the login screen and submits credentials through the authentication context.
 * @returns {JSX.Element} Login page.
 */
export default function LoginPage() {
  const history = useHistory();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /**
   * Updates a single login form field.
   * @param {string} fieldName - Field to update.
   * @param {string} value - New field value.
   * @returns {void}
   */
  function updateField(fieldName, value) {
    setFormData((currentValue) => ({
      ...currentValue,
      [fieldName]: value
    }));
  }

  /**
   * Validates and submits the login form.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   * @returns {Promise<void>} Resolves after login succeeds or fails.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateLoginForm(formData);

    if (!validation.isValid) {
      setToastMessage(validation.message);
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData);
      history.replace(routePaths.dashboard);
    } catch (error) {
      setToastMessage(error.message || 'Login gagal.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="login-page">
        <div className="login-wrapper">
          <div className="login-brand">
            <div className="brand-mark">M</div>
            <h1>{appConfig.appName}</h1>
            <p>Aplikasi mobile sederhana berbasis Ionic JavaScript.</p>
          </div>

          <IonCard className="login-card">
            <IonCardContent>
              <form onSubmit={handleSubmit}>
                <IonInput
                  label="Username"
                  labelPlacement="stacked"
                  placeholder="Masukkan username"
                  value={formData.username}
                  onIonInput={(event) => updateField('username', event.detail.value || '')}
                  autocomplete="username"
                />

                <IonInput
                  className="input-spacing"
                  type="password"
                  label="Password"
                  labelPlacement="stacked"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onIonInput={(event) => updateField('password', event.detail.value || '')}
                  autocomplete="current-password"
                />

                <IonButton className="submit-button" type="submit" expand="block" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Login'}
                </IonButton>
              </form>

              {appConfig.useMockAuth && (
                <IonText color="medium">
                  <p className="helper-text">Mode demo: admin / admin123</p>
                </IonText>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={Boolean(toastMessage)}
          message={toastMessage}
          duration={2200}
          onDidDismiss={() => setToastMessage('')}
        />
      </IonContent>
    </IonPage>
  );
}
