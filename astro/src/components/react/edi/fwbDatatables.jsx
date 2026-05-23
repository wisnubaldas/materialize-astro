import GridData from '@components/GridData';
import FwbComposer from '@components/edi/FwbComposer';
import { Icon } from '@iconify-icon/react';
import ediClient, { EDI_EXPORT_CWP_ENDPOINT } from '@lib/api/edi';
import { showToast } from '@utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { promptEmailAddress, resolveErrorMessage } from './shared';

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
const emptyMessageState = {
  mawb: '',
  loading: false,
  error: '',
  cargoImp: '',
  cargoXml: '',
  activeTab: 'cargo-imp',
};
const emptyDetailState = {
  mawb: '',
  loading: false,
  error: '',
  data: null,
};

export default function FwbDatatables() {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);
  const messageModalRef = useRef(null);
  const detailModalRef = useRef(null);
  const savedMapRef = useRef({});
  const loadingStatusRef = useRef(new Set());

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);
  const [savedMap, setSavedMap] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [selectedMawb, setSelectedMawb] = useState('');
  const [messageState, setMessageState] = useState(emptyMessageState);
  const [detailState, setDetailState] = useState(emptyDetailState);
  const [tableRenderKey, setTableRenderKey] = useState(0);

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
    if (api?.rows) {
      api.rows({ page: 'current' }).invalidate('data').draw('page');
    }
  }, [savedMap]);

  useEffect(() => {
    if (viewMode !== 'table') {
      return undefined;
    }

    const refreshSavedStatus = async () => {
      const api = tableRef.current?.dt?.();
      if (!api?.rows) return;
      const rows = api.rows({ page: 'current' }).data()?.toArray?.() ?? [];
      const mawbs = rows
        .map((row) => String(row?.MasterAWB ?? '').trim())
        .filter(Boolean);

      const pending = mawbs.filter(
        (mawb) => !(mawb in savedMapRef.current) && !loadingStatusRef.current.has(mawb)
      );
      if (!pending.length) return;

      pending.forEach((mawb) => loadingStatusRef.current.add(mawb));
      await Promise.all(
        pending.map(async (mawb) => {
          try {
            await ediClient.getFwbByMawb(mawb);
            savedMapRef.current = { ...savedMapRef.current, [mawb]: true };
          } catch (err) {
            const status = err?.status ?? err?.response?.status;
            if (status === 404) {
              savedMapRef.current = { ...savedMapRef.current, [mawb]: false };
            } else {
              console.error('Gagal memuat status FWB:', err);
            }
          } finally {
            loadingStatusRef.current.delete(mawb);
          }
        })
      );
      setSavedMap({ ...savedMapRef.current });
    };

    const loadMessage = async (mawb, activeTab) => {
      setMessageState({
        mawb,
        loading: true,
        error: '',
        cargoImp: '',
        cargoXml: '',
        activeTab,
      });
      try {
        const payload = await ediClient.getFwbMessage(mawb);
        setMessageState({
          mawb,
          loading: false,
          error: '',
          cargoImp: payload?.cargo_imp ?? '',
          cargoXml: payload?.cargo_xml ?? '',
          activeTab,
        });
      } catch (err) {
        console.error('Gagal memuat FWB message:', err);
        setMessageState({
          mawb,
          loading: false,
          error: resolveErrorMessage(err, 'Gagal memuat format FWB'),
          cargoImp: '',
          cargoXml: '',
          activeTab,
        });
      }
    };

    const loadDetail = async (mawb) => {
      setDetailState({ mawb, loading: true, error: '', data: null });
      try {
        const payload = await ediClient.getFwbByMawb(mawb);
        setDetailState({ mawb, loading: false, error: '', data: payload });
      } catch (err) {
        console.error('Gagal memuat detail FWB:', err);
        setDetailState({
          mawb,
          loading: false,
          error: resolveErrorMessage(err, 'Gagal memuat detail FWB'),
          data: null,
        });
      }
    };

    const handleClick = (event) => {
      const target = event.target?.closest?.('button[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const mawb = decodeDataValue(target.getAttribute('data-mawb'));
      if (!mawb) return;

      if (action === 'create') {
        setSelectedMawb(mawb);
        setViewMode('compose');
        return;
      }

      if (action === 'send-email') {
        const airlinesCode = decodeDataValue(target.getAttribute('data-airlines-code'));

        showToast({
          type: 'info',
          title: 'FWB Email',
          message: 'Memuat data email dan format FWB...',
        });

        Promise.all([
          ediClient.lookupAirlineEmail(airlinesCode).catch((err) => {
            console.error('Failed to lookup airline email:', err);
            return { data: '' };
          }),
          ediClient.getFwbMessage(mawb),
        ])
          .then(async ([emailRes, messageRes]) => {
            const defaultEmail = emailRes?.data || '';
            const messageText = messageRes?.cargo_imp || '';

            if (!messageText) {
              showToast({
                type: 'warning',
                title: 'FWB Email',
                message: 'Gagal men-generate format FWB untuk email.',
              });
              return;
            }

            const email = await promptEmailAddress('Email Send FWB', defaultEmail);
            if (!email) {
              return;
            }

            showToast({
              type: 'info',
              title: 'FWB Email',
              message: 'Mengirim email...',
            });

            await ediClient.sendEmailEdi({
              email,
              message: messageText,
              data: { MasterAWB: mawb },
              edi: 'FWB',
            });

            showToast({
              type: 'success',
              title: 'FWB Email',
              message: 'Email FWB berhasil dikirim.',
            });
          })
          .catch((err) => {
            console.error('Failed to send FWB email:', err);
            showToast({
              type: 'danger',
              title: 'FWB Email',
              message: resolveErrorMessage(err, 'Gagal mengirim email FWB.'),
            });
          });
        return;
      }

      if (action === 'detail') {
        void loadDetail(mawb);
        return;
      }

      const isSaved = savedMapRef.current[mawb] === true;
      if (!isSaved) {
        return;
      }
      const activeTab = action === 'cargo-xml' ? 'cargo-xml' : 'cargo-imp';
      void loadMessage(mawb, activeTab);
    };

    const handleDraw = () => {
      void refreshSavedStatus();
    };

    let attachedApi = null;
    let attachedNode = null;
    let pollTimer = null;

    const tryAttach = () => {
      const api = tableRef.current?.dt?.();
      const tableNode = api?.table?.()?.node?.();
      if (!api || !tableNode) return false;

      attachedApi = api;
      attachedNode = tableNode;
      attachedNode.addEventListener('click', handleClick);
      if (attachedApi.on) attachedApi.on('draw', handleDraw);
      void refreshSavedStatus();
      return true;
    };

    if (!tryAttach()) {
      pollTimer = window.setInterval(() => {
        if (tryAttach() && pollTimer) {
          window.clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 250);
    }

    return () => {
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (attachedNode) {
        attachedNode.removeEventListener('click', handleClick);
      }
      if (attachedApi?.off) {
        attachedApi.off('draw', handleDraw);
      }
    };
  }, [viewMode, tableRenderKey]);

  useEffect(() => {
    const modalElement = messageModalRef.current;
    if (!modalElement) {
      return undefined;
    }
    const reset = () => setMessageState(emptyMessageState);
    modalElement.addEventListener('hidden.bs.modal', reset);
    return () => modalElement.removeEventListener('hidden.bs.modal', reset);
  }, []);

  useEffect(() => {
    const modalElement = detailModalRef.current;
    if (!modalElement) {
      return undefined;
    }
    const reset = () => setDetailState(emptyDetailState);
    modalElement.addEventListener('hidden.bs.modal', reset);
    return () => modalElement.removeEventListener('hidden.bs.modal', reset);
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
    savedMapRef.current = {};
    loadingStatusRef.current.clear();
    setSavedMap({});
  };

  const handleSaved = (saved) => {
    const mawb = String(saved?.mawb ?? selectedMawb ?? '').trim();
    if (mawb) {
      savedMapRef.current = { ...savedMapRef.current, [mawb]: true };
      setSavedMap({ ...savedMapRef.current });
    }
    setViewMode('table');
    setSelectedMawb('');
    setTableRenderKey((prev) => prev + 1);
    tableRef.current?.reload?.(false);
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
        className: 'text-end',
        render: (_value, type, row) => {
          if (type !== 'display') {
            return '';
          }

          const mawb = String(row?.MasterAWB ?? '').trim();
          const encodedMawb = encodeDataValue(mawb);
          const isSaved = savedMapRef.current[mawb] === true;
          const disabled = isSaved ? '' : 'disabled';

          return `
            <div class="d-inline-flex flex-wrap justify-content-end gap-1" role="group">
              <button type="button" class="btn btn-sm btn-outline-primary" data-action="create" data-mawb="${encodedMawb}">
                Buat FWB
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                data-action="cargo-imp"
                data-mawb="${encodedMawb}"
                ${disabled}
                data-bs-toggle="modal"
                data-bs-target="#fwbMessageModal"
              >
                Cargo-IMP
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-info"
                data-action="cargo-xml"
                data-mawb="${encodedMawb}"
                ${disabled}
                data-bs-toggle="modal"
                data-bs-target="#fwbMessageModal"
              >
                Cargo-XML
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                data-action="send-email"
                data-mawb="${encodedMawb}"
                data-airlines-code="${encodeDataValue(row?.AirlinesCode)}"
                ${disabled}
              >
                Send Email
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-dark"
                data-action="detail"
                data-mawb="${encodedMawb}"
                data-bs-toggle="modal"
                data-bs-target="#fwbDetailModal"
              >
                Detail FWB
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
      order: [[6, 'desc']],
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
        { targets: 7, orderable: false, searchable: false },
      ],
    }),
    []
  );

  if (viewMode === 'compose') {
    return (
      <FwbComposer
        mawb={selectedMawb}
        onBack={() => {
          setViewMode('table');
          setSelectedMawb('');
          setTableRenderKey((prev) => prev + 1);
        }}
        onSaved={handleSaved}
      />
    );
  }

  const activeMessage =
    messageState.activeTab === 'cargo-xml' ? messageState.cargoXml : messageState.cargoImp;

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
          key={`fwb-grid-${tableRenderKey}`}
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
        id="fwbMessageModal"
        tabIndex={-1}
        aria-labelledby="fwbMessageModalLabel"
        aria-hidden="true"
        ref={messageModalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="fwbMessageModalLabel">
                FWB Message {messageState.mawb ? `- ${messageState.mawb}` : ''}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="nav-align-top mb-3">
                <ul className="nav nav-tabs" role="tablist">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${messageState.activeTab === 'cargo-imp' ? 'active' : ''}`}
                      onClick={() => setMessageState((prev) => ({ ...prev, activeTab: 'cargo-imp' }))}
                    >
                      Cargo-IMP
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${messageState.activeTab === 'cargo-xml' ? 'active' : ''}`}
                      onClick={() => setMessageState((prev) => ({ ...prev, activeTab: 'cargo-xml' }))}
                    >
                      Cargo-XML
                    </button>
                  </li>
                </ul>
              </div>
              {messageState.loading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  Memuat format FWB...
                </div>
              ) : messageState.error ? (
                <div className="alert alert-danger mb-0">{messageState.error}</div>
              ) : (
                <pre className="bg-light border rounded p-3 small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {activeMessage || 'Data format belum tersedia.'}
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

      <div
        className="modal fade"
        id="fwbDetailModal"
        tabIndex={-1}
        aria-labelledby="fwbDetailModalLabel"
        aria-hidden="true"
        ref={detailModalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="fwbDetailModalLabel">
                Detail FWB {detailState.mawb ? `- ${detailState.mawb}` : ''}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {detailState.loading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  Memuat detail FWB...
                </div>
              ) : detailState.error ? (
                <div className="alert alert-danger mb-0">{detailState.error}</div>
              ) : detailState.data ? (
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <tbody>
                      {Object.entries(detailState.data).map(([key, value]) => (
                        <tr key={key}>
                          <th className="text-nowrap">{key}</th>
                          <td>{value === null || value === undefined ? '-' : String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted">Belum ada data FWB tersimpan.</div>
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
