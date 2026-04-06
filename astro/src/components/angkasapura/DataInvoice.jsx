import GridData from '@components/GridData';
import { formatRupiah, showToast } from '@js/utils.js';
import { apiClient } from '@lib/api/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InvoiceFilters from './InvoiceFilters.jsx';

const escapeHtmlAttr = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const DETAIL_FIELDS = [
  { key: 'NO_INVOICE', label: 'NO INVOICE' },
  { key: 'TANGGAL', label: 'TANGGAL' },
  { key: 'SMU', label: 'SMU' },
  { key: 'FLIGHT_NUMBER', label: 'FLIGHT NUMBER' },
  { key: 'KOLI', label: 'KOLI' },
  { key: 'BERAT', label: 'BERAT' },
  { key: 'VOLUME', label: 'VOLUME' },
  { key: 'TOTAL_PENDAPATAN_TANPA_PPN', label: 'PENDAPATAN NON PPN' },
  { key: 'status', label: 'STATUS' },
  { key: 'void', label: 'VOID' },
];

const buildDetailHtml = (rowData = {}) => {
  const rows = DETAIL_FIELDS.map(({ key, label }) => {
    let value = rowData?.[key];
    if (key === 'TOTAL_PENDAPATAN_TANPA_PPN') {
      value = value ? formatRupiah(value) : '0';
    } else if (key === 'status') {
      const status = Number(value);
      if (status === 1) {
        value = 'Terkirim';
      } else if (status === 0) {
        value = 'Dalam Antrian';
      } else {
        value = value ?? '-';
      }
    } else if (key === 'void') {
      value = Number(value) === 1 ? 'Sudah Void' : 'Aktif';
    }

    return `
      <tr>
        <th class="text-uppercase small text-muted pe-3" style="width: 220px;">${label}</th>
        <td>${escapeHtmlAttr(value ?? '-')}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-responsive p-2">
      <table class="table table-sm mb-0">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

// Kolom yang dikirim ke DataTables (server-side) termasuk renderer badge untuk invoice.
const columns = [
  {
    data: null,
    title: '',
    className: 'control dtr-control text-center',
    orderable: false,
    searchable: false,
    defaultContent: '',
    render: (_data, type) => {
      if (type !== 'display') {
        return '';
      }
      return `
        <button
          type="button"
          class="btn btn-sm btn-icon border-0 shadow-none p-0 text-primary"
          data-detail-action="1"
          aria-expanded="false"
          aria-label="Lihat detail baris"
        >
          <i class="ri ri-arrow-right-s-line fs-5"></i>
        </button>
      `;
    },
  },
  {
    data: 'void',
    title: 'Void',
    orderable: false,
    searchable: false,
    render: (data, type, row) => {
      const normalized = Number(data);
      if (type === 'display') {
        const isVoided = normalized === 1;
        const disabledAttrs = isVoided ? 'disabled aria-disabled="true"' : '';
        const buttonClass = isVoided ? 'btn-label-primary' : 'btn-label-danger';
        const buttonLabel = isVoided ? 'Sudah_Void' : 'Void';

        return `
          <button
            type="button"
            class="btn btn-sm waves-effect ${buttonClass} text-uppercase"
            data-void-action="1"
            data-no-invoice="${escapeHtmlAttr(row?.NO_INVOICE)}"
            data-tanggal="${escapeHtmlAttr(row?.TANGGAL)}"
            data-hawb="${escapeHtmlAttr(row?.HAWB)}"
            data-smu="${escapeHtmlAttr(row?.SMU)}"
            ${disabledAttrs}
          >
            ${buttonLabel}
          </button>
        `;
      }
      return Number.isFinite(normalized) ? normalized : data;
    },
  },
  {
    data: 'status',
    title: 'Status',
    render: (data, type) => {
      const normalized = Number(data);
      const hasNumericStatus = Number.isFinite(normalized);
      if (type === 'display') {
        if (normalized === 1) {
          return '<span class="badge bg-label-success border border-success text-success text-uppercase fw-semibold px-3 py-2 rounded-pill">Terkirim</span>';
        }
        if (normalized === 0) {
          return '<span class="badge bg-label-warning border border-warning text-warning text-uppercase fw-semibold px-3 py-2 rounded-pill">Dalam Antrian</span>';
        }
        return `<span class="badge bg-label-secondary border border-secondary text-body-secondary text-uppercase fw-semibold px-3 py-2 rounded-pill">${
          data ?? '-'
        }</span>`;
      }
      return hasNumericStatus ? normalized : data;
    },
  },

  {
    data: 'NO_INVOICE',
    title: 'No Invoice',
    className: 'text-primary fw-semibold',
    render: (data, type) => {
      if (type === 'display') {
        return `<span class="badge bg-label-primary border border-primary text-primary text-uppercase fw-semibold px-3 py-2 rounded-pill" style="cursor: pointer;">
        ${data ?? ''}</span>`;
      }
      return data;
    },
  },
  { data: 'TANGGAL', title: 'Tanggal' },
  { data: 'SMU', title: 'SMU' },
  { data: 'FLIGHT_NUMBER', title: 'Flight Number' },
  { data: 'KOLI', title: 'Koli' },
  { data: 'BERAT', title: 'Berat' },
  { data: 'VOLUME', title: 'Volume' },
  {
    data: 'TOTAL_PENDAPATAN_TANPA_PPN',
    title: 'Pendapatan Non PPN',
    render: (data) => {
      return data ? formatRupiah(data) : '0';
    },
  },
];

// Nilai dasar untuk filter form dan payload DataTables.
const createDefaultFilters = () => ({
  NO_INVOICE: '',
  TANGGAL: '',
  FLIGHT_NUMBER: '',
  KDAIRLINE: '',
  void: '',
});

export default function DataInvoice() {
  const endpoint = '/angkasapura/datatables';
  // Simpan referensi API DataTables untuk trigger reload manual.
  const tableRef = useRef(null);
  const tableContainerRef = useRef(null);
  const activeVoidRequestsRef = useRef(new Set());
  // State penampung input form filter sebelum dikirim ke server.
  const [formFilters, setFormFilters] = useState(() => createDefaultFilters());
  // State filter yang sudah diterapkan (tersinkron ke request DataTables).
  const [activeFilters, setActiveFilters] = useState(() => createDefaultFilters());
  // Flag loading untuk men-disable tombol Apply selama DataTables memproses request.
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  // Penanda agar reload otomatis tidak jalan pada render pertama.
  const hasMounted = useRef(false);
  // Opsi DataTables yang jarang berubah dibuat memo supaya referensinya stabil.
  const tableOptions = useMemo(
    () => ({
      order: [[4, 'desc']],
      searching: false,
      lengthChange: false,
      pageLength: 10,
      info: true,
      paging: true,
      responsive: {
        details: false,
      },
    }),
    []
  );

  // Update state form ketika pengguna mengetik.
  const handleFilterChange = (name, value) => {
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form dan payload filter ke kondisi awal.
  const handleResetFilters = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

  // Terapkan filter: cukup copy state form ke state aktif agar useEffect memicu reload.
  const handleApplyFilters = () => {
    setActiveFilters({ ...formFilters });
  };

  // Terima event processing dari DataTables untuk toggle spinner/tombol Apply.
  const handleProcessing = useCallback((_, __, processing) => {
    const next = Boolean(processing);
    setIsProcessing((prev) => (prev === next ? prev : next));
  }, []);

  // Reload tabel ketika filter aktif berubah setelah render pertama.
  useEffect(() => {
    const api = tableRef.current;
    if (!api?.reload) {
      return;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    api.reload(true);
  }, [activeFilters]);

  const setVoidButtonLoading = useCallback((button, isLoading) => {
    if (!button || !(button instanceof HTMLButtonElement)) {
      return;
    }

    if (isLoading) {
      if (!button.dataset.originalLabel) {
        button.dataset.originalLabel = button.textContent?.trim() || 'Void';
      }
      if (!button.dataset.originalClass) {
        button.dataset.originalClass = button.className;
      }
      button.disabled = true;
      button.classList.remove('btn-label-danger', 'btn-label-primary');
      button.classList.add('btn-secondary');
      button.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Loading...';
      return;
    }

    const originalLabel = button.dataset.originalLabel || 'Void';
    const originalClass = button.dataset.originalClass;
    if (originalClass) {
      button.className = originalClass;
    }
    button.innerHTML = originalLabel;
    button.disabled = originalLabel.toLowerCase().includes('sudah void');
    delete button.dataset.originalLabel;
    delete button.dataset.originalClass;
  }, []);

  const setDetailButtonExpanded = useCallback((button, expanded) => {
    if (!button || !(button instanceof HTMLButtonElement)) {
      return;
    }
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    const icon = button.querySelector('i');
    if (!icon) {
      return;
    }
    icon.classList.remove('ri-arrow-right-s-line', 'ri-arrow-down-s-line');
    icon.classList.add(expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line');
  }, []);

  const handleVoidInvoice = useCallback(
    async (payload, button) => {
      const invoiceNumber = String(payload.NO_INVOICE || '').trim();
      if (!invoiceNumber) {
        showToast({
          type: 'danger',
          title: 'Void Invoice',
          message: 'NO_INVOICE tidak valid.',
        });
        return;
      }

      if (activeVoidRequestsRef.current.has(invoiceNumber)) {
        return;
      }

      const shouldProceed = window.confirm(`Void invoice ${invoiceNumber}?`);
      if (!shouldProceed) {
        return;
      }

      activeVoidRequestsRef.current.add(invoiceNumber);
      setIsVoiding(true);
      setVoidButtonLoading(button, true);

      try {
        const response = await apiClient.post('/angkasapura/void-invoice', payload);
        const success = Boolean(response?.success);
        const rawResponseText =
          response?.response !== undefined ? JSON.stringify(response.response) : '-';
        const statusText = String(response?.status ?? '-');
        const messageText = String(response?.message ?? 'Void invoice selesai diproses.');
        showToast({
          type: success ? 'success' : 'danger',
          title: 'Void Invoice',
          message: `Status: ${statusText}\nMessage: ${messageText}\nResponse: ${rawResponseText}`,
          persist: true,
          duration: 0,
        });
      } catch (error) {
        showToast({
          type: 'danger',
          title: 'Void Invoice',
          message: error?.message || 'Gagal mengirim request void invoice.',
          persist: true,
          duration: 0,
        });
      } finally {
        activeVoidRequestsRef.current.delete(invoiceNumber);
        setIsVoiding(activeVoidRequestsRef.current.size > 0);
        setVoidButtonLoading(button, false);
        tableRef.current?.reload?.(false);
      }
    },
    [setVoidButtonLoading]
  );

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) {
      return;
    }

    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const detailButton = target.closest('button[data-detail-action="1"]');
      if (detailButton && detailButton instanceof HTMLButtonElement) {
        event.preventDefault();
        event.stopPropagation();

        const api = tableRef.current?.dt?.();
        if (!api) {
          return;
        }

        const rowElement = detailButton.closest('tr');
        if (!rowElement) {
          return;
        }

        const rowApi = api.row(rowElement);
        if (!rowApi || !rowApi.node()) {
          return;
        }

        const isShown = rowApi.child.isShown();

        api.rows({ page: 'current' }).every(function () {
          if (this.index() === rowApi.index()) {
            return;
          }
          if (this.child && this.child.isShown()) {
            this.child.hide();
            const siblingNode = this.node();
            if (siblingNode?.classList) {
              siblingNode.classList.remove('parent');
            }
            const siblingBtn = siblingNode?.querySelector?.('button[data-detail-action="1"]');
            setDetailButtonExpanded(siblingBtn, false);
          }
        });

        if (isShown) {
          rowApi.child.hide();
          rowElement.classList.remove('parent');
          setDetailButtonExpanded(detailButton, false);
        } else {
          rowApi.child(buildDetailHtml(rowApi.data())).show();
          rowElement.classList.add('parent');
          setDetailButtonExpanded(detailButton, true);
        }
        return;
      }

      const button = target.closest('button[data-void-action="1"]');
      if (!button || !(button instanceof HTMLButtonElement) || button.disabled) {
        return;
      }

      const payload = {
        NO_INVOICE: button.dataset.noInvoice ?? '',
        TANGGAL: button.dataset.tanggal ?? '',
        HAWB: button.dataset.hawb ?? '',
        SMU: button.dataset.smu ?? '',
      };

      void handleVoidInvoice(payload, button);
    };

    container.addEventListener('click', onClick);
    return () => {
      container.removeEventListener('click', onClick);
    };
  }, [handleVoidInvoice, setDetailButtonExpanded]);

  return (
    <div className="container-fluid px-0">
      {/* Header ringkas halaman */}
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">List Data Invoice Terkirim</h5>
        <p className="text-muted mb-0">Gunakan filter untuk mempercepat pencarian data.</p>
      </div>

      {/* Form filter responsif */}
      <InvoiceFilters
        values={formFilters}
        onChange={handleFilterChange}
        onSubmit={handleApplyFilters}
        onReset={handleResetFilters}
        isSubmitting={isProcessing || isVoiding}
      />

      {/* Wrapper tabel server-side */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3" ref={tableContainerRef}>
          <div className="card-datatable mb-3">
            <GridData
              ref={tableRef}
              columns={columns}
              ajaxEndpoint={endpoint}
              filters={activeFilters}
              options={tableOptions}
              onProcessing={handleProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
