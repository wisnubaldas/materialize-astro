import GridData from '@components/GridData';
import { Icon } from '@iconify-icon/react';
import { API_BASE_URL } from '@lib/api/client';
import { WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT } from '@lib/api/warehouse';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const numberRenderer = (value, type, fractionDigits = 0) => {
  if (type !== 'display' && type !== 'filter') {
    return value ?? null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  return numeric.toLocaleString('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const badgeRenderer = (value, type, { trueLabel, falseLabel, trueClass, falseClass }) => {
  if (type !== 'display') {
    return value;
  }

  const isTrue = value === true || value === 1 || value === '1' || value === 'true';
  const label = isTrue ? trueLabel : falseLabel;
  const theme = isTrue ? trueClass : falseClass;

  return `<span class="badge rounded-pill ${theme} px-2">${label}</span>`;
};

const dateRenderer = (value, type, format = 'DD MMM YYYY') => {
  if (type !== 'display' && type !== 'filter') {
    return value;
  }

  if (!value) {
    return '';
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(format) : value;
};

const buildPublicUrl = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return value;
  }

  const base = API_BASE_URL?.replace(/\/+$/, '') ?? '';
  const path = String(value).replace(/^\/+/, '');
  return base ? `${base}/${path}` : `/${path}`;
};

const linkRenderer = (value, type, label = 'View') => {
  if (type !== 'display') {
    return value ?? '';
  }

  const url = buildPublicUrl(value);
  if (!url) {
    return '';
  }

  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
};

const createDefaultFilters = () => ({
  airline_code: '',
  flight_number: '',
  flight_date: '',
  point_of_loading: '',
  point_of_unloading: '',
});

export default function BuildupDatatables() {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);

  useEffect(() => {
    const api = tableRef.current;
    if (!api?.reload) {
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    api.reload(true);
  }, [activeFilters]);

  useEffect(() => {
    const handleUploadSuccess = () => {
      tableRef.current?.reload?.(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('manifest-uploaded', handleUploadSuccess);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('manifest-uploaded', handleUploadSuccess);
      }
    };
  }, []);

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

  const columns = useMemo(
    () => [
      {
        data: null,
        title: '',
        defaultContent: '',
        className: 'dtr-control control text-center',
        orderable: false,
        searchable: false,
        responsivePriority: 1,
        render: (_value, type) => {
          if (type !== 'display') {
            return '';
          }
          const markup = renderToStaticMarkup(
            <Icon icon="line-md:arrow-down-square-twotone" width="20" height="20" />
          );
          return (
            markup ||
            '<span class="text-primary fw-bold" aria-label="Toggle details">&#9662;</span>'
          );
        },
      },
      {
        data: 'airline_code',
        title: 'Airline',
        className: 'text-uppercase',
        responsivePriority: 2,
      },
      {
        data: 'flight_number',
        title: 'Flight',
        className: 'text-uppercase',
        responsivePriority: 3,
      },
      {
        data: 'flight_date',
        title: 'Flight Date',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type),
      },
      { data: 'point_of_loading', title: 'Origin', className: 'text-uppercase' },
      { data: 'point_of_unloading', title: 'Destination', className: 'text-uppercase' },
      { data: 'aircraft_registration', title: 'Aircraft', className: 'text-uppercase' },
      {
        data: 'total_pieces',
        title: 'Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'total_weight_kg',
        title: 'Weight (Kg)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      {
        data: 'source_document',
        title: 'Source Excel',
        className: 'text-nowrap',
        render: (value, type) => linkRenderer(value, type, 'Excel'),
      },
      {
        data: 'raw_text',
        title: 'PDF',
        className: 'text-nowrap',
        render: (value, type) => linkRenderer(value, type, 'PDF'),
      },
      {
        data: 'created_at',
        title: 'Dibuat',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type, 'DD MMM YYYY HH:mm'),
      },
    ],
    []
  );

  const tableOptions = useMemo(() => {
    const findIndex = (key) => columns.findIndex((col) => col.data === key);
    const createdAtIndex = findIndex('created_at');
    const numberTargets = ['total_pieces', 'total_weight_kg']
      .map(findIndex)
      .filter((idx) => idx >= 0);
    const defs = [];

    const controlIndex = findIndex(null);
    if (controlIndex >= 0) {
      defs.push({
        targets: controlIndex,
        className: 'dtr-control control text-center',
        orderable: false,
        searchable: false,
      });
    }

    if (numberTargets.length) {
      defs.push({ targets: numberTargets, className: 'text-end' });
    }

    return {
      order: [[createdAtIndex >= 0 ? createdAtIndex : 1, 'desc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      columnDefs: defs,
    };
  }, [columns]);

  return (
    <div className="card shadow-none border-0">
      <div className="card-body pb-0">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h5 className="mb-1 fw-bold text-uppercase">Data Manifest Flight</h5>
            <p className="mb-0 text-muted">
              Gunakan filter di bawah untuk memuat data manifest flight.
            </p>
          </div>
          <div className="text-muted small">
            Endpoint: {WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}
          </div>
        </div>

        <form onSubmit={handleApply}>
          <div className="row g-2 mb-3">
            <div className="col-sm-6 col-md-3">
              <label className="form-label mb-1">Airline</label>
              <input
                type="text"
                name="airline_code"
                className="form-control"
                placeholder="FX"
                value={formFilters.airline_code}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-3">
              <label className="form-label mb-1">Flight Number</label>
              <input
                type="text"
                name="flight_number"
                className="form-control"
                placeholder="FX123"
                value={formFilters.flight_number}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Flight Date</label>
              <input
                type="date"
                name="flight_date"
                className="form-control"
                value={formFilters.flight_date}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Origin</label>
              <input
                type="text"
                name="point_of_loading"
                className="form-control"
                placeholder="CGK"
                value={formFilters.point_of_loading}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Destination</label>
              <input
                type="text"
                name="point_of_unloading"
                className="form-control"
                placeholder="SIN"
                value={formFilters.point_of_unloading}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="d-flex gap-2 mb-3">
            <button type="submit" className="btn btn-primary">
              Terapkan Filter
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="card-body pt-0">
        <GridData
          ref={tableRef}
          columns={columns}
          ajaxEndpoint={WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}
          filters={activeFilters}
          options={tableOptions}
          className="table-bordered table-striped align-middle"
        />
      </div>
    </div>
  );
}
