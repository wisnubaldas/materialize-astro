import GridData from '@components/GridData';
import { Icon } from '@iconify-icon/react';
import { EDI_EXPORT_BUILDUP_ENDPOINT } from '@lib/api/edi';
import * as bootstrap from 'bootstrap';
import DataTablesCore from 'datatables.net-bs5';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
// Pastikan objek bootstrap tersedia agar modal responsive DataTables tidak error (_bs undefined).
if (typeof window !== 'undefined' && bootstrap?.Modal) {
  try {
    DataTablesCore.use('bootstrap', bootstrap);
  } catch {
    // no-op
  }

  if (DataTablesCore?.Responsive?.bootstrap) {
    try {
      DataTablesCore.Responsive.bootstrap(bootstrap);
    } catch {
      // no-op
    }
  }

  if (!window.bootstrap) {
    window.bootstrap = bootstrap;
  }
}

const numberRenderer = (value, type, fractionDigits = 0) => {
  if (type !== 'display' && type !== 'filter') {
    return value ?? null;
  }

  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '';
  }

  return Number(value).toLocaleString('id-ID', {
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

const buildDetailUrl = (row) => {
  const params = new URLSearchParams();
  const keys = ['MasterAWB'];

  keys.forEach((key) => {
    const value = row?.[key];
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `/edi/sending-ffm?${query}` : '/edi/sending-ffm';
};

export function ServerDataTable({
  columns,
  endpoint,
  title,
  filters,
  options,
  className = '',
  ...rest
}) {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);

  const resolvedOptions = useMemo(
    () => ({
      order: [[1, 'desc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      ...options,
    }),
    [options]
  );

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
  }, [filters]);

  return (
    <div className="card shadow-none border-0">
      {title ? (
        <div className="card-header pb-0">
          <h6 className="card-title mb-0 text-uppercase text-primary">{title}</h6>
        </div>
      ) : null}

      <div className="card-body px-0 pt-2">
        <div className="card-datatable pt-0">
          <GridData
            ref={tableRef}
            columns={columns}
            ajaxEndpoint={endpoint}
            filters={filters}
            options={resolvedOptions}
            className={`table-bordered table-striped align-middle ${className}`}
            {...rest}
          />
        </div>
      </div>
    </div>
  );
}

export default function DataTableDefault() {
  const createDefaultFilters = () => ({
    BuildUpNumber: '',
    MasterAWB: '',
    TransitCode: '',
    UldCardNumber: '',
    AgenCode: '',
    DateEntry: '',
    TimeEntry: '',
  });

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setActiveFilters({ ...formFilters });
  };

  const handleReset = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

  const responsiveDetails = useMemo(() => {
    const modalFactory = DataTablesCore?.Responsive?.display?.modal;
    if (typeof modalFactory !== 'function') {
      return null;
    }

    const display = modalFactory({
      header: function (row) {
        const data = typeof row.data === 'function' ? row.data() : row?.data || {};
        const label =
          data?.BuildUpNumber ?? data?.MasterAWB ?? data?.full_name ?? data?.id ?? data?.noid ?? '';
        return label ? `Details of ${label}` : 'Row details';
      },
    });

    const renderer = function (_api, _rowIdx, columns) {
      const rows = columns
        .map((col) => {
          if (!col.title) {
            return '';
          }
          return (
            '<tr data-dt-row="' +
            col.rowIndex +
            '" data-dt-column="' +
            col.columnIndex +
            '">' +
            '<td>' +
            col.title +
            ':' +
            '</td> ' +
            '<td>' +
            (col.data ?? '') +
            '</td>' +
            '</tr>'
          );
        })
        .join('');

      if (!rows) {
        return false;
      }

      return '<table class="table table-striped table-sm"><tbody>' + rows + '</tbody></table>';
    };

    return { display, type: 'column', target: 'td.dtr-control, td.control', renderer };
  }, []);

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
      { data: 'noid', title: 'ID', visible: false, searchable: false },
      {
        data: 'BuildUpNumber',
        title: 'Build Up',
        render: (data, type, full) => {
          if (type !== 'display') {
            return data;
          }

          const href = buildDetailUrl(full);
          const label = data ?? '';
          const iconMarkup = renderToStaticMarkup(
            <Icon icon="line-md:arrow-down-square-twotone" width="16" height="16" />
          );

          return `<a href="${href}" class="d-inline-flex align-items-center gap-1 text-primary fw-semibold text-decoration-none">${iconMarkup}${label}</a>`;
        },
      },
      {
        data: 'FFM',
        title: 'FFM',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Ya',
            falseLabel: 'Tidak',
            trueClass: 'bg-label-success',
            falseClass: 'bg-label-secondary',
          }),
      },
      { data: 'MasterAWB', title: 'Master AWB' },
      { data: 'TransitCode', title: 'Transit' },
      { data: 'UldCardNumber', title: 'ULD Card' },
      { data: 'KindOfGood', title: 'Komoditi' },
      { data: 'AgenCode', title: 'Agen' },
      { data: 'EmployeeNumber', title: 'Petugas' },
      {
        data: 'Pieces',
        title: 'Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'Netto',
        title: 'Netto (Kg)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      {
        data: 'Volume',
        title: 'Volume (m3)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 3),
      },
      { data: 'condition', title: 'Kondisi' },
      { data: 'Remarks', title: 'Remarks' },
      { data: 'DateEntry', title: 'Tanggal Entry' },
      { data: 'TimeEntry', title: 'Waktu Entry' },

      {
        data: 'void',
        title: 'Status',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Void',
            falseLabel: 'Aktif',
            trueClass: 'bg-label-danger',
            falseClass: 'bg-label-primary',
          }),
      },
      {
        data: 'created_at',
        title: 'Dibuat',
        className: 'text-nowrap',
        render: (value, type) => {
          if (type !== 'display' && type !== 'filter') {
            return value;
          }
          if (!value) {
            return '';
          }
          const parsed = dayjs(value);
          return parsed.isValid() ? parsed.format('DD MMM YYYY HH:mm') : value;
        },
      },
    ],
    []
  );

  return (
    <div className="card shadow-none border-0">
      <div className="card-body pb-0">
        <form onSubmit={handleApply}>
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <label className="form-label mb-1">Build Up #</label>
              <input
                type="text"
                name="BuildUpNumber"
                className="form-control"
                placeholder="Contoh: BLD123"
                value={formFilters.BuildUpNumber}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Master AWB</label>
              <input
                type="text"
                name="MasterAWB"
                className="form-control"
                placeholder="Nomor AWB"
                value={formFilters.MasterAWB}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Transit Code</label>
              <input
                type="text"
                name="TransitCode"
                className="form-control"
                placeholder="Transit"
                value={formFilters.TransitCode}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">ULD Card</label>
              <input
                type="text"
                name="UldCardNumber"
                className="form-control"
                placeholder="ULD"
                value={formFilters.UldCardNumber}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Agen Code</label>
              <input
                type="text"
                name="AgenCode"
                className="form-control"
                placeholder="Kode Agen"
                value={formFilters.AgenCode}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Tanggal Entry</label>
              <input
                type="date"
                name="DateEntry"
                className="form-control"
                value={formFilters.DateEntry}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Waktu Entry</label>
              <input
                type="time"
                name="TimeEntry"
                className="form-control"
                value={formFilters.TimeEntry}
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
        <ServerDataTable
          title="Data Buildup Export"
          columns={columns}
          endpoint={EDI_EXPORT_BUILDUP_ENDPOINT}
          options={{
            order: [
              [1, 'desc'],
              [2, 'desc'],
            ],
            columnDefs: [
              {
                targets: 0,
                className: 'dtr-control control text-center',
                orderable: false,
                searchable: false,
              },
              { targets: 1, visible: false, searchable: false },
              { targets: [9, 10, 11], className: 'text-end' },
              { targets: [16, 17], orderable: false },
            ],
            ...(responsiveDetails
              ? {
                  responsive: {
                    details: responsiveDetails,
                  },
                }
              : {}),
          }}
          filters={activeFilters}
        />
      </div>
    </div>
  );
}
