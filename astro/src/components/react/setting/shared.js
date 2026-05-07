export const normalizeCollection = (value) => (Array.isArray(value) ? value : []);

export const resolveErrorMessage = (error, fallback) => error?.message ?? fallback;

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
