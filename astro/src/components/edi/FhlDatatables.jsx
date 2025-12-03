import GridData from '@components/GridData';
import { Icon } from '@iconify-icon/react';
import { EDI_EXPORT_CWP_ENDPOINT } from '@lib/api/edi';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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

const createDefaultFilters = () => ({
  ProofNumber: '',
  MasterAWB: '',
  AirlinesCode: '',
  FlightNumber: '',
  Origin: '',
  Destination: '',
  AgenCode: '',
  ConsigneeCode: '',
  DateOfFlight: '',
  DateOfEntry: '',
  InvoiceNumber: '',
  EmployeeNumber: '',
});

export default function FhlDatatables() {
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
      { data: 'noid', title: 'ID', visible: false, searchable: false },
      {
        data: 'ProofNumber',
        title: 'Proof Number',
        className: 'fw-semibold text-primary',
        responsivePriority: 2,
      },
      {
        data: 'MasterAWB',
        title: 'Master AWB',
        responsivePriority: 3,
        render: (value) => {
          return `<a href="/edi/send-email/${value ?? ''}">${value ?? ''}</a>`;
        },
      },
      { data: 'AirlinesCode', title: 'Airlines' },
      { data: 'FlightNumber', title: 'Flight' },
      { data: 'Origin', title: 'Origin', className: 'text-center' },
      { data: 'Destination', title: 'Destination', className: 'text-center' },
      { data: 'DateOfFlight', title: 'Flight Date', className: 'text-nowrap' },
      { data: 'DateOfEntry', title: 'Entry Date', className: 'text-nowrap' },
      { data: 'TimeOfEntry', title: 'Entry Time', className: 'text-nowrap' },
      { data: 'AgenCode', title: 'Agen' },
      { data: 'ConsigneeCode', title: 'Consignee' },
      { data: 'EmployeeNumber', title: 'Petugas' },
      { data: 'InvoiceNumber', title: 'Invoice #' },
      {
        data: 'TotalPieces',
        title: 'Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'TotalNetto',
        title: 'Netto (Kg)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      {
        data: 'TotalVolume',
        title: 'Volume (m3)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 3),
      },
      {
        data: 'TotalCAW',
        title: 'CAW',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      {
        data: 'gateIn',
        title: 'Gate In',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Sudah',
            falseLabel: 'Belum',
            trueClass: 'bg-label-success',
            falseClass: 'bg-label-secondary',
          }),
      },
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

  const tableOptions = useMemo(
    () => ({
      order: [[21, 'desc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      columnDefs: [
        {
          targets: 0,
          className: 'dtr-control control text-center',
          orderable: false,
          searchable: false,
        },
        { targets: 1, visible: false, searchable: false },
        { targets: [15, 16, 17, 18], className: 'text-end' },
        { targets: [19, 20], orderable: false },
      ],
    }),
    []
  );

  return (
    <div className="card shadow-none border-0">
      <div className="card-body pb-0">
        <form onSubmit={handleApply}>
          <div className="row g-2 mb-3">
            <div className="col-md-3">
              <label className="form-label mb-1">Proof Number</label>
              <input
                type="text"
                name="ProofNumber"
                className="form-control"
                placeholder="Nomor proof"
                value={formFilters.ProofNumber}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3">
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
            <div className="col-md-2">
              <label className="form-label mb-1">Airlines</label>
              <input
                type="text"
                name="AirlinesCode"
                className="form-control"
                placeholder="GA"
                value={formFilters.AirlinesCode}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Flight</label>
              <input
                type="text"
                name="FlightNumber"
                className="form-control"
                placeholder="GA123"
                value={formFilters.FlightNumber}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Invoice</label>
              <input
                type="text"
                name="InvoiceNumber"
                className="form-control"
                placeholder="Invoice #"
                value={formFilters.InvoiceNumber}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label mb-1">Origin</label>
              <input
                type="text"
                name="Origin"
                className="form-control"
                placeholder="CGK"
                value={formFilters.Origin}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Destination</label>
              <input
                type="text"
                name="Destination"
                className="form-control"
                placeholder="SIN"
                value={formFilters.Destination}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Agen</label>
              <input
                type="text"
                name="AgenCode"
                className="form-control"
                placeholder="Kode agen"
                value={formFilters.AgenCode}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Consignee</label>
              <input
                type="text"
                name="ConsigneeCode"
                className="form-control"
                placeholder="Kode consignee"
                value={formFilters.ConsigneeCode}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Petugas</label>
              <input
                type="text"
                name="EmployeeNumber"
                className="form-control"
                placeholder="NIK"
                value={formFilters.EmployeeNumber}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Flight Date</label>
              <input
                type="date"
                name="DateOfFlight"
                className="form-control"
                value={formFilters.DateOfFlight}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Entry Date</label>
              <input
                type="date"
                name="DateOfEntry"
                className="form-control"
                value={formFilters.DateOfEntry}
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
          ajaxEndpoint={EDI_EXPORT_CWP_ENDPOINT}
          filters={activeFilters}
          options={tableOptions}
          className="table-bordered table-striped align-middle"
        />
      </div>
    </div>
  );
}
