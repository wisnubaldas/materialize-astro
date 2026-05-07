import GridData from '@components/GridData';
import { Icon } from '@iconify-icon/react';
import { EDI_EXPORT_CWP_ENDPOINT } from '@lib/api/edi';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const createDefaultFilters = () => ({
  MasterAWB: '',
  AirlinesCode: '',
  FlightNumber: '',
  Origin: '',
  Destination: '',
  DateOfFlight: '',
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
        data: 'MasterAWB',
        title: 'Master AWB',
        responsivePriority: 2,
        render: (value) => {
          return `<a href="/edi/send-email/fhl@${value ?? ''}">${value ?? ''}</a>`;
        },
      },
      { data: 'AirlinesCode', title: 'Airlines' },
      { data: 'FlightNumber', title: 'Flight' },
      { data: 'Origin', title: 'Origin', className: 'text-center' },
      { data: 'Destination', title: 'Destination', className: 'text-center' },
      { data: 'DateOfFlight', title: 'Flight Date', className: 'text-nowrap' },
    ],
    []
  );

  const tableOptions = useMemo(
    () => ({
      order: [[7, 'desc']],
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
              <label className="form-label mb-1">Flight Date</label>
              <input
                type="date"
                name="DateOfFlight"
                className="form-control"
                value={formFilters.DateOfFlight}
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
