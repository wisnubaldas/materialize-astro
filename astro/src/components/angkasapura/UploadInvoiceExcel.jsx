import { Icon } from '@iconify-icon/react';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { angkasapuraApi } from '@lib/api/angkasapuraApi';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const DEFAULT_MESSAGE = 'Unggah file Excel invoice AP2 untuk diproses ke tabel inv_ap2.';

const parseUploadErrorMessage = (error) => {
  const fallback = 'Gagal mengunggah file. Silakan coba kembali.';
  const rawMessage = error instanceof Error ? error.message : fallback;

  if (!rawMessage) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed?.detail?.message) {
      return String(parsed.detail.message);
    }
    if (parsed?.detail && typeof parsed.detail === 'string') {
      return parsed.detail;
    }
    if (parsed?.message && typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch (parseError) {
    // fallback ke raw message
  }

  return rawMessage;
};

export default function UploadInvoiceExcel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(() => ({
    variant: 'info',
    message: DEFAULT_MESSAGE,
  }));
  const [dropError, setDropError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [inputKey, setInputKey] = useState(0);

  const handleUpload = useCallback(async (file) => {
    setIsUploading(true);
    setDropError(null);
    setUploadResult(null);
    setFeedback({ variant: 'info', message: 'Mengunggah file invoice...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await angkasapuraApi.uploadInvoiceExcel(formData);
      setUploadResult(response);

      const inserted = Number(response?.inserted ?? 0);
      const skippedExisting = Number(response?.skipped_existing ?? 0);
      const skippedDuplicateFile = Number(response?.skipped_duplicate_file ?? 0);
      const sourceNotFoundCount = Array.isArray(response?.source_not_found_invoices)
        ? response.source_not_found_invoices.length
        : 0;

      const statusMessage =
        response?.message ||
        `Selesai. Inserted: ${inserted}, existing: ${skippedExisting}, duplicate file: ${skippedDuplicateFile}.`;

      if (inserted > 0 && sourceNotFoundCount === 0) {
        setFeedback({ variant: 'success', message: statusMessage });
      } else if (inserted > 0 || sourceNotFoundCount > 0) {
        setFeedback({ variant: 'warning', message: statusMessage });
      } else {
        setFeedback({ variant: 'danger', message: statusMessage });
      }

      setSelectedFile(null);
      setInputKey((prev) => prev + 1);
    } catch (error) {
      setFeedback({
        variant: 'danger',
        message: parseUploadErrorMessage(error),
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles.length) {
        return;
      }
      const [file] = acceptedFiles;
      setSelectedFile(file);
      handleUpload(file);
    },
    [handleUpload]
  );

  const onDropRejected = useCallback((rejections) => {
    if (!rejections.length) {
      return;
    }

    const messages = [];
    rejections.forEach((rejection) => {
      rejection.errors.forEach((err) => {
        if (err?.message) {
          messages.push(err.message);
        }
      });
    });

    const message = messages.join(', ') || 'File tidak valid.';
    setDropError(message);
    setFeedback({ variant: 'danger', message });
    setSelectedFile(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
    },
    maxSize: MAX_UPLOAD_SIZE,
  });

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) {
      return '';
    }

    const sizeInKB = selectedFile.size / 1024;
    const formattedSize =
      sizeInKB >= 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB.toFixed(2)} KB`;

    return `${selectedFile.name} - ${formattedSize}`;
  }, [selectedFile]);

  const feedbackClass =
    feedback.variant === 'success'
      ? 'success'
      : feedback.variant === 'warning'
      ? 'warning'
      : feedback.variant === 'danger'
      ? 'danger'
      : 'primary';

  const dropzoneClassName = `dropzone needsclick${isDragActive ? ' dz-drag-hover' : ''}`;
  const sourceNotFoundInvoices = Array.isArray(uploadResult?.source_not_found_invoices)
    ? uploadResult.source_not_found_invoices
    : [];
  const uploadErrors = Array.isArray(uploadResult?.errors) ? uploadResult.errors : [];

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
                    cursor: 'pointer',
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

                {isUploading && <div className="mt-3 small text-primary">Sedang memproses upload...</div>}

                {dropError && (
                  <div className="mt-3 alert alert-danger mb-0" role="alert">
                    {dropError}
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-8">
                <div className={`card rounded-sm shadow-none bg-transparent border border-${feedbackClass}`}>
                  <div className="d-flex align-items-end row">
                    <div className="col-md-7 order-2 order-md-1">
                      <div className="card-body">
                        <h4 className={`card-title mb-2 text-${feedbackClass}`}>{feedback.message}</h4>
                        {uploadResult && (
                          <div className="small">
                            <div>Inserted: {uploadResult.inserted ?? 0}</div>
                            <div>Skipped existing: {uploadResult.skipped_existing ?? 0}</div>
                            <div>Skipped duplicate file: {uploadResult.skipped_duplicate_file ?? 0}</div>
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

