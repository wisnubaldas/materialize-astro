/**
 * Validates the minimum fields required for login.
 * @param {{ email: string, password: string }} formData - Login form values.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateLoginForm(formData) {
  if (!formData.email || !formData.password) {
    return { isValid: false, message: 'Email dan password wajib diisi.' };
  }

  if (formData.password.length < 6) {
    return { isValid: false, message: 'Password minimal 6 karakter.' };
  }

  return { isValid: true, message: '' };
}
