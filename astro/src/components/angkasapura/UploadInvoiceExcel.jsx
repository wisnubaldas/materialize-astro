import { Icon } from '@iconify-icon/react';

import { useUploadInvoiceExcelLogic } from './upload-invoice-excel';

export default function UploadInvoiceExcel() {
  const {
    inputKey,
    isStartingUpload,
    feedback,
    feedbackClass,
    dropError,
    uploadResult,
    jobStatus,
    sseError,
    isSseFallbackActive,
    isSseConnected,
    isJobRunning,
    dropzoneClassName,
    selectedFileSummary,
    progress,
    sourceNotFoundInvoices,
    uploadErrors,
    statusPollingIntervalSeconds,
    getRootProps,
    getInputProps,
    isDragActive,
  } = useUploadInvoiceExcelLogic();

  return (
    <div className="row">
      <div className="col-md">
        <div className="card shadow-none bg-transparent border border-secondary mb-3">
          <h5 className="card-header">Upload Excel Invoice AP2</h5>
          <div className="card-body">
            <div className="row g-4">
              <div className="col-12 col-lg-4">
                <div
                  {...getRootProps({ className: dropzoneClassName })}
                  style={{
                    border: '2px dashed #6c757d',
                    borderRadius: '6px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    cursor: isStartingUpload || isJobRunning ? 'not-allowed' : 'pointer',
                    opacity: isStartingUpload || isJobRunning ? 0.7 : 1,
                    transition: 'border .24s ease-in-out',
                  }}
                >
                  <input key={inputKey} {...getInputProps({ name: 'invoiceExcel' })} />
                  <div className="dz-message needsclick">
                    {isDragActive
                      ? 'Lepaskan file untuk mengunggah'
                      : 'Tarik file Excel ke sini atau klik untuk memilih'}
                    <span className="note needsclick d-block mt-2">
                      Format: .xlsx, .xls, .xlsm (maks 10 MB)
                    </span>
                  </div>
                </div>

                {selectedFileSummary && (
                  <div className="mt-3 small text-muted">
                    <strong>File dipilih:</strong>
                    <div>{selectedFileSummary}</div>
                  </div>
                )}

                {(isStartingUpload || isJobRunning) && (
                  <div className="mt-3 small text-primary">
                    {isStartingUpload
                      ? 'Mengirim file ke server...'
                      : 'Proses upload sedang berjalan, jangan upload file lain dulu.'}
                  </div>
                )}

                {dropError && (
                  <div className="mt-3 alert alert-danger mb-0" role="alert">
                    {dropError}
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-8">
                <div
                  className={`card rounded-sm shadow-none bg-transparent border border-${feedbackClass}`}
                >
                  <div className="d-flex align-items-end row">
                    <div className="col-md-7 order-2 order-md-1">
                      <div className="card-body">
                        <h4 className={`card-title mb-2 text-${feedbackClass}`}>
                          {feedback.message}
                        </h4>
                        <div className="small text-muted mb-2">
                          Status: <strong>{jobStatus?.status || 'idle'}</strong>
                          {jobStatus?.job_id ? <span> | Job: {jobStatus.job_id}</span> : null}
                        </div>
                        {uploadResult && (
                          <div className="small">
                            <div>Inserted: {uploadResult.inserted ?? 0}</div>
                            <div>Skipped existing: {uploadResult.skipped_existing ?? 0}</div>
                            <div>
                              Skipped duplicate file: {uploadResult.skipped_duplicate_file ?? 0}
                            </div>
                            <div>Source not found: {sourceNotFoundInvoices.length}</div>
                            <div>Error rows: {uploadErrors.length}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-5 text-center text-md-end order-1 order-md-2">
                      <div className="card-body pb-0 px-0 px-md-4 ps-0">
                        <Icon
                          icon="vscode-icons:file-type-excel2"
                          width="96"
                          height="96"
                          className="position-absolute bottom-0 end-0 p-3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mt-3 border-primary">
                  <div className="card-body">
                    <div className="progress bg-label-primary">
                      <div
                        className={`progress-bar ${
                          isJobRunning
                            ? 'progress-bar-striped progress-bar-animated bg-primary'
                            : jobStatus?.status === 'failed'
                              ? 'bg-danger'
                              : jobStatus?.status === 'completed'
                                ? 'bg-success'
                                : 'bg-primary'
                        }`}
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        {progress}%
                      </div>
                    </div>
                    <div className="small mt-2 text-muted">
                      {jobStatus?.message || 'Menunggu upload file...'}
                    </div>
                    {isJobRunning && (
                      <div className="small mt-1 text-warning">
                        Notifikasi: proses upload masih berlangsung. Jangan upload file berikutnya
                        dulu.
                      </div>
                    )}
                    {sseError && <div className="small mt-1 text-danger">{sseError}</div>}
                    {isSseFallbackActive && !isSseConnected && (
                      <div className="small mt-1 text-warning">
                        Fallback polling aktif (setiap {statusPollingIntervalSeconds} detik)
                        sampai SSE tersambung kembali.
                      </div>
                    )}
                  </div>
                </div>

                {sourceNotFoundInvoices.length > 0 && (
                  <div className="card mt-3 border-warning">
                    <div className="card-body">
                      <h6 className="mb-2 text-warning">Invoice tidak ditemukan di source query</h6>
                      <div className="small">
                        {sourceNotFoundInvoices.slice(0, 50).map((invoice) => (
                          <div key={invoice}>{invoice}</div>
                        ))}
                        {sourceNotFoundInvoices.length > 50 && (
                          <div className="text-muted mt-2">
                            +{sourceNotFoundInvoices.length - 50} invoice lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {uploadErrors.length > 0 && (
                  <div className="card mt-3 border-danger">
                    <div className="card-body">
                      <h6 className="mb-2 text-danger">Detail error (maks 20 baris ditampilkan)</h6>
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Invoice</th>
                              <th>Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadErrors.slice(0, 20).map((item, index) => (
                              <tr key={`${item?.row ?? 'row'}-${item?.invoice ?? 'inv'}-${index}`}>
                                <td>{item?.row ?? '-'}</td>
                                <td>{item?.invoice ?? '-'}</td>
                                <td style={{ whiteSpace: 'pre-wrap' }}>{item?.error ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
