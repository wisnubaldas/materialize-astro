import { useMemo, useState } from 'react';
import { apiClient } from '@lib/api/client';
import { formatDateTime, showToast } from '@js/utils';

const extractResponseSummary = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {
      affectedRows: '-',
      message: '-',
      status: '-',
    };
  }

  return {
    affectedRows: payload.affected_rows ?? payload.affectedRows ?? '-',
    message: payload.message ?? '-',
    status: payload.status ?? '-',
  };
};

const getStatusBadgeClasses = (status) => {
  if (!status && status !== 0) {
    return 'bg-label-secondary border border-secondary text-body-secondary';
  }
  const normalized = String(status);
  if (normalized.startsWith('2')) {
    return 'bg-label-success border border-success text-success';
  }
  if (normalized.startsWith('4') || normalized.startsWith('5')) {
    return 'bg-label-danger border border-danger text-danger';
  }
  return 'bg-label-warning border border-warning text-warning';
};

const getTimelinePointVariant = (status) => {
  if (!status && status !== 0) {
    return 'secondary';
  }
  const normalized = String(status);
  if (normalized.startsWith('2')) {
    return 'success';
  }
  if (normalized.startsWith('4') || normalized.startsWith('5')) {
    return 'danger';
  }
  return 'warning';
};

export default function SearchInvoice() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const latestResponse = useMemo(() => (responses.length > 0 ? responses[0] : null), [responses]);
  const latestSummary = useMemo(
    () => extractResponseSummary(latestResponse?.response),
    [latestResponse]
  );
  const invoiceLabel = (latestResponse?.inv ?? invoiceNumber.trim()) || 'Tanpa Nomor';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedInvoice = invoiceNumber.trim();

    if (!trimmedInvoice) {
      showToast({
        type: 'danger',
        message: 'Mohon masukkan nomor invoice.',
        title: 'Search Invoice',
      });
      setError('Mohon masukkan nomor invoice.');
      setResponses([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setResponses([]);
    setHasSearched(true);

    try {
      const data = await apiClient.get(
        `/angkasapura/search-invoice-response/${encodeURIComponent(trimmedInvoice)}`
      );
      setResponses(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err?.message ??
        showToast({
          type: 'danger',
          message: 'Terjadi kesalahan saat mengambil data.',
          title: 'Search Invoice',
        });
      showToast({
        type: 'danger',
        message: message,
        title: 'Search Invoice',
      });
      setError(message);
      setResponses([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">Cari Response Invoice</h5>
        <p className="text-muted mb-0">
          Masukkan nomor invoice untuk menelusuri histori response yang diterima dari Angkasapura.
        </p>
      </div>
      <div className="col-md-12 col-xl-12">
        <div className="misc-wrapper">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center col-md-4">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Contoh: AP2-INV-0001"
                    value={invoiceNumber}
                    onChange={(event) => setInvoiceNumber(event.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Mencari...
                      </span>
                    ) : (
                      'Cari'
                    )}
                  </button>
                </div>
              </form>
              {isLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                    aria-hidden="true"
                  ></div>
                  <span>Mengambil data response invoice...</span>
                </div>
              ) : error ? (
                <div className="alert alert-warning mb-0" role="alert">
                  {error}
                </div>
              ) : responses.length > 0 ? (
                <div className="row g-4" id="activity-timeline">
                  <div className="col-12">
                    <div className="card h-100">
                      <div className="card-header">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                          <h5 className="mb-0">Activity Timeline</h5>
                          <span className="badge bg-label-primary border border-primary text-primary text-uppercase fw-semibold px-3 py-2 rounded-pill">
                            {invoiceLabel}
                          </span>
                        </div>
                        <div className="d-flex flex-wrap gap-3 small text-muted mt-3">
                          <div>
                            <span className="fw-semibold text-heading">Status Terbaru:</span>{' '}
                            {latestResponse?.status ?? '-'}
                          </div>
                          <div>
                            <span className="fw-semibold text-heading">Dibuat:</span>{' '}
                            {formatDateTime(latestResponse?.created_at)}
                          </div>
                          <div>
                            <span className="fw-semibold text-heading">Diupdate:</span>{' '}
                            {formatDateTime(latestResponse?.updated_at)}
                          </div>
                        </div>
                      </div>
                      <div className="card-body pt-4 shadow-none bg-transparent">
                        {latestSummary ? (
                          <div className="row row-cols-1 row-cols-sm-3 g-3 mb-4">
                            <div className="col">
                              <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                                HTTP Status
                              </small>
                              <span className="fs-6 fw-semibold text-heading">
                                {latestSummary.status}
                              </span>
                            </div>
                            <div className="col">
                              <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                                Affected Rows
                              </small>
                              <span className="fs-6 fw-semibold text-heading">
                                {latestSummary.affectedRows}
                              </span>
                            </div>
                            <div className="col">
                              <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                                Pesan
                              </small>
                              <span className="d-block text-body">{latestSummary.message}</span>
                            </div>
                          </div>
                        ) : null}
                        <div class="divider text-start">
                          <div class="divider-text">Start</div>
                        </div>
                        <ul className="timeline timeline-outline mb-0">
                          {responses.map((item, index) => {
                            const summary = extractResponseSummary(item.response);
                            const isLatest = index === 0;
                            return (
                              <li
                                key={item.id ?? `${item.inv}-${index}`}
                                className="timeline-item timeline-item-transparent border-dashed border-start border-info"
                              >
                                <span
                                  className={`timeline-point timeline-point-${getTimelinePointVariant(
                                    item.status
                                  )}`}
                                ></span>
                                <div className="timeline-event">
                                  <div className="timeline-header mb-1">
                                    <h6 className="mb-0 d-flex flex-wrap align-items-center gap-2">
                                      <span>
                                        {summary.message
                                          ? summary.message
                                          : 'Tidak ada pesan tambahan.'}
                                      </span>
                                      {isLatest ? (
                                        <span className="badge bg-label-primary border border-primary text-primary">
                                          Terbaru
                                        </span>
                                      ) : null}
                                    </h6>
                                  </div>
                                  <div className="row row-cols-1 row-cols-md-4 g-2 small mb-1">
                                    <div className="col">
                                      <span className="fw-semibold text-heading d-block">
                                        HTTP Status
                                      </span>
                                      {summary.status}
                                    </div>
                                    <div className="col">
                                      <span className="fw-semibold text-heading d-block">
                                        Affected Rows
                                      </span>
                                      {summary.affectedRows}
                                    </div>
                                    <div className="col">
                                      <span className="fw-semibold text-heading d-block">
                                        Diupdate
                                      </span>
                                      {formatDateTime(item.updated_at)}
                                    </div>
                                    <div className="col">
                                      <span className="fw-semibold text-heading d-block">
                                        ID Respons
                                      </span>
                                      {item.id ?? '-'}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : hasSearched ? (
                <div className="text-center py-5 text-muted">
                  Tidak ada histori response untuk nomor invoice tersebut.
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  Masukkan nomor invoice dan tekan tombol cari untuk melihat histori response yang
                  tersimpan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
