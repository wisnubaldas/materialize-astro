import { Icon } from '@iconify-icon/react';
import { hubnetApi } from '@lib/api/hubnetApi';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { collectDropzoneErrors, formatFileSize, resolveApiErrorMessage } from './shared';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_MESSAGE = 'Sesuaikan kolom-kolom di excel sebelum mengunggah.';

export default function UploadExcel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(() => ({
    variant: 'info',
    message: DEFAULT_MESSAGE,
  }));
  const [dropError, setDropError] = useState(null);
  const [inputKey, setInputKey] = useState(0);

  const handleUpload = useCallback(async (file) => {
    setIsUploading(true);
    setDropError(null);
    setFeedback({ variant: 'info', message: 'Mengunggah file...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await hubnetApi.uploadOutgoing(formData);
      const successMessage =
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
          ? response.message
          : 'File berhasil diunggah.';

      setFeedback({ variant: 'success', message: successMessage });
      setSelectedFile(null);
      setInputKey((prev) => prev + 1);
    } catch (error) {
      const errorMessage = resolveApiErrorMessage(
        error,
        'Gagal mengunggah file. Silakan coba kembali.'
      );
      setFeedback({ variant: 'danger', message: errorMessage });
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
    const message = collectDropzoneErrors(rejections);

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
    },
    maxSize: MAX_UPLOAD_SIZE,
  });

  const selectedFileSummary = useMemo(() => {
    return formatFileSize(selectedFile);
  }, [selectedFile]);

  const dropzoneClassName = `dropzone needsclick${isDragActive ? ' dz-drag-hover' : ''}`;
  const feedbackTextClass =
    feedback.variant === 'success'
      ? 'success'
      : feedback.variant === 'danger'
      ? 'danger'
      : 'primary';
  const dropzoneStyle = {
    border: '2px dashed oklch(37.2% 0.044 257.287)',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border .24s ease-in-out',
    fontSize: '20px',
    backgroundColor: 'oklch(96.8% 0.007 247.896)',
  };
  return (
    <div className="row">
      <div className="col-md">
        <div className="card shadow-none bg-transparent border border-secondary mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 col-xl-4 col-sm-12">
                <div {...getRootProps({ className: dropzoneClassName })} style={dropzoneStyle}>
                  <input key={inputKey} {...getInputProps({ name: 'manifestExcel' })} />
                  <div className="dz-message needsclick">
                    {isDragActive
                      ? 'Lepaskan berkas untuk mengunggah'
                      : 'Letakkan file di sini atau klik untuk mengunggah'}
                    <span className="note needsclick d-block mt-1">
                      Format: .xlsx, .xls (maks 5 MB)
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
