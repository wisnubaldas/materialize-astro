import GridData from '@components/GridData';
import ediClient, { EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT } from '@lib/api/edi';
import { showToast } from '@utils';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { promptEmailAddress, resolveErrorMessage } from './shared';

const dateRenderer = (value, type, format = 'DD MMM YYYY') => {
  if (type !== 'display' && type !== 'filter') {
    return value;
  }

  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(format) : value;
};

const createDefaultFilters = () => ({
  number: '',
  mawb: '',
  airlines_code: '',
  flight_date: '',
  origin: '',
  dest: '',
});

const createEmptyDetail = () => ({
  number: '',
  mawb: '',
  airlines_code: '',
  flight_date: '',
  uld_type: '',
  uld_number: '',
});
const createInitialFfmPreview = () => ({
  headerId: null,
  buildupNumber: '',
  loading: false,
  error: '',
  generated: false,
  cargoImp: '',
  cargoXml: '',
  activeTab: 'cargo-imp',
  missingFields: [],
  warnings: [],
});

const encodeDataValue = (value) => encodeURIComponent(String(value ?? ''));
const decodeDataValue = (value) => decodeURIComponent(value ?? '');
const getRowValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
};
const formatSummary = (values) => {
  const unique = [...new Set((values ?? []).filter(Boolean).map((value) => String(value).trim()))];
  if (!unique.length) {
    return '';
  }
  return unique.join(', ');
};
/**
 * Normalize Cargo-IMP record separators for validators that require CRLF.
 *
 * @param {string} value - Raw Cargo-IMP text from backend.
 * @returns {string} Cargo-IMP text using CRLF and ending with one CRLF.
 */
const normalizeCargoImpLineEndings = (value) => {
  const normalized = String(value ?? '').replace(/\r\n|\r|\n/g, '\r\n').replace(/(\r\n)+$/g, '');
  return normalized ? `${normalized}\r\n` : '';
};

export default function FfmDatatables() {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);
  const detailModalRef = useRef(null);
  const ffmPreviewModalRef = useRef(null);
  const detailPreviewRef = useRef({});
  const detailLoadingRef = useRef(new Set());
  const ffmPreviewCacheRef = useRef({});

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);
  const [detailData, setDetailData] = useState(createEmptyDetail);
  const [detailPreviewMap, setDetailPreviewMap] = useState({});
  const [ffmPreview, setFfmPreview] = useState(createInitialFfmPreview);

  const handleCopyFfmPreview = useCallback(async () => {
    const rawText = ffmPreview.activeTab === 'cargo-xml' ? ffmPreview.cargoXml : ffmPreview.cargoImp;
    const textToCopy =
      ffmPreview.activeTab === 'cargo-imp' ? normalizeCargoImpLineEndings(rawText) : rawText;

    if (!textToCopy) {
      showToast({
        type: 'warning',
        title: 'FFM Message',
        message: 'Tidak ada message untuk disalin.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast({
        type: 'success',
        title: 'FFM Message',
        message:
          ffmPreview.activeTab === 'cargo-imp'
            ? 'Cargo-IMP disalin dengan line ending CRLF.'
            : 'Cargo-XML berhasil disalin.',
      });
    } catch (error) {
      console.error('Gagal menyalin FFM message:', error);
      showToast({
        type: 'danger',
        title: 'FFM Message',
        message: 'Gagal menyalin message ke clipboard.',
      });
    }
  }, [ffmPreview.activeTab, ffmPreview.cargoImp, ffmPreview.cargoXml]);

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
    setDetailPreviewMap({});
    detailPreviewRef.current = {};
    detailLoadingRef.current.clear();
    ffmPreviewCacheRef.current = {};
    setFfmPreview(createInitialFfmPreview());
  };

  const loadDetailPreview = useCallback(async (headerId) => {
    if (!Number.isFinite(headerId) || headerId <= 0) {
      return;
    }

    if (detailPreviewRef.current[headerId] || detailLoadingRef.current.has(headerId)) {
      return;
    }

    detailLoadingRef.current.add(headerId);
    try {
      const details = await ediClient.ffmBuildUpDetail(headerId);
      const rows = Array.isArray(details) ? details : [];
      const preview = {
        mawb: formatSummary(rows.map((item) => item?.mawb)),
        uld_type: formatSummary(rows.map((item) => item?.uld_type)),
        uld_number: formatSummary(rows.map((item) => item?.uld_number)),
      };

      setDetailPreviewMap((prev) => {
        const next = { ...prev, [headerId]: preview };
        detailPreviewRef.current = next;
        return next;
      });
    } catch (error) {
      console.error('Gagal memuat preview detail build up:', error);
      setDetailPreviewMap((prev) => {
        const next = { ...prev, [headerId]: { mawb: '', uld_type: '', uld_number: '' } };
        detailPreviewRef.current = next;
        return next;
      });
    } finally {
      detailLoadingRef.current.delete(headerId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let tableApi = null;
    let pollTimer = null;

    const requestCurrentPagePreview = () => {
      const api = tableRef.current?.dt?.();
      if (!api?.rows) {
        return false;
      }

      tableApi = api;
      const rows = api.rows({ page: 'current' }).data()?.toArray?.() ?? [];
      rows.forEach((row) => {
        const headerId = Number(row?.id);
        if (Number.isFinite(headerId)) {
          void loadDetailPreview(headerId);
        }
      });
      return true;
    };

    if (!requestCurrentPagePreview()) {
      pollTimer = window.setInterval(() => {
        if (requestCurrentPagePreview() && pollTimer) {
          window.clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 250);
    }

    const handleDraw = () => {
      requestCurrentPagePreview();
    };

    if (tableApi?.on) {
      tableApi.on('draw', handleDraw);
    }

    return () => {
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (tableApi?.off) {
        tableApi.off('draw', handleDraw);
      }
    };
  }, [loadDetailPreview, activeFilters]);

  useEffect(() => {
    const api = tableRef.current?.dt?.();
    if (api?.rows) {
      api.rows({ page: 'current' }).invalidate('data').draw('page');
    }
  }, [detailPreviewMap]);

  useEffect(() => {
    const modalElement = ffmPreviewModalRef.current;
    if (!modalElement) {
      return undefined;
    }

    const openPreview = async (headerId, buildupNumber, activeTab = 'cargo-imp') => {
      if (!Number.isFinite(headerId) || headerId <= 0) {
        showToast({
          type: 'danger',
          title: 'FFM Cargo-IMP',
          message: 'Header build up tidak valid.',
        });
        setFfmPreview({ ...createInitialFfmPreview(), activeTab });
        return;
      }

      const cached = ffmPreviewCacheRef.current?.[headerId];
      if (cached) {
        setFfmPreview({
          headerId,
          buildupNumber,
          loading: false,
          error: '',
          generated: Boolean(cached.generated && cached.cargo_imp),
          cargoImp: cached.cargo_imp || '',
          cargoXml: cached.cargo_xml || '',
          activeTab,
          missingFields: Array.isArray(cached.missing_fields) ? cached.missing_fields : [],
          warnings: Array.isArray(cached.warnings) ? cached.warnings : [],
        });
        return;
      }

      setFfmPreview({
        headerId,
        buildupNumber,
        loading: true,
        error: '',
        generated: false,
        cargoImp: '',
        cargoXml: '',
        activeTab,
        missingFields: [],
        warnings: [],
      });

      try {
        const response = await ediClient.ffmBuildUpPreview(headerId);
        ffmPreviewCacheRef.current = {
          ...ffmPreviewCacheRef.current,
          [headerId]: response,
        };
        setFfmPreview({
          headerId,
          buildupNumber: response?.buildup_number || buildupNumber,
          loading: false,
          error: '',
          generated: Boolean(response?.generated && response?.cargo_imp),
          cargoImp: response?.cargo_imp || '',
          cargoXml: response?.cargo_xml || '',
          activeTab,
          missingFields: Array.isArray(response?.missing_fields) ? response.missing_fields : [],
          warnings: Array.isArray(response?.warnings) ? response.warnings : [],
        });
      } catch (error) {
        console.error('Gagal memuat preview FFM Cargo-IMP:', error);
        showToast({
          type: 'danger',
          title: 'FFM Cargo-IMP',
          message: error?.response?.data?.detail || error?.message || 'Gagal memuat preview FFM.',
        });
        setFfmPreview({
          ...createInitialFfmPreview(),
          activeTab,
          error: error?.response?.data?.detail || error?.message || 'Gagal memuat preview FFM.',
        });
      }
    };

    const handleShow = (event) => {
      const button = event?.relatedTarget;
      const headerId = Number(button?.getAttribute('data-header-id'));
      const buildupNumber = decodeDataValue(button?.getAttribute('data-number'));
      const format = button?.getAttribute('data-format');
      const activeTab = format === 'cargo-xml' ? 'cargo-xml' : 'cargo-imp';
      void openPreview(headerId, buildupNumber, activeTab);
    };

    const handleHidden = () => {
      setFfmPreview(createInitialFfmPreview());
    };

    modalElement.addEventListener('show.bs.modal', handleShow);
    modalElement.addEventListener('hidden.bs.modal', handleHidden);

    return () => {
      modalElement.removeEventListener('show.bs.modal', handleShow);
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let attachedNode = null;
    let pollTimer = null;

    const handleClick = (event) => {
      const target = event.target?.closest?.('button[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      if (action !== 'send-email') return;

      const headerId = Number(target.getAttribute('data-header-id'));
      const number = decodeDataValue(target.getAttribute('data-number'));
      const airlinesCode = decodeDataValue(target.getAttribute('data-airlines-code'));

      if (!headerId) {
        showToast({
          type: 'warning',
          title: 'FFM Email',
          message: 'Data FFM build up tidak valid (Missing ID).',
        });
        return;
      }

      showToast({
        type: 'info',
        title: 'FFM Email',
        message: 'Memuat data email dan format FFM...',
      });

      Promise.all([
        ediClient.lookupAirlineEmail(airlinesCode).catch((err) => {
          console.error('Failed to lookup airline email:', err);
          return { data: '' };
        }),
        ediClient.ffmBuildUpPreview(headerId),
      ])
        .then(async ([emailRes, messageRes]) => {
          const defaultEmail = emailRes?.data || '';
          const messageText = messageRes?.cargo_imp || '';

          if (!messageText) {
            showToast({
              type: 'warning',
              title: 'FFM Email',
              message: 'Gagal men-generate format FFM untuk email.',
            });
            return;
          }

          const email = await promptEmailAddress('Email Send FFM', defaultEmail);
          if (!email) {
            return;
          }

          showToast({
            type: 'info',
            title: 'FFM Email',
            message: 'Mengirim email format FFM...',
          });

          try {
            await ediClient.sendEmailEdi({
              email,
              message: messageText,
              data: { number },
              edi: 'FFM',
            });
            showToast({
              type: 'success',
              title: 'FFM Email',
              message: 'Email format FFM berhasil dikirim.',
            });
          } catch (err) {
            console.error('Failed to send FFM email:', err);
            showToast({
              type: 'danger',
              title: 'FFM Email',
              message: resolveErrorMessage(err, 'Gagal mengirim email format FFM.'),
            });
          }
        })
        .catch((err) => {
          console.error('Failed to prepare FFM email:', err);
          showToast({
            type: 'danger',
            title: 'FFM Email',
            message: resolveErrorMessage(err, 'Gagal menyiapkan data email FFM.'),
          });
        });
    };

    const tryAttach = () => {
      const api = tableRef.current?.dt?.();
      const tableNode = api?.table?.()?.node?.();
      if (!tableNode) return false;
      attachedNode = tableNode;
      attachedNode.addEventListener('click', handleClick);
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
    };
  }, []);

  useEffect(() => {
    const modalElement = detailModalRef.current;
    if (!modalElement) {
      return undefined;
    }

    const handleShow = (event) => {
      const button = event?.relatedTarget;
      if (!button) {
        setDetailData(createEmptyDetail());
        return;
      }

      setDetailData({
        number: decodeDataValue(button.getAttribute('data-number')),
        mawb: decodeDataValue(button.getAttribute('data-mawb')),
        airlines_code: decodeDataValue(button.getAttribute('data-airlines-code')),
        flight_date: decodeDataValue(button.getAttribute('data-flight-date')),
        uld_type: decodeDataValue(button.getAttribute('data-uld-type')),
        uld_number: decodeDataValue(button.getAttribute('data-uld-number')),
      });
    };

    const handleHidden = () => {
      setDetailData(createEmptyDetail());
    };

    modalElement.addEventListener('show.bs.modal', handleShow);
    modalElement.addEventListener('hidden.bs.modal', handleHidden);

    return () => {
      modalElement.removeEventListener('show.bs.modal', handleShow);
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        data: null,
        title: 'BuildUp No',
        className: 'text-uppercase',
        responsivePriority: 1,
        render: (_value, type, row) => getRowValue(row, ['number', 'number_build_up']),
      },
      {
        data: null,
        title: 'MAWB',
        className: 'text-uppercase',
        render: (_value, type, row) => {
          const headerId = Number(row?.id);
          const value = detailPreviewRef.current?.[headerId]?.mawb ?? '';
          return value || (type === 'display' ? '-' : '');
        },
      },
      {
        data: null,
        title: 'airlines',
        className: 'text-uppercase',
        render: (_value, type, row) => getRowValue(row, ['airlines_code', 'airline_code', 'airline']),
      },
      {
        data: null,
        title: 'flight date',
        className: 'text-nowrap',
        render: (_value, type, row) => dateRenderer(getRowValue(row, ['flight_date']), type),
      },
      {
        data: null,
        title: 'ULD Type',
        className: 'text-uppercase',
        render: (_value, type, row) => {
          const headerId = Number(row?.id);
          const value = detailPreviewRef.current?.[headerId]?.uld_type ?? '';
          return value || (type === 'display' ? '-' : '');
        },
      },
      {
        data: null,
        title: 'ULD Number',
        className: 'text-uppercase',
        render: (_value, type, row) => {
          const headerId = Number(row?.id);
          const value = detailPreviewRef.current?.[headerId]?.uld_number ?? '';
          return value || (type === 'display' ? '-' : '');
        },
      },
      {
        data: null,
        title: 'Actions',
        className: 'text-end text-nowrap',
        orderable: false,
        searchable: false,
        render: (_value, type, row) => {
          if (type !== 'display') {
            return '';
          }
          const headerId = Number(row?.id);
          const preview = detailPreviewRef.current?.[headerId] ?? {};
          return `
            <div class="d-inline-flex flex-wrap justify-content-end gap-1" role="group">
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                data-bs-toggle="modal"
                data-bs-target="#ffmDetailModal"
                data-number="${encodeDataValue(getRowValue(row, ['number', 'number_build_up']))}"
                data-mawb="${encodeDataValue(preview?.mawb)}"
                data-airlines-code="${encodeDataValue(
                  getRowValue(row, ['airlines_code', 'airline_code', 'airline'])
                )}"
                data-flight-date="${encodeDataValue(getRowValue(row, ['flight_date']))}"
                data-uld-type="${encodeDataValue(preview?.uld_type)}"
                data-uld-number="${encodeDataValue(preview?.uld_number)}"
              >
                Detail
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                data-bs-toggle="modal"
                data-bs-target="#ffmCargoImpModal"
                data-header-id="${Number.isFinite(headerId) ? headerId : ''}"
                data-number="${encodeDataValue(getRowValue(row, ['number', 'number_build_up']))}"
                data-format="cargo-imp"
              >
                Cargo-IMP
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-info"
                data-bs-toggle="modal"
                data-bs-target="#ffmCargoImpModal"
                data-header-id="${Number.isFinite(headerId) ? headerId : ''}"
                data-number="${encodeDataValue(getRowValue(row, ['number', 'number_build_up']))}"
                data-format="cargo-xml"
              >
                Cargo-XML
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                data-action="send-email"
                data-header-id="${Number.isFinite(headerId) ? headerId : ''}"
                data-number="${encodeDataValue(getRowValue(row, ['number', 'number_build_up']))}"
                data-airlines-code="${encodeDataValue(getRowValue(row, ['airlines_code', 'airline_code', 'airline']))}"
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

  const tableOptions = useMemo(() => {
    const defs = [];
    const detailIndex = columns.findIndex((col) => col.title === 'Actions');
    if (detailIndex >= 0) {
      defs.push({ targets: detailIndex, orderable: false, searchable: false });
    }

    return {
      order: [[3, 'desc']],
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
            <h5 className="mb-1 fw-bold text-uppercase">Data Build Up (FFM)</h5>
            <p className="mb-0 text-muted">
              Data table disesuaikan untuk BuildUp No, MAWB, airline, flight date, dan ULD.
            </p>
          </div>
          <div className="text-muted small">
            Endpoint: {EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT}
          </div>
        </div>

        <form onSubmit={handleApply}>
          <div className="row g-2 mb-3">
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Build Up No</label>
              <input
                type="text"
                name="number"
                className="form-control"
                placeholder="BL04112026ACKS"
                value={formFilters.number}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">MAWB</label>
              <input
                type="text"
                name="mawb"
                className="form-control"
                placeholder="023-50032721"
                value={formFilters.mawb}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Airline</label>
              <input
                type="text"
                name="airlines_code"
                className="form-control"
                placeholder="FX"
                value={formFilters.airlines_code}
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
                name="origin"
                className="form-control"
                placeholder="CKG"
                value={formFilters.origin}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Destination</label>
              <input
                type="text"
                name="dest"
                className="form-control"
                placeholder="MEM"
                value={formFilters.dest}
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
          ajaxEndpoint={EDI_FFM_BUILD_UP_DATATABLE_ENDPOINT}
          filters={activeFilters}
          options={tableOptions}
          className="table-bordered table-striped align-middle"
        />
      </div>

      <div
        className="modal fade"
        id="ffmDetailModal"
        tabIndex={-1}
        aria-labelledby="ffmDetailModalLabel"
        aria-hidden="true"
        ref={detailModalRef}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="ffmDetailModalLabel">
                Detail BuildUp {detailData.number ? ` ${detailData.number}` : ''}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                  <tbody>
                    <tr>
                      <th style={{ width: '180px' }}>BuildUp No</th>
                      <td>{detailData.number || '-'}</td>
                    </tr>
                    <tr>
                      <th>MAWB</th>
                      <td>{detailData.mawb || '-'}</td>
                    </tr>
                    <tr>
                      <th>airlines</th>
                      <td>{detailData.airlines_code || '-'}</td>
                    </tr>
                    <tr>
                      <th>flight date</th>
                      <td>{dateRenderer(detailData.flight_date, 'display') || '-'}</td>
                    </tr>
                    <tr>
                      <th>ULD Type</th>
                      <td>{detailData.uld_type || '-'}</td>
                    </tr>
                    <tr>
                      <th>ULD Number</th>
                      <td>{detailData.uld_number || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
        id="ffmCargoImpModal"
        tabIndex={-1}
        aria-labelledby="ffmCargoImpModalLabel"
        aria-hidden="true"
        ref={ffmPreviewModalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="ffmCargoImpModalLabel">
                FFM Message {ffmPreview.buildupNumber ? `- ${ffmPreview.buildupNumber}` : ''}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="nav-align-top mb-3">
                <ul className="nav nav-tabs" role="tablist">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${ffmPreview.activeTab === 'cargo-imp' ? 'active' : ''}`}
                      onClick={() => setFfmPreview((prev) => ({ ...prev, activeTab: 'cargo-imp' }))}
                    >
                      Cargo-IMP
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${ffmPreview.activeTab === 'cargo-xml' ? 'active' : ''}`}
                      onClick={() => setFfmPreview((prev) => ({ ...prev, activeTab: 'cargo-xml' }))}
                    >
                      Cargo-XML
                    </button>
                  </li>
                </ul>
              </div>
              {ffmPreview.loading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  Memuat preview FFM...
                </div>
              ) : ffmPreview.error ? (
                <div className="alert alert-danger mb-0">{ffmPreview.error}</div>
              ) : (
                <>
                  {ffmPreview.missingFields.length ? (
                    <div className="alert alert-warning" role="alert">
                      <div className="fw-semibold mb-1">Data belum lengkap untuk FFM:</div>
                      <ul className="mb-0 ps-3">
                        {ffmPreview.missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {ffmPreview.warnings.length ? (
                    <div className="alert alert-info" role="alert">
                      <div className="fw-semibold mb-1">Catatan generator:</div>
                      <ul className="mb-0 ps-3">
                        {ffmPreview.warnings.map((warning, idx) => (
                          <li key={`${warning}-${idx}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {ffmPreview.generated && (ffmPreview.cargoImp || ffmPreview.cargoXml) ? (
                    <pre className="bg-light border rounded p-3 small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {ffmPreview.activeTab === 'cargo-xml'
                        ? ffmPreview.cargoXml || 'Cargo-XML belum tersedia.'
                        : ffmPreview.cargoImp || 'Cargo-IMP belum tersedia.'}
                    </pre>
                  ) : (
                    <p className="mb-0 text-muted">
                      Format belum dapat digenerate. Lengkapi data yang ditandai terlebih dahulu.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopyFfmPreview}
                disabled={ffmPreview.loading || !ffmPreview.generated}
              >
                Copy Message
              </button>
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
