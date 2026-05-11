import GridData from '@components/GridData';
import { Icon } from '@iconify-icon/react';
import ediClient, { EDI_EXPORT_CWP_ENDPOINT } from '@lib/api/edi';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveErrorMessage } from './shared';

const createDefaultFilters = () => ({
  MasterAWB: '',
  AirlinesCode: '',
  FlightNumber: '',
  Origin: '',
  Destination: '',
  DateOfFlight: '',
});

const encodeDataValue = (value) => encodeURIComponent(String(value ?? ''));
const decodeDataValue = (value) => decodeURIComponent(value ?? '');
const emptyPreviewState = {
  mawb: '',
  loading: false,
  error: '',
  cargoImp: '',
  cargoXml: '',
  activeTab: 'cargo-imp',
};

export default function FhlDatatables() {
  const tableRef = useRef(null);
  const modalRef = useRef(null);
  const mountedRef = useRef(false);

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);
  const [previewState, setPreviewState] = useState(emptyPreviewState);

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
    const api = tableRef.current?.dt?.();
    if (!api?.table) {
      return undefined;
    }

    const tableNode = api.table().node();
    if (!tableNode) {
      return undefined;
    }

    const loadMessagePreview = async (mawb, activeTab) => {
      setPreviewState({
        mawb,
        loading: true,
        error: '',
        cargoImp: '',
        cargoXml: '',
        activeTab,
      });

      try {
        const payload = await ediClient.getFhlMessage(mawb);
        setPreviewState({
          mawb,
          loading: false,
          error: '',
          cargoImp: payload?.cargo_imp ?? '',
          cargoXml: payload?.cargo_xml ?? '',
          activeTab,
        });
      } catch (err) {
        console.error('Gagal memuat format FHL:', err);
        setPreviewState({
          mawb,
          loading: false,
          error: resolveErrorMessage(err, 'Gagal memuat format FHL'),
          cargoImp: '',
          cargoXml: '',
          activeTab,
        });
      }
    };

    const handleClick = (event) => {
      const target = event.target?.closest?.('button[data-action]');
      if (!target) {
        return;
      }

      const action = target.getAttribute('data-action');
      if (action === 'send-email') {
        return;
      }

      const encodedMawb = target.getAttribute('data-mawb');
      const mawb = decodeDataValue(encodedMawb);
      if (!mawb) {
        return;
      }

      const activeTab = action === 'cargo-xml' ? 'cargo-xml' : 'cargo-imp';
      void loadMessagePreview(mawb, activeTab);
    };

    tableNode.addEventListener('click', handleClick);
    return () => {
      tableNode.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) {
      return undefined;
    }

    const handleHidden = () => {
      setPreviewState(emptyPreviewState);
    };

    modalElement.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
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
      { data: 'noid', title: 'ID', visible: false, searchable: false },
      {
        data: 'MasterAWB',
        title: 'Master AWB',
        responsivePriority: 2,
      },
      { data: 'AirlinesCode', title: 'Airlines' },
      { data: 'FlightNumber', title: 'Flight' },
      { data: 'Origin', title: 'Origin', className: 'text-center' },
      { data: 'Destination', title: 'Destination', className: 'text-center' },
      { data: 'DateOfFlight', title: 'Flight Date', className: 'text-nowrap' },
      {
        data: null,
        title: 'Aksi',
        orderable: false,
        searchable: false,
        className: 'text-end text-nowrap',
        render: (_value, type, row) => {
          if (type !== 'display') {
            return '';
          }
          const mawb = row?.MasterAWB ?? '';
          const encodedMawb = encodeDataValue(mawb);
          return `
            <div class="btn-group btn-group-sm" role="group">
              <button
                type="button"
                class="btn btn-outline-primary"
                data-action="cargo-imp"
                data-mawb="${encodedMawb}"
                data-bs-toggle="modal"
                data-bs-target="#fhlMessageModal"
              >
                Cargo-IMP
              </button>
              <button
                type="button"
                class="btn btn-outline-info"
                data-action="cargo-xml"
                data-mawb="${encodedMawb}"
                data-bs-toggle="modal"
                data-bs-target="#fhlMessageModal"
              >
                Cargo-XML
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                data-action="send-email"
              >
                Send Email
              </button>
            </div>
          `;
        },
      },
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
        { targets: 8, orderable: false, searchable: false },
      ],
    }),
    []
  );

  const activePreviewText =
    previewState.activeTab === 'cargo-xml' ? previewState.cargoXml : previewState.cargoImp;

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

      <div
        className="modal fade"
        id="fhlMessageModal"
        tabIndex={-1}
        aria-labelledby="fhlMessageModalLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="fhlMessageModalLabel">
                FHL Message {previewState.mawb ? `- ${previewState.mawb}` : ''}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="nav-align-top mb-3">
                <ul className="nav nav-tabs" role="tablist">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${previewState.activeTab === 'cargo-imp' ? 'active' : ''}`}
                      onClick={() => setPreviewState((prev) => ({ ...prev, activeTab: 'cargo-imp' }))}
                    >
                      Cargo-IMP
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${previewState.activeTab === 'cargo-xml' ? 'active' : ''}`}
                      onClick={() => setPreviewState((prev) => ({ ...prev, activeTab: 'cargo-xml' }))}
                    >
                      Cargo-XML
                    </button>
                  </li>
                </ul>
              </div>

              {previewState.loading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  Memuat format FHL...
                </div>
              ) : previewState.error ? (
                <div className="alert alert-danger mb-0">{previewState.error}</div>
              ) : (
                <pre className="bg-light border rounded p-3 small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {activePreviewText || 'Data format belum tersedia.'}
                </pre>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
