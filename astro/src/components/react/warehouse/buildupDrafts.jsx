import warehouseClient from '@lib/api/warehouse';
import { formatDateTime, showToast } from '@utils';
import { useMemo, useState } from 'react';
import BuildupForm from './buildupForm';
import { emitManifestUploaded, isBrowser, resolveErrorMessage } from './shared';

const hasValidPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return (
    Array.isArray(payload.flight_manifest) &&
    payload.flight_manifest.length > 0 &&
    Array.isArray(payload.uld) &&
    payload.uld.length > 0 &&
    Array.isArray(payload.mawb) &&
    payload.mawb.length > 0
  );
};

const buildSummaryText = (draft) => {
  const payload = draft?.payload ?? {};
  const manifestCount = Array.isArray(payload.flight_manifest) ? payload.flight_manifest.length : 0;
  const uldCount = Array.isArray(payload.uld) ? payload.uld.length : 0;
  const mawbCount = Array.isArray(payload.mawb) ? payload.mawb.length : 0;
  return `${manifestCount} flight | ${uldCount} ULD | ${mawbCount} MAWB`;
};

const countDraftPayloads = (drafts) =>
  drafts.reduce(
    (summary, draft) => {
      const payload = draft?.payload ?? {};
      return {
        flightManifestCount:
          summary.flightManifestCount +
          (Array.isArray(payload.flight_manifest) ? payload.flight_manifest.length : 0),
        uldCount: summary.uldCount + (Array.isArray(payload.uld) ? payload.uld.length : 0),
        mawbCount: summary.mawbCount + (Array.isArray(payload.mawb) ? payload.mawb.length : 0),
      };
    },
    { flightManifestCount: 0, uldCount: 0, mawbCount: 0 }
  );

export default function BuildupDrafts({
  drafts = [],
  isLoading = false,
  onRemoveDraft = () => {},
  onUpdateDraft = async () => {},
  onSubmittedDraft = async () => {},
}) {
  const [submittingDraftId, setSubmittingDraftId] = useState(null);
  const [deletingDraftId, setDeletingDraftId] = useState(null);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const aggregateSummary = useMemo(() => countDraftPayloads(drafts), [drafts]);
  const editingDraft = useMemo(
    () => drafts.find((draft) => draft.id === editingDraftId) ?? null,
    [drafts, editingDraftId]
  );

  const handleSubmitDraft = async (draft) => {
    if (!hasValidPayload(draft?.payload)) {
      showToast({
        type: 'warning',
        title: 'Draft Manifest',
        message: 'Payload draft tidak valid untuk submit.',
      });
      return;
    }

    setSubmittingDraftId(draft.id);
    try {
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify(draft.payload));
      const response = await warehouseClient.submitFedexManifest(formData);

      const successMessage =
        response && typeof response === 'object' && 'message' in response
          ? response.message
          : 'Submit manifest berhasil.';

      showToast({
        type: 'success',
        title: 'Draft Manifest',
        message: successMessage,
      });

      emitManifestUploaded(response);
      try {
        await onSubmittedDraft(draft.id, response);
      } catch (cleanupError) {
        const message = resolveErrorMessage(
          cleanupError,
          'Manifest berhasil disubmit, tetapi draft belum berhasil dibersihkan.'
        );
        showToast({
          type: 'warning',
          title: 'Draft Manifest',
          message,
        });
      }
    } catch (error) {
      const message = resolveErrorMessage(error, 'Gagal submit draft manifest.');
      showToast({
        type: 'danger',
        title: 'Draft Manifest',
        message,
      });
    } finally {
      setSubmittingDraftId(null);
    }
  };

  const handleDeleteDraft = async (draftId) => {
    const confirmDelete = !isBrowser()
      ? true
      : window.confirm('Hapus draft ini? Draft yang dihapus tidak bisa dikembalikan.');

    if (!confirmDelete) {
      return;
    }

    setDeletingDraftId(draftId);
    try {
      await onRemoveDraft(draftId);
      showToast({
        type: 'success',
        title: 'Draft Manifest',
        message: 'Draft berhasil dihapus.',
      });
    } catch (error) {
      const message = resolveErrorMessage(error, 'Gagal menghapus draft manifest.');
      showToast({
        type: 'danger',
        title: 'Draft Manifest',
        message,
      });
    } finally {
      setDeletingDraftId(null);
    }
  };

  const handleStartEdit = (draftId) => {
    setEditingDraftId(draftId);
  };

  const handleCloseEdit = () => {
    setEditingDraftId(null);
  };

  const handleUpdateDraft = async (nextDraftPayload) => {
    if (!editingDraftId) {
      return;
    }

    await onUpdateDraft(editingDraftId, nextDraftPayload);
    setEditingDraftId(null);
  };

  if (isLoading) {
    return (
      <div className="alert alert-secondary mb-0" role="alert">
        Memuat draft manifest...
      </div>
    );
  }

  if (!drafts.length) {
    return (
      <div className="alert alert-info mb-0" role="alert">
        Belum ada draft manifest. Simpan draft dari tab <strong>Cari Master AWB</strong>.
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="small text-muted">
          {drafts.length} draft | {aggregateSummary.flightManifestCount} flight |{' '}
          {aggregateSummary.uldCount} ULD | {aggregateSummary.mawbCount} MAWB
        </div>
      </div>

      {drafts.map((draft, index) => {
        const createdAtLabel = formatDateTime(draft.createdAt);
        const awbPreview = Array.isArray(draft.masterAwbs) ? draft.masterAwbs.slice(0, 5) : [];
        const isSubmitting = submittingDraftId === draft.id;
        const isDeleting = deletingDraftId === draft.id;
        const isBusy = isSubmitting || isDeleting;

        return (
          <div className="card border" key={draft.id}>
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                <div>
                  <h6 className="mb-1 fw-bold">Draft #{index + 1}</h6>
                  <div className="small text-muted">Dibuat: {createdAtLabel}</div>
                  <div className="small text-muted">{buildSummaryText(draft)}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => handleSubmitDraft(draft)}
                    disabled={isBusy}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Draft'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleStartEdit(draft.id)}
                    disabled={isBusy}
                  >
                    Edit Draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteDraft(draft.id)}
                    disabled={isBusy}
                  >
                    {isDeleting ? 'Menghapus...' : 'Hapus Draft'}
                  </button>
                </div>
              </div>

              <div className="small text-muted">
                Master AWB: {awbPreview.length ? awbPreview.join(', ') : '-'}
                {Array.isArray(draft.masterAwbs) && draft.masterAwbs.length > awbPreview.length
                  ? ` (+${draft.masterAwbs.length - awbPreview.length} lainnya)`
                  : ''}
              </div>
            </div>
          </div>
        );
      })}

      {editingDraft ? (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(17, 24, 39, 0.55)' }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Draft Manifest</h5>
                <button type="button" className="btn-close" onClick={handleCloseEdit}></button>
              </div>
              <div className="modal-body p-0">
                <BuildupForm
                  onSaveDraft={handleUpdateDraft}
                  initialRows={editingDraft.rows ?? []}
                  initialMasterAwbs={editingDraft.masterAwbs ?? []}
                  heading={null}
                  description={null}
                  saveButtonLabel="Update Draft"
                  saveToastMessage="Draft berhasil diperbarui."
                  onCancel={handleCloseEdit}
                  showSearchButton={false}
                  prefillSearchInput={false}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
