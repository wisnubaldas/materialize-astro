export const DRAFT_STORAGE_KEY = 'warehouse_manifest_drafts_v1';

export const isBrowser = () => typeof window !== 'undefined';

export const resolveErrorMessage = (error, fallback) => (error instanceof Error ? error.message : fallback);

export const createDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const readStoredDrafts = () => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const writeStoredDrafts = (drafts) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(Array.isArray(drafts) ? drafts : []));
};

export const clearStoredDrafts = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
};

export const emitManifestUploaded = (response) => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent('manifest-uploaded', { detail: { response } }));
};
