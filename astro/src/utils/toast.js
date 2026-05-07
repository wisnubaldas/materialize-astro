export const showToast = (data) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent('toast', { detail: data }));
};
