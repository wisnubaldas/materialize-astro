import { login, getAccessToken, AUTH_ERRORS } from '@js/auth.js';
import { LOGIN_REDIRECT_PATH } from '@lib/auth/config';

const run = () => {
  const form = document.getElementById('formAuthentication');
  if (!form) {
    return;
  }

  const submitButton = document.getElementById('login');
  const errorAlert = document.getElementById('login-error');
  const rememberCheckbox = document.getElementById('remember-me');
  const defaultButtonContent = submitButton?.innerHTML ?? '';
  let hasRedirected = false;

  const redirectToApp = () => {
    const target = LOGIN_REDIRECT_PATH || '/';
    hasRedirected = true;
    window.location.replace(target);
  };

  const showError = (message) => {
    if (!errorAlert) return;
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
  };

  const clearError = () => {
    if (!errorAlert) return;
    errorAlert.textContent = '';
    errorAlert.classList.add('d-none');
  };

  const setSubmitting = (submitting) => {
    if (!submitButton) return;
    submitButton.disabled = submitting;
    submitButton.classList.toggle('disabled', submitting);
    submitButton.innerHTML = submitting ? 'Signing in...' : defaultButtonContent;
  };

  const token = getAccessToken();
  if (token) {
    redirectToApp();
    return;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    hasRedirected = false;
    clearError();
    setSubmitting(true);

    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const remember = Boolean(rememberCheckbox?.checked);

    if (!email || !password) {
      showError('Email dan password wajib diisi.');
      setSubmitting(false);
      return;
    }

    try {
      await login({ email, password, remember });
      redirectToApp();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : AUTH_ERRORS.generic;
      showError(message);
    } finally {
      if (!hasRedirected) {
        setSubmitting(false);
      }
    }
  };

  form.addEventListener('submit', handleSubmit);
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
