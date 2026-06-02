import GridData from '@components/GridData';
import { API_BASE_URL, apiClient } from '@lib/api/client.js';
import { getAccessToken } from '@lib/auth/token.js';
import { showToast } from '@utils';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { boolBadge } from '../edi/shared.js';
import CardPages from '../ui/CardPages.jsx';
// Helper to format date
const dateRenderer = (value, type, format = 'DD MMM YYYY') => {
  if (type !== 'display' && type !== 'filter') {
    return value;
  }
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(format) : value;
};

const createDefaultFilters = () => ({
  uld: '',
  airlines: '',
  flight_no: '',
  flight_date: '',
  dest: '',
  mawb: '',
});

const setPdfButtonLoading = (button, isLoading, label = 'Menyiapkan') => {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${label}`;
    return;
  }
  button.disabled = false;
  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
  }
};

export default function BuildUpListDatatables() {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);
  const preparingPdfRef = useRef(new Set());

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);

  useEffect(() => {
    const api = tableRef.current;
    if (!api?.reload) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    api.reload(true);
  }, [activeFilters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = (event) => {
    event?.preventDefault?.();
    setActiveFilters({ ...formFilters });
  };

  const handleReset = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

  const handlePreparePdf = useCallback(async (id, type, button, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!id) return;

    const token = getAccessToken();
    if (!token) {
      showToast({
        type: 'danger',
        title: 'Build Up PDF',
        message: 'Sesi login tidak ditemukan. Silakan login ulang.',
      });
      return;
    }

    const isManifest = type === 'manifest';
    const requestKey = `${type}:${id}`;
    if (preparingPdfRef.current.has(requestKey)) {
      showToast({
        type: 'info',
        title: 'Build Up PDF',
        message: 'PDF sedang disiapkan. Mohon tunggu proses sebelumnya selesai.',
      });
      return;
    }

    preparingPdfRef.current.add(requestKey);
    const endpoint = `/warehouse/build-up-check-headers/${id}/pdf-${type}/prepare`;
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.title = 'Menyiapkan PDF Build Up';
      pdfWindow.document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <strong>Menyiapkan PDF ${isManifest ? 'Manifest' : 'Checklist'}...</strong>
          <p>Mohon tunggu sebentar.</p>
        </div>
      `;
    }
    setPdfButtonLoading(button, true, isManifest ? 'Manifest' : 'Checklist');

    try {
      const result = await apiClient.post(endpoint, null, { timeoutMs: 60000 });
      const pdfPath = result?.pdf_path;
      if (!pdfPath) {
        throw new Error('Backend tidak mengembalikan URL PDF.');
      }

      const separator = pdfPath.includes('?') ? '&' : '?';
      const url = `${API_BASE_URL}${pdfPath}${separator}token=${encodeURIComponent(token)}`;
      if (pdfWindow) {
        pdfWindow.location.replace(url);
      } else {
        showToast({
          type: 'warning',
          title: 'Build Up PDF',
          message: 'Browser memblokir tab baru. Izinkan pop-up untuk membuka PDF.',
        });
      }
    } catch (err) {
      pdfWindow?.close?.();
      console.error('[build-up][prepare-pdf]', err);
      showToast({
        type: 'danger',
        title: 'Build Up PDF',
        message: err?.message || 'Gagal menyiapkan PDF Build Up.',
      });
    } finally {
      preparingPdfRef.current.delete(requestKey);
      setPdfButtonLoading(button, false);
    }
  }, []);

  const reloadTable = useCallback((resetPaging = false) => {
    tableRef.current?.reload?.(resetPaging);
  }, []);

  const handleDelete = useCallback(
    async (id, rowData) => {
      const uldName = rowData?.uld || '';
      const result = await Swal.fire({
        title: 'Hapus data build up?',
        text: `Data build up kargo${uldName ? ' ULD ' + uldName : ''} akan dihapus secara permanen beserta semua detail MAWB dan rincian koli di dalamnya.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal',
      });

      if (!result.isConfirmed) return;

      try {
        await apiClient.delete(`/warehouse/build-up-check-headers/${id}`);
        showToast({
          type: 'success',
          title: 'Build Up',
          message: 'Data build up berhasil dihapus.',
        });
        reloadTable(false);
      } catch (err) {
        const errorMsg = err?.message || 'Gagal menghapus data build up.';
        showToast({
          type: 'danger',
          title: 'Build Up',
          message: errorMsg,
        });
      }
    },
    [reloadTable]
  );

  useEffect(() => {
    const api = tableRef.current?.dt?.();
    if (!api?.table) {
      return undefined;
    }

    const tableNode = api.table().node();
    if (!tableNode) {
      return undefined;
    }

    const resolveRowData = (rowElement) => {
      if (!rowElement) {
        return null;
      }
      const isChild = rowElement.classList?.contains('child');
      const parentRow = isChild ? rowElement.previousSibling : rowElement;
      return parentRow ? api.row(parentRow).data() : null;
    };

    const handleClick = (event) => {
      const target = event.target?.closest?.('button[data-action]');
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const action = target.getAttribute('data-action');
      const id = Number(target.getAttribute('data-id'));
      if (!id) {
        return;
      }

      const row = target.closest('tr');
      const rowData = resolveRowData(row);

      if (action === 'print-manifest') {
        handlePreparePdf(id, 'manifest', target, event);
      } else if (action === 'print-checklist') {
        handlePreparePdf(id, 'checklist', target, event);
      } else if (action === 'delete-buildup') {
        handleDelete(id, rowData);
      }
    };

    tableNode.addEventListener('click', handleClick);
    return () => {
      tableNode.removeEventListener('click', handleClick);
    };
  }, [handlePreparePdf, handleDelete]);

  const columns = useMemo(
    () => [
      {
        data: 'uld',
        title: 'ULD',
        className: 'text-uppercase fw-semibold',
        render: (value) => {
          return `<a href="#" class="btn btn-sm btn-text-primary">${value}</a>`;
        },
      },
      { data: 'airlines', title: 'Airlines', className: 'text-uppercase' },
      { data: 'flight_no', title: 'Flight No', className: 'text-uppercase' },
      {
        data: 'flight_date',
        title: 'Flight Date',
        render: (value, type) => dateRenderer(value, type),
      },
      { data: 'dest', title: 'Dest', className: 'text-uppercase' },
      { data: 'staff', title: 'Staff', className: 'text-wrap' },
      { data: 'supervisor', title: 'Supervisor', className: 'text-wrap' },
      {
        data: null,
        title: 'Pieces',
        className: 'text-center',
        render: (_value, type, row) => {
          if (type !== 'display') {
            return row?.total_pieces ?? 0;
          }
          return `<span class="fw-medium">${row?.completed_pieces ?? 0}</span> / <span class="text-muted">${row?.total_pieces ?? 0}</span>`;
        },
      },
      {
        data: 'is_completed',
        title: 'Status',
        className: 'text-center',
        render: (value, type) =>
          boolBadge(value, type, {
            trueLabel: 'COMPLETED',
            falseLabel: 'IN PROGRESS',
            trueClass: 'bg-label-success',
            falseClass: 'bg-label-warning',
          }),
      },
      {
        data: null,
        title: 'Actions',
        orderable: false,
        searchable: false,
        className: 'text-end text-nowrap',
        render: (_value, type, row) => {
          if (type !== 'display') {
            return row?.id ?? '';
          }
          return `
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-primary d-flex align-items-center gap-1" data-action="print-manifest" data-id="${row?.id}">
                <i class="ri ri-file-pdf-line"></i> Manifest
              </button>
              <button type="button" class="btn btn-outline-info d-flex align-items-center gap-1" data-action="print-checklist" data-id="${row?.id}">
                <i class="ri ri-printer-line"></i> Checklist
              </button>
              <button type="button" class="btn btn-outline-danger d-flex align-items-center gap-1" data-action="delete-buildup" data-id="${row?.id}">
                <i class="ri ri-delete-bin-line"></i> Delete
              </button>
            </div>
          `;
        },
      },
    ],
    []
  );

  const tableOptions = useMemo(() => {
    return {
      order: [[3, 'desc']], // order by Flight Date descending
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
    };
  }, []);

  return (
    <div className="card shadow-sm border-0 overflow-hidden">
      <CardPages variant="info" />
      <div className="card-body bg-light-50 border-bottom p-4">
        <h5 className="fw-semibold text-secondary mb-3 d-flex align-items-center gap-2">
          <i className="ri ri-filter-2-line"></i> Filter Pencarian
        </h5>
        <form onSubmit={handleApply}>
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-2">
              <div className="form-floating form-floating-outline">
                <input
                  type="text"
                  name="uld"
                  className="form-control text-uppercase"
                  placeholder="AKE12345FX"
                  value={formFilters.uld}
                  onChange={handleChange}
                />
                <label>ULD</label>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <div className="form-floating form-floating-outline">
                <input
                  type="text"
                  name="airlines"
                  className="form-control text-uppercase"
                  placeholder="FX"
                  value={formFilters.airlines}
                  onChange={handleChange}
                />
                <label>Airlines</label>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <div className="form-floating form-floating-outline">
                <input
                  type="text"
                  name="flight_no"
                  className="form-control text-uppercase"
                  placeholder="FX5202"
                  value={formFilters.flight_no}
                  onChange={handleChange}
                />
                <label>Flight No</label>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <div className="form-floating form-floating-outline">
                <input
                  type="date"
                  name="flight_date"
                  className="form-control"
                  value={formFilters.flight_date}
                  onChange={handleChange}
                />
                <label>Flight Date</label>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <div className="form-floating form-floating-outline">
                <input
                  type="text"
                  name="dest"
                  className="form-control text-uppercase"
                  placeholder="MEM"
                  value={formFilters.dest}
                  onChange={handleChange}
                />
                <label>Destination</label>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2">
              <div className="form-floating form-floating-outline">
                <input
                  type="text"
                  name="mawb"
                  className="form-control text-uppercase"
                  placeholder="023-12345678"
                  value={formFilters.mawb}
                  onChange={handleChange}
                />
                <label>MAWB</label>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <a
              href="https://expo.dev/artifacts/eas/xkv6zP9T4AzbcTiaFsRjYq.apk"
              className="btn btn-label-secondary d-flex align-items-center gap-1"
            >
              <i class="icon-base ri ri-android-fill icon-16px me-1"></i>
              Download MAU APP
            </a>
            <button
              type="button"
              className="btn btn-label-warning d-flex align-items-center gap-1"
              onClick={handleReset}
            >
              <i className="ri ri-refresh-line"></i> Reset
            </button>
            <button type="submit" className="btn btn-label-primary d-flex align-items-center gap-1">
              <i className="ri ri-search-line"></i> Cari Data
            </button>
          </div>
        </form>
      </div>

      <div className="card-body p-4">
        <div className="table-responsive">
          <GridData
            ref={tableRef}
            columns={columns}
            ajaxEndpoint="/warehouse/build-up-headers/datatables"
            filters={activeFilters}
            options={tableOptions}
            className="table-bordered table-striped align-middle"
          />
        </div>
      </div>
    </div>
  );
}
