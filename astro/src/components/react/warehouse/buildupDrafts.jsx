import { formatDateTime, showToast } from '@utils';
import warehouseClient from '@lib/api/warehouse';
import { useMemo, useState } from 'react';
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

const mergeDraftPayloads = (drafts) => {
  const payload = {
    flight_manifest: [],
    uld: [],
    mawb: [],
  };

  let invalidDraftCount = 0;

  drafts.forEach((draft) => {
    if (!hasValidPayload(draft?.payload)) {
      invalidDraftCount += 1;
      return;
    }

    payload.flight_manifest.push(...draft.payload.flight_manifest);
    payload.uld.push(...draft.payload.uld);
    payload.mawb.push(...draft.payload.mawb);
  });

  return { payload, invalidDraftCount };
};

export default function BuildupDrafts({
  drafts = [],
  onRemoveDraft = () => {},
  onSubmittedAllDrafts = () => {},
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const aggregateSummary = useMemo(() => mergeDraftPayloads(drafts), [drafts]);

  const handleSubmitAllDrafts = async () => {
    if (!drafts.length) {
      showToast({
        type: 'warning',
        title: 'Draft Manifest',
        message: 'Belum ada draft untuk disubmit.',
      });
      return;
    }

    if (aggregateSummary.invalidDraftCount > 0) {
      showToast({
        type: 'warning',
        title: 'Draft Manifest',
        message: `Terdapat ${aggregateSummary.invalidDraftCount} draft tidak valid. Hapus draft tersebut sebelum submit.`,
      });
      return;
    }

    if (!hasValidPayload(aggregateSummary.payload)) {
      showToast({
        type: 'warning',
        title: 'Draft Manifest',
        message: 'Payload gabungan draft tidak valid untuk submit.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify(aggregateSummary.payload));
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

      onSubmittedAllDrafts(response);
      emitManifestUploaded(response);
    } catch (error) {
      const message = resolveErrorMessage(error, 'Gagal submit draft manifest.');
      showToast({
        type: 'danger',
        title: 'Draft Manifest',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = (draftId) => {
    const confirmDelete = !isBrowser()
      ? true
      : window.confirm('Hapus draft ini? Draft yang dihapus tidak bisa dikembalikan.');

    if (!confirmDelete) {
      return;
    }

    onRemoveDraft(draftId);
    showToast({
      type: 'success',
      title: 'Draft Manifest',
      message: 'Draft berhasil dihapus.',
    });
  };

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
          {drafts.length} draft | {aggregateSummary.payload.flight_manifest.length} flight |{' '}
          {aggregateSummary.payload.uld.length} ULD | {aggregateSummary.payload.mawb.length} MAWB
        </div>
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={handleSubmitAllDrafts}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Manifest'}
        </button>
      </div>

      {drafts.map((draft, index) => {
        const createdAtLabel = formatDateTime(draft.createdAt);
        const awbPreview = Array.isArray(draft.masterAwbs) ? draft.masterAwbs.slice(0, 5) : [];

        return (
          <div className="card border" key={draft.id}>
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                <div>
                  <h6 className="mb-1 fw-bold">Draft #{index + 1}</h6>
                  <div className="small text-muted">Dibuat: {createdAtLabel}</div>
                  <div className="small text-muted">{buildSummaryText(draft)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteDraft(draft.id)}
                  disabled={isSubmitting}
                >
                  Hapus Draft
                </button>
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
    </div>
  );
}

