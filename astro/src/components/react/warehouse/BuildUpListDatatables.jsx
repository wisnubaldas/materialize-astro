import GridData from '@components/GridData';
import { showToast } from '@utils';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAccessToken } from '@lib/auth/token.js';
import { API_BASE_URL } from '@lib/api/client.js';
import { boolBadge } from '../edi/shared.js';

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

export default function BuildUpListDatatables() {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);

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

  const handlePrintManifest = useCallback((id) => {
    if (!id) return;
    const token = getAccessToken();
    const url = `${API_BASE_URL}/pdf/warehouse/build-up-headers/${id}/pdf-manifest?token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  }, []);

  const handlePrintChecklist = useCallback((id) => {
    if (!id) return;
    const token = getAccessToken();
    const url = `${API_BASE_URL}/pdf/warehouse/build-up-headers/${id}/pdf-checklist?token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  }, []);

  useEffect(() => {
    const api = tableRef.current?.dt?.();
    if (!api?.table) {
      return undefined;
    }

    const tableNode = api.table().node();
    if (!tableNode) {
      return undefined;
    }

    const handleClick = (event) => {
      const target = event.target?.closest?.('button[data-action]');
      if (!target) {
        return;
      }
      const action = target.getAttribute('data-action');
      const id = Number(target.getAttribute('data-id'));
      if (!id) {
        return;
      }

      if (action === 'print-manifest') {
        handlePrintManifest(id);
      } else if (action === 'print-checklist') {
        handlePrintChecklist(id);
      }
    };

    tableNode.addEventListener('click', handleClick);
    return () => {
      tableNode.removeEventListener('click', handleClick);
    };
  }, [handlePrintManifest, handlePrintChecklist]);

  const columns = useMemo(
    () => [
      { data: 'uld', title: 'ULD', className: 'text-uppercase fw-semibold' },
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
        }
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
              <button class="btn btn-outline-primary d-flex align-items-center gap-1" data-action="print-manifest" data-id="${row?.id}">
                <i class="ri-file-pdf-line"></i> Manifest
              </button>
              <button class="btn btn-outline-info d-flex align-items-center gap-1" data-action="print-checklist" data-id="${row?.id}">
                <i class="ri-printer-line"></i> Checklist
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
      <div className="card-header bg-gradient-primary text-white p-4" style={{ background: 'linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="avatar avatar-md bg-white text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm">
            <i className="ri-archive-line icon-24px"></i>
          </div>
          <div>
            <h4 className="mb-0 text-white fw-bold">Build Up Checklist & Manifest</h4>
            <p className="mb-0 text-white-50 small">Kelola data build up, cetak manifest, dan lembar checklist secara realtime</p>
          </div>
        </div>
      </div>

      <div className="card-body bg-light-50 border-bottom p-4">
        <h5 className="fw-semibold text-secondary mb-3 d-flex align-items-center gap-2">
          <i className="ri-filter-2-line"></i> Filter Pencarian
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
            <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-1" onClick={handleReset}>
              <i className="ri-refresh-line"></i> Reset
            </button>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-1 shadow-sm">
              <i className="ri-search-line"></i> Cari Data
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
