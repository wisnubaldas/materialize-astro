import { showConfirmAlert } from '@js/sweet-alert.js';
import { formatRupiah, showToast } from '@utils';
import { apiClient } from '@lib/api/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { escapeHtml, resolveApiErrorMessage } from './shared';

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
        <td>${escapeHtml(value ?? '-')}</td>
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

export const DATA_INVOICE_COLUMNS = [
  {
    data: null,
    title: '#',
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
          class="btn btn-sm btn-icon border-0 shadow-none p-0"
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
            class="btn btn-sm waves-effect ${buttonClass} text-uppercase text-start"
            data-void-action="1"
            data-no-invoice="${escapeHtml(row?.NO_INVOICE)}"
            data-tanggal="${escapeHtml(row?.TANGGAL)}"
            data-hawb="${escapeHtml(row?.HAWB)}"
            data-smu="${escapeHtml(row?.SMU)}"
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
    render: (data) => (data ? formatRupiah(data) : '0'),
  },
];

export const DATA_INVOICE_ENDPOINT = '/angkasapura/datatables';

export const createDefaultFilters = () => ({
  NO_INVOICE: '',
  TANGGAL: '',
  FLIGHT_NUMBER: '',
  KDAIRLINE: '',
  void: '',
});

export function useDataInvoice() {
  const tableRef = useRef(null);
  const tableContainerRef = useRef(null);
  const activeVoidRequestsRef = useRef(new Set());
  const hasMounted = useRef(false);

  const [formFilters, setFormFilters] = useState(() => createDefaultFilters());
  const [activeFilters, setActiveFilters] = useState(() => createDefaultFilters());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

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

  const handleFilterChange = useCallback((name, value) => {
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setActiveFilters({ ...formFilters });
  }, [formFilters]);

  const handleProcessing = useCallback((_, __, processing) => {
    const next = Boolean(processing);
    setIsProcessing((prev) => (prev === next ? prev : next));
  }, []);

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

      const shouldProceed = await showConfirmAlert({
        title: 'Apakah ingin Void ?',
        text: `${invoiceNumber}`,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
        icon: 'warning',
      });
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
        const message = resolveApiErrorMessage(error, 'Gagal mengirim request void invoice.');
        showToast({
          type: 'danger',
          title: 'Void Invoice',
          message,
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

  return {
    tableRef,
    tableContainerRef,
    formFilters,
    activeFilters,
    tableOptions,
    isSubmitting: isProcessing || isVoiding,
    handleFilterChange,
    handleResetFilters,
    handleApplyFilters,
    handleProcessing,
  };
}

