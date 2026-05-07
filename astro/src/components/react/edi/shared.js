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

export const promptEmailAddress = async (title = 'Email Send') => {
  const result = await Swal.fire({
    title,
    theme: 'bootstrap-5',
    input: 'email',
    inputPlaceholder: 'Email tujuan',
  });

  return String(result?.value ?? '').trim();
};
