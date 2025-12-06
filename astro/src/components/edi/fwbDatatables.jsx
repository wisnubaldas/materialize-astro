import GridData from '@components/GridData';
import { Icon } from '@iconify-icon/react';
import { EDI_EXPORT_AWB_MAWB } from '@lib/api/edi';
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

const createDefaultFilters = () => ({
  MasterAWB: '',
  AirlinesCode: '',
  FlightNo: '',
  Origin: '',
  Destination: '',
  KindOfGood: '',
  AgenCode: '',
  ShipperCode: '',
  ConsigneeCode: '',
  DateOfFlight: '',
  DateEntry: '',
});

export default function FwbDatatables() {
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
      {
        data: 'MasterAWB',
        title: 'Master AWB',
        className: 'fw-semibold text-primary text-uppercase',
        responsivePriority: 2,
        render: (_value, type) => {
          return `<a href="/edi/send-email/fwb@${_value}">
          <span class="badge text-bg-primary">${_value}</span>
          </a>`;
        },
      },
      {
        data: 'AirlinesCode',
        title: 'Airlines',
        className: 'text-uppercase',
        responsivePriority: 3,
      },
      { data: 'FlightNo', title: 'Flight', className: 'text-uppercase', responsivePriority: 4 },
      {
        data: 'Origin',
        title: 'Origin',
        className: 'text-center text-uppercase',
        responsivePriority: 5,
      },
      {
        data: 'Destination',
        title: 'Destination',
        className: 'text-center text-uppercase',
        responsivePriority: 6,
      },
      {
        data: 'DateOfFlight',
        title: 'Flight Date',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type),
      },
      {
        data: 'Pieces',
        title: 'Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'Weight',
        title: 'Weight (Kg)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      {
        data: 'Volume',
        title: 'Volume (m3)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 3),
      },
      { data: 'KindOfGood', title: 'Kind of Goods' },
      { data: 'AgenCode', title: 'Agen' },
      { data: 'ShipperCode', title: 'Shipper' },
      { data: 'ConsigneeCode', title: 'Consignee' },
      {
        data: 'DateEntry',
        title: 'Entry Date',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type),
      },
      { data: 'TimeEntry', title: 'Entry Time', className: 'text-nowrap' },
      {
        data: 'RCS',
        title: 'RCS',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'RCS',
            falseLabel: '-',
            trueClass: 'bg-label-success',
            falseClass: 'bg-label-secondary',
          }),
      },
      {
        data: 'FWB',
        title: 'FWB',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Sent',
            falseLabel: '-',
            trueClass: 'bg-label-primary',
            falseClass: 'bg-label-secondary',
          }),
      },
      {
        data: 'PDE',
        title: 'PDE',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Yes',
            falseLabel: '-',
            trueClass: 'bg-label-info',
            falseClass: 'bg-label-secondary',
          }),
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
    const numberTargets = ['Pieces', 'Weight', 'Volume'].map(findIndex).filter((idx) => idx >= 0);
    const badgeTargets = ['RCS', 'FWB', 'PDE'].map(findIndex).filter((idx) => idx >= 0);
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

    if (badgeTargets.length) {
      defs.push({ targets: badgeTargets, orderable: false });
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
            <h5 className="mb-1 fw-bold text-uppercase">Data Master AWB/MAWB</h5>
            <p className="mb-0 text-muted">Gunakan filter di bawah untuk memuat daftar FWB.</p>
          </div>
          <div className="text-muted small">Endpoint: {EDI_EXPORT_AWB_MAWB}</div>
        </div>

        <form onSubmit={handleApply}>
          <div className="row g-2 mb-3">
            <div className="col-sm-6 col-md-3">
              <label className="form-label mb-1">Master AWB</label>
              <input
                type="text"
                name="MasterAWB"
                className="form-control"
                placeholder="Nomor Master AWB"
                value={formFilters.MasterAWB}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
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
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Flight No</label>
              <input
                type="text"
                name="FlightNo"
                className="form-control"
                placeholder="GA123"
                value={formFilters.FlightNo}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
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
            <div className="col-sm-6 col-md-2">
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
            <div className="col-sm-6 col-md-3">
              <label className="form-label mb-1">Kind of Goods</label>
              <input
                type="text"
                name="KindOfGood"
                className="form-control"
                placeholder="General Cargo"
                value={formFilters.KindOfGood}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
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
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Shipper</label>
              <input
                type="text"
                name="ShipperCode"
                className="form-control"
                placeholder="Kode shipper"
                value={formFilters.ShipperCode}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
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
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Flight Date</label>
              <input
                type="date"
                name="DateOfFlight"
                className="form-control"
                value={formFilters.DateOfFlight}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Entry Date</label>
              <input
                type="date"
                name="DateEntry"
                className="form-control"
                value={formFilters.DateEntry}
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
          ajaxEndpoint={EDI_EXPORT_AWB_MAWB}
          filters={activeFilters}
          options={tableOptions}
          className="table-bordered table-striped align-middle"
        />
      </div>
    </div>
  );
}
