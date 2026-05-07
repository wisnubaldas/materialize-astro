import 'sweetalert2/dist/sweetalert2.min.css';

let swalPromise;
const SWEET_ALERT_BOOTSTRAP_STYLE_ID = 'sweet-alert-bootstrap-style';

const ensureSweetAlertBootstrapStyle = () => {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(SWEET_ALERT_BOOTSTRAP_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = SWEET_ALERT_BOOTSTRAP_STYLE_ID;
  style.textContent = `
    .swal2-popup {
      border-radius: .5rem;
    }
    .swal2-actions {
      gap: .5rem;
    }
    .swal2-actions .btn {
      margin: 0 !important;
    }
    .swal2-actions .btn:focus {
      box-shadow: 0 0 0 .25rem rgba(13,110,253,.25);
    }
  `;
  document.head.appendChild(style);
};

const DEFAULT_ALERT_OPTIONS = {
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'border-0 shadow-sm',
    actions: 'd-flex flex-wrap justify-content-center',
    confirmButton: 'btn btn-primary',
    cancelButton: 'btn btn-outline-secondary',
    denyButton: 'btn btn-secondary',
  },
};

const mergeAlertOptions = (options = {}) => ({
  ...DEFAULT_ALERT_OPTIONS,
  ...options,
  customClass: {
    ...DEFAULT_ALERT_OPTIONS.customClass,
    ...(options.customClass ?? {}),
  },
});

export const getSwal = async () => {
  if (!swalPromise) {
    swalPromise = import('sweetalert2').then(
      (module) => module.default
    );
  }
  return swalPromise;
};

export const showSweetAlert = async (options = {}) => {
  ensureSweetAlertBootstrapStyle();
  const Swal = await getSwal();
  return Swal.fire(mergeAlertOptions(options));
};

export const showConfirmAlert = async (options = {}) => {
  const {
    title = 'Konfirmasi',
    text = 'Apakah Anda yakin ingin melanjutkan?',
    confirmButtonText = 'Ya, lanjutkan',
    cancelButtonText = 'Batal',
    icon = 'warning',
    ...rest
  } = options;

  const result = await showSweetAlert({
    icon,
    title,
    text,
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText,
    cancelButtonText,
    ...rest,
  });

  return Boolean(result?.isConfirmed);
};

