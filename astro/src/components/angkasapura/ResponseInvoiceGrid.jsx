import GridData from '@components/GridData';
import { formatDateTime } from '@js/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getStatusBadgeClass = (status) => {
  const normalized = String(status ?? '').trim();
  if (!normalized) {
    return 'bg-label-secondary border border-secondary text-body-secondary';
  }
  if (normalized.startsWith('2')) {
    return 'bg-label-success border border-success text-success';
  }
  if (normalized.startsWith('4') || normalized.startsWith('5')) {
    return 'bg-label-danger border border-danger text-danger';
  }
  return 'bg-label-warning border border-warning text-warning';
};

const summarizeResponse = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {
      status: '-',
      affectedRows: '-',
      message: '-',
    };
  }

  return {
    status: payload.status ?? '-',
    affectedRows: payload.affected_rows ?? payload.affectedRows ?? '-',
    message: payload.message ?? '-',
  };
};

const columns = [
  { data: 'id', title: 'ID' },
  {
    data: 'inv',
    title: 'Invoice',
    className: 'text-primary fw-semibold',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? '';
      }
      return `<span class="badge bg-label-primary border border-primary text-primary text-uppercase fw-semibold px-3 py-2 rounded-pill">${escapeHtml(
        data ?? '-'
      )}</span>`;
    },
  },
  {
    data: 'status',
    title: 'Status',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? '';
      }

      return `<span class="badge ${getStatusBadgeClass(data)} text-uppercase fw-semibold px-3 py-2 rounded-pill">${escapeHtml(
        data ?? '-'
      )}</span>`;
    },
  },
  {
    data: 'created_at',
    title: 'Created At',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? '';
      }
      return formatDateTime(data);
    },
  },
  {
    data: 'response',
    title: 'Response',
    orderable: false,
    render: (data, type) => {
      if (type !== 'display') {
        return JSON.stringify(data ?? {});
      }

      const summary = summarizeResponse(data);
      return `
        <div class="d-flex flex-column gap-1">
          <span class="text-heading fw-semibold">${escapeHtml(summary.message)}</span>
          <small class="text-muted">HTTP: ${escapeHtml(summary.status)} | Affected: ${escapeHtml(
            summary.affectedRows
          )}</small>
        </div>
      `;
    },
  },
];

const createDefaultFilters = () => ({
  inv: '',
  status: '',
  created_at: '',
});

export default function ResponseInvoiceGrid() {
  const endpoint = '/angkasapura/response-invoice/datatables';
  const tableRef = useRef(null);
  const hasMounted = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formFilters, setFormFilters] = useState(() => createDefaultFilters());
  const [activeFilters, setActiveFilters] = useState(() => createDefaultFilters());

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

  const handleProcessing = useCallback((_, __, processing) => {
    const next = Boolean(processing);
    setIsProcessing((prev) => (prev === next ? prev : next));
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setActiveFilters({ ...formFilters });
  };

  const resetFilters = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

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

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">Grid Response Invoice</h5>
        <p className="text-muted mb-0">
          Data diambil dari tabel <code>respons_inv_ap2</code>.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={applyFilters}>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label htmlFor="filter-inv" className="form-label form-label-sm">
                  Invoice (`inv`)
                </label>
                <input
                  id="filter-inv"
                  type="text"
                  name="inv"
                  className="form-control form-control-sm"
                  placeholder="Contoh: BGD1.INV.24.698001"
                  value={formFilters.inv}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="filter-status" className="form-label form-label-sm">
                  Status
                </label>
                <input
                  id="filter-status"
                  type="text"
                  name="status"
                  className="form-control form-control-sm"
                  placeholder="Contoh: 200"
                  value={formFilters.status}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="filter-created-at" className="form-label form-label-sm">
                  Created At
                </label>
                <input
                  id="filter-created-at"
                  type="date"
                  name="created_at"
                  className="form-control form-control-sm"
                  value={formFilters.created_at}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary w-100" disabled={isProcessing}>
                  {isProcessing ? 'Memuat...' : 'Apply'}
                </button>
                <button
                  type="button"
                  className="btn btn-label-secondary w-100"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="card-datatable m-3">
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
