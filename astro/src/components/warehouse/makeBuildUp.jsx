import { Icon } from '@iconify-icon/react';
import { API_BASE_URL } from '@lib/api/client';
import warehouseClient from '@lib/api/warehouse';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_MESSAGE = 'Upload file FedEx manifest (.xlsx) untuk simpan data dan cetak PDF.';

export default function MakeBuildUp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(() => ({
    variant: 'info',
    message: DEFAULT_MESSAGE,
  }));
  const [dropError, setDropError] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const [pdfInfo, setPdfInfo] = useState(null);

  const handleUpload = useCallback(async (file) => {
    setIsUploading(true);
    setDropError(null);
    setPdfInfo(null);
    setFeedback({ variant: 'info', message: 'Mengunggah file...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await warehouseClient.uploadFedexManifest(formData);
      const successMessage =
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
          ? response.message
          : 'File berhasil diunggah.';

      const pdfUrl =
        response &&
        typeof response === 'object' &&
        'pdf_url' in response &&
        typeof response.pdf_url === 'string'
          ? response.pdf_url
          : null;
      const pdfFilename =
        response &&
        typeof response === 'object' &&
        'pdf_filename' in response &&
        typeof response.pdf_filename === 'string'
          ? response.pdf_filename
          : 'fedex_manifest.pdf';

      if (pdfUrl) {
        setPdfInfo({ url: pdfUrl, filename: pdfFilename });
      }

      setFeedback({ variant: 'success', message: successMessage });
      setSelectedFile(null);
      setInputKey((prev) => prev + 1);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('manifest-uploaded', { detail: { response } })
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal mengunggah file. Silakan coba kembali.';
      try {
        const parsed = JSON.parse(errorMessage);
        setFeedback({ variant: 'danger', message: parsed.detail?.message || parsed.detail });
      } catch (parseError) {
        setFeedback({ variant: 'danger', message: errorMessage });
      }
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
    const message = messages.join(', ');

    setDropError(message || 'File tidak valid.');
    setFeedback({ variant: 'danger', message: message || 'File tidak valid.' });
    setSelectedFile(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
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

  const handleDownloadPdf = useCallback(() => {
    if (!pdfInfo?.url) {
      return;
    }
    const absoluteUrl = pdfInfo.url.startsWith('http')
      ? pdfInfo.url
      : `${API_BASE_URL}${pdfInfo.url}`;
    window.open(absoluteUrl, '_blank');
  }, [pdfInfo]);

  const dropzoneClassName = `dropzone needsclick${isDragActive ? ' dz-drag-hover' : ''}`;
  const feedbackTextClass =
    feedback.variant === 'success'
      ? 'success'
      : feedback.variant === 'danger'
      ? 'danger'
      : 'primary';
  const dropzoneStyle = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border .24s ease-in-out',
  };

  return (
    <div className="row">
      <div className="col-md">
        <div className="card shadow-none bg-transparent border border-secondary mb-3">
          <h5 className="card-header">Upload FedEx manifest</h5>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 col-xl-4 col-sm-12 ">
                <div {...getRootProps({ className: dropzoneClassName })} style={dropzoneStyle}>
                  <input key={inputKey} {...getInputProps({ name: 'fedexManifestExcel' })} />
                  <div className="dz-message needsclick">
                    {isDragActive
                      ? 'Lepaskan berkas untuk mengunggah'
                      : 'Letakkan file di sini atau klik untuk mengunggah'}
                    <span className="note needsclick d-block mt-1">
                      Format: .xlsx, .xlsm (maks 5 MB)
                    </span>
                  </div>
                </div>

                {selectedFileSummary && (
                  <div className="mt-3 small text-muted">
                    <strong>File dipilih:</strong>
                    <div>{selectedFileSummary}</div>
                  </div>
                )}

                {isUploading && <div className="mt-3 small text-primary">Mengunggah file...</div>}

                {dropError && (
                  <div className="mt-3 alert alert-danger mb-0" role="alert">
                    {dropError}
                  </div>
                )}

                {pdfInfo && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary mt-3"
                    onClick={handleDownloadPdf}
                  >
                    Download PDF Manifest
                  </button>
                )}
              </div>

              <div className="col-md-8 col-xl-8 col-sm-12">
                <div
                  className={`card h-100 rounded-sm shadow-none bg-transparent border border-${feedbackTextClass} `}
                >
                  <div className="d-flex align-items-end row">
                    <div className="col-md-6 order-2 order-md-1">
                      <div className="card-body">
                        <h4 className={`card-title col-10 mb-0 text-${feedbackTextClass}`}>
                          {feedback.message}
                        </h4>
                      </div>
                    </div>
                    <div className="col-md-6 text-center text-md-end order-1 order-md-2">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
