/**
 * Validates whether the login form has the minimum required fields.
 * @param {{ username: string, password: string }} formData - Login form values.
 * @returns {{ isValid: boolean, message: string }} Validation result for UI feedback.
 */
export function validateLoginForm(formData) {
  if (!formData.username || !formData.password) {
    return { isValid: false, message: 'Username dan password wajib diisi.' };
  }

  if (formData.password.length < 6) {
    return { isValid: false, message: 'Password minimal 6 karakter.' };
  }

  return { isValid: true, message: '' };
}
