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

// Kolom yang dikirim ke DataTables (server-side) termasuk renderer badge untuk invoice.
const columns = [
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
      order: [[3, 'desc']],
      searching: false,
      lengthChange: false,
      pageLength: 10,
      info: true,
      paging: true,
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
      button.disabled = true;
      button.classList.remove('btn-outline-danger');
      button.classList.add('btn-secondary');
      button.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Loading...';
      return;
    }

    const originalLabel = button.dataset.originalLabel || 'Void';
    button.innerHTML = originalLabel;
    if (originalLabel.toLowerCase().includes('sudah void')) {
      button.disabled = true;
      button.classList.remove('btn-outline-danger');
      button.classList.add('btn-secondary');
    } else {
      button.disabled = false;
      button.classList.remove('btn-secondary');
      button.classList.add('btn-outline-danger');
    }
    delete button.dataset.originalLabel;
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
          message: `Status: ${statusText} | Message: ${messageText} | Response: ${rawResponseText}`,
        });
      } catch (error) {
        showToast({
          type: 'danger',
          title: 'Void Invoice',
          message: error?.message || 'Gagal mengirim request void invoice.',
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
  }, [handleVoidInvoice]);

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
        <div className="card-body p-0" ref={tableContainerRef}>
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
