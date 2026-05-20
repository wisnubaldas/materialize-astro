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

/**
 * Validates the minimum fields required before submitting a Build Up checklist.
 * @param {object} formData - Build Up checklist form values.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateBuildUpChecklistForm(formData) {
  const requiredFields = [
    ['uld', 'ULD'],
    ['flightNo', 'Flight No'],
    ['flightDate', 'Flight Date'],
  ];
  const missingField = requiredFields.find(([key]) => !String(formData[key] || '').trim());

  if (missingField) {
    return { isValid: false, message: `${missingField[1]} wajib diisi.` };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(formData.flightDate))) {
    return { isValid: false, message: 'Flight Date wajib menggunakan format YYYY-MM-DD.' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validates a Build Up Check detail form.
 * @param {object} formData - Detail form values.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateBuildUpCheckDetailForm(formData) {
  if (!String(formData.mawb || '').trim()) {
    return { isValid: false, message: 'MAWB wajib diisi.' };
  }

  if (!/^\d{3}-?\d{8}$/.test(String(formData.mawb).trim())) {
    return { isValid: false, message: 'MAWB wajib berisi 11 digit, contoh 123-45678901.' };
  }

  if (Number(formData.master_total_pieces) <= 0) {
    return { isValid: false, message: 'Total pieces MAWB harus lebih dari 0.' };
  }

  if (
    formData.total_pieces !== ''
    && formData.total_pieces !== null
    && formData.total_pieces !== undefined
    && Number(formData.total_pieces) <= 0
  ) {
    return { isValid: false, message: 'Pieces ULD ini harus lebih dari 0 jika diisi.' };
  }

  if (
    formData.total_pieces !== ''
    && formData.total_pieces !== null
    && formData.total_pieces !== undefined
    && Number(formData.master_total_pieces) < Number(formData.total_pieces)
  ) {
    return {
      isValid: false,
      message: 'Total pieces MAWB tidak boleh lebih kecil dari pieces ULD ini.',
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Validates one Build Up Check rincian form.
 * @param {object} formData - Rincian form values.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateBuildUpCheckRincianForm(formData) {
  if (Number(formData.pieces) <= 0) {
    return { isValid: false, message: 'Pieces rincian harus lebih dari 0.' };
  }

  if (formData.weight !== '' && Number(formData.weight) < 0) {
    return { isValid: false, message: 'Weight tidak boleh negatif.' };
  }

  return { isValid: true, message: '' };
}
