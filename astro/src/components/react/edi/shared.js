import Swal from 'sweetalert2';

export const resolveErrorMessage = (error, fallback) => {
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.detail?.message) {
        return parsed.detail.message;
      }
      if (typeof parsed?.detail === 'string') {
        return parsed.detail;
      }
      if (typeof parsed?.message === 'string') {
        return parsed.message;
      }
    } catch {
      return error.message;
    }
    return error.message;
  }
  return fallback;
};

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const boolBadge = (
  value,
  type,
  {
    trueLabel = 'Ya',
    falseLabel = 'Tidak',
    trueClass = 'bg-label-success',
    falseClass = 'bg-label-secondary',
  } = {}
) => {
  if (type !== 'display') {
    return value;
  }

  const isTrue = value === true || value === 1 || value === '1' || value === 'true';
  const label = isTrue ? trueLabel : falseLabel;
  const theme = isTrue ? trueClass : falseClass;
  return `<span class="badge rounded-pill ${theme} px-2">${label}</span>`;
};

/**
 * Prompt the user for an email address using SweetAlert2.
 * @param {string} [title='Email Send'] - The title of the alert.
 * @param {string} [defaultValue=''] - The default prefilled email value.
 * @returns {Promise<string>} The email address entered by the user, or empty string.
 */
export const promptEmailAddress = async (title = 'Email Send', defaultValue = '') => {
  const result = await Swal.fire({
    title,
    theme: 'bootstrap-5',
    input: 'email',
    inputPlaceholder: 'Email tujuan',
    inputValue: defaultValue,
  });

  return String(result?.value ?? '').trim();
};
