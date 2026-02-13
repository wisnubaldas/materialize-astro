import { showToast } from '@js/utils';
import warehouseClient from '@lib/api/warehouse';
import { useState } from 'react';

const splitAwbInput = (value) => {
  if (!value) {
    return [];
  }

  const tokens = String(value)
    .split(/[\s,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  tokens.forEach((awb) => {
    const key = awb.toUpperCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(awb);
  });

  return unique;
};

const MASTER_FIELDS = [
  { key: 'MasterAWB', label: 'Master AWB', type: 'text', className: 'text-nowrap' },
  { key: 'total', label: 'Total Pieces', type: 'text', className: 'text-end' },
  { key: 'Volume', label: 'Volume', type: 'text', className: 'text-end' },
  { key: 'AirlinesCode', label: 'Airlines Code', type: 'text', className: 'text-nowrap' },
  { key: 'FlightNo', label: 'Flight No', type: 'text', className: 'text-nowrap' },
  { key: 'Origin', label: 'Origin', type: 'text', className: 'text-nowrap' },
  { key: 'Destination', label: 'Destination', type: 'text', className: 'text-nowrap' },
  { key: 'DateOfFlight', label: 'Date Of Flight', type: 'text', className: 'text-nowrap' },
  { key: 'KindOfGood', label: 'Kind Of Good', type: 'text', className: 'text-nowrap' },
  {
    key: 'aircraft_registration',
    label: 'Aircraft Registration',
    type: 'text',
    className: 'text-nowrap',
  },
  { key: 'route', label: 'Route', type: 'text', className: 'text-nowrap' },
];

const DETAIL_FIELDS = [
  { key: 'uld_type', label: 'ULD Type', type: 'text', className: 'text-nowrap' },
  { key: 'uld_number', label: 'ULD Number', type: 'text', className: 'text-nowrap' },
  { key: 'Pieces', label: 'Pieces', type: 'text', className: 'text-end' },
  { key: 'Weight', label: 'Weight', type: 'text', className: 'text-end' },
  { key: 'uld_owner', label: 'ULD Owner', type: 'text', className: 'text-nowrap' },
];

const createEmptyDetail = () => ({
  uld_type: '',
  uld_number: '',
  Pieces: '',
  Weight: '',
  uld_owner: '',
});

const createDetailFromItem = (item) => ({
  uld_type: item?.uld_type ?? '',
  uld_number: item?.uld_number ?? '',
  Pieces: item?.Pieces ?? '',
  Weight: item?.Weight ?? '',
  uld_owner: item?.uld_owner ?? '',
});

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDefaultTotalFromDetails = (details) => {
  const numericPieces = details
    .map((detail) => parseNumeric(detail?.Pieces))
    .filter((value) => value !== null);

  if (!numericPieces.length) {
    return details[0]?.Pieces ?? '';
  }

  const sum = numericPieces.reduce((acc, value) => acc + value, 0);
  return Number.isInteger(sum) ? String(sum) : String(sum);
};

const mapMasterRows = (data) => {
  const groups = new Map();

  (Array.isArray(data) ? data : []).forEach((item, index) => {
    const normalizedMaster = String(item?.MasterAWB ?? '').trim();
    const groupKey = normalizedMaster || `__missing-master-${index}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        MasterAWB: item?.MasterAWB ?? '',
        total: item?.total ?? item?.Total ?? '',
        Volume: item?.Volume ?? '',
        AirlinesCode: item?.AirlinesCode ?? '',
        FlightNo: item?.FlightNo ?? '',
        Origin: item?.Origin ?? '',
        Destination: item?.Destination ?? '',
        DateOfFlight: item?.DateOfFlight ?? '',
        KindOfGood: item?.KindOfGood ?? '',
        aircraft_registration: item?.aircraft_registration ?? '',
        route: item?.route ?? '',
        details: [],
      });
    }

    groups.get(groupKey).details.push(createDetailFromItem(item));
  });

  return Array.from(groups.values()).map((row) => {
    const details = row.details.length ? row.details : [createEmptyDetail()];
    return {
      ...row,
      total: row.total || getDefaultTotalFromDetails(details),
      details,
    };
  });
};

const toText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const toNumericString = (value, fallback = '0') => {
  const parsed = parseNumeric(value);
  if (parsed === null) {
    return fallback;
  }
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
};

const parseMasterAwb = (masterAwb, fallbackPrefix = '') => {
  const raw = toText(masterAwb).replace(/\s+/g, '');
  const [left, ...rest] = raw.split('-');
  const mergedRight = rest.join('');

  const fromAwbPrefix = (left || '').replace(/\D/g, '').slice(0, 3);
  const fromAirline = toText(fallbackPrefix).replace(/\D/g, '').slice(0, 3);
  const prefix = fromAwbPrefix || fromAirline;

  const fromAwbNumber = (mergedRight || (raw.length > 3 ? raw.slice(3) : '')).replace(/\D/g, '');
  return {
    mawb_prefix: prefix,
    mawb_number: fromAwbNumber,
  };
};

const isAcceptedFlightDate = (value) => {
  const text = toText(value);
  if (!text) {
    return false;
  }
  return (
    /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(text) ||
    /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(text)
  );
};

const mapRowsToManifestPayload = (rows) => {
  const flightMap = new Map();
  const uldMap = new Map();
  const mawbMap = new Map();
  let ignoredMasters = 0;
  let ignoredDetails = 0;

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const airlineCode = toText(row?.AirlinesCode);
    const flightNumber = toText(row?.FlightNo);
    const flightDate = toText(row?.DateOfFlight);
    const pointOfLoading = toText(row?.Origin);
    const pointOfUnloading = toText(row?.Destination);
    const aircraftRegistration = toText(row?.aircraft_registration);
    const route = toText(row?.route);
    const natureOfGoods = toText(row?.KindOfGood);

    if (
      !airlineCode ||
      !flightNumber ||
      !flightDate ||
      !isAcceptedFlightDate(flightDate) ||
      !pointOfLoading ||
      !pointOfUnloading
    ) {
      ignoredMasters += 1;
      return;
    }

    const details = Array.isArray(row?.details) ? row.details : [];
    const mawbInfo = parseMasterAwb(row?.MasterAWB, airlineCode);
    if (!mawbInfo.mawb_prefix || !mawbInfo.mawb_number) {
      ignoredMasters += 1;
      return;
    }
    const rowTotalPieces = parseNumeric(row?.total);
    const fallbackTotalPieces = rowTotalPieces ?? parseNumeric(getDefaultTotalFromDetails(details)) ?? 0;

    const flightKey = `${flightNumber}|${flightDate}`;
    if (!flightMap.has(flightKey)) {
      flightMap.set(flightKey, {
        airline_code: airlineCode,
        flight_number: flightNumber,
        flight_date: flightDate,
        aircraft_registration: aircraftRegistration,
        point_of_loading: pointOfLoading,
        point_of_unloading: pointOfUnloading,
        total_pieces: 0,
        total_weight_kg: 0,
        source_document: 'manual-form',
        raw_text: '',
      });
    }

    let masterPiecesAccumulated = 0;
    details.forEach((detail) => {
      const uldType = toText(detail?.uld_type);
      const uldNumber = toText(detail?.uld_number);
      const uldOwner = toText(detail?.uld_owner) || 'FX';
      if (!uldType || !uldNumber || !pointOfUnloading) {
        ignoredDetails += 1;
        return;
      }

      const uldKey = `${flightKey}|${uldType}|${uldNumber}`;
      if (!uldMap.has(uldKey)) {
        uldMap.set(uldKey, {
          flight_number: flightNumber,
          flight_date: flightDate,
          uld_type: uldType,
          uld_number: uldNumber,
          uld_owner: uldOwner,
          destination: pointOfUnloading,
          remarks: '',
        });
      }

      const detailPieces = parseNumeric(detail?.Pieces) ?? 0;
      const detailWeight = parseNumeric(detail?.Weight) ?? 0;
      masterPiecesAccumulated += detailPieces;

      const mawbKey = `${uldKey}|${mawbInfo.mawb_prefix}|${mawbInfo.mawb_number}`;
      const mawbTotalPieces = fallbackTotalPieces;
      if (!mawbMap.has(mawbKey)) {
        mawbMap.set(mawbKey, {
          flight_number: flightNumber,
          flight_date: flightDate,
          uld_type: uldType,
          uld_number: uldNumber,
          mawb_prefix: mawbInfo.mawb_prefix,
          mawb_number: mawbInfo.mawb_number,
          pieces: toNumericString(detailPieces),
          total_pieces: toNumericString(mawbTotalPieces),
          weight_kg: toNumericString(detailWeight),
          nature_of_goods: natureOfGoods,
          route: route,
          transit_flag: 0,
        });
      }

      const flightRow = flightMap.get(flightKey);
      flightRow.total_weight_kg += detailWeight;
    });

    const flightRow = flightMap.get(flightKey);
    flightRow.total_pieces += rowTotalPieces ?? masterPiecesAccumulated;
  });

  const flight_manifest = Array.from(flightMap.values()).map((flight) => ({
    ...flight,
    total_pieces: toNumericString(flight.total_pieces),
    total_weight_kg: toNumericString(flight.total_weight_kg),
  }));

  return {
    payload: {
      flight_manifest,
      uld: Array.from(uldMap.values()),
      mawb: Array.from(mawbMap.values()),
    },
    ignored: {
      masters: ignoredMasters,
      details: ignoredDetails,
    },
  };
};

export default function BuildupForm() {
  const [inputValue, setInputValue] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const masterAwbs = splitAwbInput(inputValue);

    if (!masterAwbs.length) {
      setRows([]);
      showToast({
        type: 'warning',
        title: 'Master AWB',
        message: 'Master AWB wajib diisi (boleh lebih dari satu).',
      });
      return;
    }

    setIsLoading(true);
    setRows([]);

    try {
      const data = await warehouseClient.masterwaybillBulk({ MasterAWB: masterAwbs });
      const result = mapMasterRows(data);
      setRows(result);

      if (result.length) {
        showToast({
          type: 'success',
          title: 'Master AWB',
          message: `Ditemukan ${result.length} data Master AWB.`,
        });
      } else {
        showToast({
          type: 'warning',
          title: 'Master AWB',
          message: 'Data Master AWB tidak ditemukan.',
        });
      }

      const foundSet = new Set(
        result.map((item) => String(item?.MasterAWB ?? '').toUpperCase()).filter(Boolean)
      );
      const missing = masterAwbs.filter((awb) => !foundSet.has(String(awb).toUpperCase()));
      if (missing.length) {
        showToast({
          type: 'warning',
          title: 'Master AWB',
          message: `Master AWB tidak ditemukan: ${missing.join(', ')}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil data Master AWB.';
      setRows([]);
      showToast({
        type: 'danger',
        title: 'Master AWB',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInputValue('');
    setRows([]);
  };

  const handleMasterFieldChange = (rowIndex, fieldKey, nextValue) => {
    setRows((prevRows) =>
      prevRows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [fieldKey]: nextValue,
            }
          : row
      )
    );
  };

  const handleDetailFieldChange = (rowIndex, detailIndex, fieldKey, nextValue) => {
    setRows((prevRows) =>
      prevRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextDetails = row.details.map((detail, currentDetailIndex) =>
          currentDetailIndex === detailIndex
            ? {
                ...detail,
                [fieldKey]: nextValue,
              }
            : detail
        );

        return {
          ...row,
          total: fieldKey === 'Pieces' ? getDefaultTotalFromDetails(nextDetails) : row.total,
          details: nextDetails,
        };
      })
    );
  };

  const handleAddDetail = (rowIndex) => {
    setRows((prevRows) =>
      prevRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextDetails = [...row.details, createEmptyDetail()];
        return {
          ...row,
          total: getDefaultTotalFromDetails(nextDetails),
          details: nextDetails,
        };
      })
    );
  };

  const handleRemoveDetail = (rowIndex, detailIndex) => {
    setRows((prevRows) =>
      prevRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextDetails = row.details.filter(
          (_, currentDetailIndex) => currentDetailIndex !== detailIndex
        );
        return {
          ...row,
          total: getDefaultTotalFromDetails(
            nextDetails.length ? nextDetails : [createEmptyDetail()]
          ),
          details: nextDetails.length ? nextDetails : [createEmptyDetail()],
        };
      })
    );
  };

  const handleSubmitManifest = async () => {
    if (!rows.length) {
      showToast({
        type: 'warning',
        title: 'Manifest',
        message: 'Data Master AWB belum ada untuk disubmit.',
      });
      return;
    }

    const { payload, ignored } = mapRowsToManifestPayload(rows);
    if (!payload.flight_manifest.length || !payload.uld.length || !payload.mawb.length) {
      showToast({
        type: 'warning',
        title: 'Manifest',
        message:
          'Data belum memenuhi kriteria submit. Pastikan flight, ULD, dan MAWB terisi dengan benar.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify(payload));
      const response = await warehouseClient.uploadFedexManifest(formData);
      const successMessage =
        response && typeof response === 'object' && 'message' in response
          ? response.message
          : 'Submit manifest berhasil.';

      showToast({
        type: 'success',
        title: 'Manifest',
        message: successMessage,
      });

      if (ignored.masters || ignored.details) {
        showToast({
          type: 'warning',
          title: 'Manifest',
          message: `${ignored.masters} master dan ${ignored.details} detail diabaikan karena tidak sesuai format.`,
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('manifest-uploaded', { detail: { response } }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal submit manifest.';
      showToast({
        type: 'danger',
        title: 'Manifest',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-none border-0 mb-3">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h5 className="mb-1 fw-bold text-uppercase">Pencarian Master AWB</h5>
            <p className="mb-0 text-muted">
              Masukkan lebih dari satu Master AWB. Pisahkan dengan koma, spasi, atau baris baru.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} name="form-serch">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-8">
              <label className="form-label mb-1">Master AWB</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Contoh: 123-45678901, 123-45678902"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <div className="form-text text-muted">
                Gunakan Enter untuk baris baru atau pisahkan dengan koma.
              </div>
              <label className="form-label mb-1 d-none d-md-block">&nbsp;</label>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-fill" disabled={isLoading}>
                  {isLoading ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Mencari...
                    </span>
                  ) : (
                    'Cari'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-fill"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {rows.length ? (
        <div className="px-3 pb-3">
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmitManifest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Manifest'}
            </button>
          </div>

          <div className="accordion accordion-header-primary" id="masterAwbAccordion">
            {rows.map((row, rowIndex) => {
              const rowKey = row.MasterAWB ? `${row.MasterAWB}-${rowIndex}` : `row-${rowIndex}`;
              const headingId = `heading-${rowIndex}`;
              const collapseId = `collapse-${rowIndex}`;
              const isFirstItem = rowIndex === 0;
              const masterLabel = row.MasterAWB || `Master AWB #${rowIndex + 1}`;

              return (
                <div className="accordion-item" key={rowKey}>
                  <h2 className="accordion-header" id={headingId}>
                    <button
                      className={`accordion-button ${isFirstItem ? '' : 'collapsed'}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#${collapseId}`}
                      aria-expanded={isFirstItem}
                      aria-controls={collapseId}
                    >
                      <i className="icon-base ri ri-folder-download-line me-2"></i>
                      <span>{masterLabel}</span>
                    </button>
                  </h2>
                  <div
                    id={collapseId}
                    className={`accordion-collapse collapse ${isFirstItem ? 'show' : ''}`}
                    aria-labelledby={headingId}
                    data-bs-parent="#masterAwbAccordion"
                  >
                    <div className="accordion-body">
                      <div className="row g-2">
                        {MASTER_FIELDS.map((field) => (
                          <div key={field.key} className="col-12 col-md-6 col-xl-4">
                            <label className="form-label mb-1">{field.label}</label>
                            <input
                              type={field.type}
                              className={`form-control form-control-sm ${field.className || ''}`}
                              value={row[field.key] ?? ''}
                              onChange={(event) =>
                                handleMasterFieldChange(rowIndex, field.key, event.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <div className="border-top mt-3 pt-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h6 className="mb-0">Detail ULD</h6>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleAddDetail(rowIndex)}
                          >
                            Tambah ULD
                          </button>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {row.details.map((detail, detailIndex) => (
                            <div
                              key={`${rowKey}-detail-${detailIndex}`}
                              className="border rounded p-2"
                            >
                              <div className="row g-2 align-items-end">
                                {DETAIL_FIELDS.map((field) => (
                                  <div key={field.key} className="col-12 col-md-6 col-xl-2">
                                    <label className="form-label mb-1">{field.label}</label>
                                    <input
                                      type={field.type}
                                      className={`form-control form-control-sm ${field.className || ''}`}
                                      value={detail[field.key] ?? ''}
                                      onChange={(event) =>
                                        handleDetailFieldChange(
                                          rowIndex,
                                          detailIndex,
                                          field.key,
                                          event.target.value
                                        )
                                      }
                                    />
                                  </div>
                                ))}

                                <div className="col-12 col-xl-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger w-100"
                                    onClick={() => handleRemoveDetail(rowIndex, detailIndex)}
                                    disabled={row.details.length === 1}
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
