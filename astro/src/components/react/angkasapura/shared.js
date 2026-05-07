export const isBrowser = () => typeof window !== 'undefined';

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const resolveErrorMessage = (error, fallback) =>
  error instanceof Error && error.message ? error.message : fallback;

export const resolveApiErrorMessage = (error, fallback) => {
  const message = resolveErrorMessage(error, fallback);
  try {
    const parsed = JSON.parse(message);
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
    return message;
  }
  return message;
};

export const collectDropzoneErrors = (rejections) => {
  if (!Array.isArray(rejections) || !rejections.length) {
    return 'File tidak valid.';
  }

  const messages = [];
  rejections.forEach((rejection) => {
    rejection.errors?.forEach((err) => {
      if (err?.message) {
        messages.push(err.message);
      }
    });
  });

  return messages.join(', ') || 'File tidak valid.';
};

export const formatFileSize = (file) => {
  if (!file) {
    return '';
  }

  const sizeInKB = Number(file.size || 0) / 1024;
  const formattedSize =
    sizeInKB >= 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB.toFixed(2)} KB`;

  return `${file.name} - ${formattedSize}`;
};

export const parseUploadError = (error, fallback) => {
  const message = resolveApiErrorMessage(error, fallback);
  const rawMessage = resolveErrorMessage(error, fallback);

  try {
    const parsed = JSON.parse(rawMessage);
    const detail = parsed?.detail;
    const jobStatus =
      detail?.job_status && typeof detail.job_status === 'object' ? detail.job_status : null;
    return { message, jobStatus };
  } catch {
    return { message, jobStatus: null };
  }
};
