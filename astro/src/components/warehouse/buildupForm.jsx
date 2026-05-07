import { showToast } from '@js/utils';
import warehouseClient from '@lib/api/warehouse';
import { useState } from 'react';

const normalizeAwbKey = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

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
    const key = normalizeAwbKey(awb);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(awb);
  });

  return unique;
};

const MASTER_FIELDS = [
  { key: 'mawb', label: 'MAWB', type: 'text', className: 'text-nowrap', readOnly: true },
  {
    key: 'airlines_code',
    label: 'Airlines Code',
    type: 'text',
    className: 'text-nowrap',
    readOnly: true,
  },
  { key: 'origin', label: 'Origin', type: 'text', className: 'text-nowrap', readOnly: true },
  { key: 'dest', label: 'Destination', type: 'text', className: 'text-nowrap', readOnly: true },
  {
    key: 'flight_date',
    label: 'Flight Date',
    type: 'text',
    className: 'text-nowrap',
    readOnly: true,
  },
  {
    key: 'total_pieces',
    label: 'Total Pieces',
    type: 'text',
    className: 'text-end',
    readOnly: true,
  },
  {
    key: 'total_weight',
    label: 'Total Weight',
    type: 'text',
    className: 'text-end',
    readOnly: true,
  },
  {
    key: 'flight_number',
    label: 'Flight No',
    type: 'text',
    className: 'text-nowrap',
    readOnly: true,
  },
  {
    key: 'nature_of_goods',
    label: 'Nature Of Goods',
    type: 'text',
    className: 'text-nowrap',
    readOnly: true,
  },
  {
    key: 'aircraft_registration',
    label: 'Aircraft Registration',
    type: 'text',
    className: 'text-nowrap',
  },
  { key: 'route', label: 'Route', type: 'text', className: 'text-nowrap', readOnly: true },
];

const DETAIL_FIELDS = [
  { key: 'uld_type', label: 'ULD Type', type: 'text', className: 'text-nowrap' },
  { key: 'uld_number', label: 'ULD Number', type: 'text', className: 'text-nowrap' },
  { key: 'pieces', label: 'Pieces', type: 'text', className: 'text-end' },
  { key: 'weight', label: 'Weight', type: 'text', className: 'text-end' },
  { key: 'uld_owner', label: 'ULD Owner', type: 'text', className: 'text-nowrap' },
];

const toText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const normalizeDateText = (value) => {
  const text = toText(value);
  if (!text) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }
  if (/^\d{4}\/\d{2}\/\d{2}/.test(text)) {
    return text.slice(0, 10).replace(/\//g, '-');
  }
  return text;
};

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNumericString = (value, fallback = '0') => {
  const parsed = parseNumeric(value);
  if (parsed === null) {
    return fallback;
  }
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
};

const isBlank = (value) => value === null || value === undefined || value === '';

const getTotalPiecesFromDetails = (details) => {
  const numericPieces = details
    .map((detail) => parseNumeric(detail?.pieces))
    .filter((value) => value !== null);

  if (!numericPieces.length) {
    return details[0]?.pieces ?? '';
  }

  const sum = numericPieces.reduce((acc, value) => acc + value, 0);
  return Number.isInteger(sum) ? String(sum) : String(sum);
};

const getTotalWeightFromDetails = (details) => {
  const numericWeight = details
    .map((detail) => parseNumeric(detail?.weight))
    .filter((value) => value !== null);

  if (!numericWeight.length) {
    return details[0]?.weight ?? '';
  }

  const sum = numericWeight.reduce((acc, value) => acc + value, 0);
  return Number.isInteger(sum) ? String(sum) : String(sum);
};

const getRemainingFromDetails = (totalValue, details, detailField) => {
  const total = parseNumeric(totalValue);
  if (total === null) {
    return '';
  }

  const used = (Array.isArray(details) ? details : []).reduce((acc, detail) => {
    const parsed = parseNumeric(detail?.[detailField]);
    return acc + (parsed ?? 0);
  }, 0);

  const remaining = Math.max(total - used, 0);
  return Number.isInteger(remaining) ? String(remaining) : String(remaining);
};

const createEmptyDetail = (defaultOwner = '') => ({
  uld_type: '',
  uld_number: '',
  pieces: '',
  weight: '',
  uld_owner: defaultOwner || 'FX',
});

const createDetailFromItem = (_item, defaultOwner = '') => ({
  uld_type: '',
  uld_number: '',
  pieces: '',
  weight: '',
  uld_owner: defaultOwner || 'FX',
});

const mapMasterRows = (data) => {
  const groups = new Map();

  (Array.isArray(data) ? data : []).forEach((item, index) => {
    const mawb = toText(item?.mawb);
    const groupKey = normalizeAwbKey(mawb) || `__missing-master-${index}`;
    const airlineCode = toText(item?.airlines_code);
    const origin = toText(item?.origin);
    const dest = toText(item?.dest);
    const defaultRoute = origin && dest ? `${origin}-${dest}` : '';
    const totalPieces = item?.total_pieces ?? '';
    const totalWeight = item?.total_weight ?? '';

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        mawb,
        airlines_code: airlineCode,
        flight_number: toText(item?.flight_number),
        origin,
        dest,
        flight_date: normalizeDateText(item?.flight_date),
        total_pieces: totalPieces,
        total_weight: totalWeight,
        initial_total_pieces: totalPieces,
        initial_total_weight: totalWeight,
        nature_of_goods: toText(item?.nature_of_goods),
        aircraft_registration: '',
        route: defaultRoute,
        details: [createDetailFromItem(item, airlineCode)],
      });
      return;
    }

    const row = groups.get(groupKey);
    if (!row.nature_of_goods) {
      row.nature_of_goods = toText(item?.nature_of_goods);
    }
    if (!row.flight_number) {
      row.flight_number = toText(item?.flight_number);
    }
    if (isBlank(row.total_pieces) && totalPieces !== '') {
      row.total_pieces = totalPieces;
      row.initial_total_pieces = totalPieces;
    }
    if (isBlank(row.total_weight) && totalWeight !== '') {
      row.total_weight = totalWeight;
      row.initial_total_weight = totalWeight;
    }
  });

  return Array.from(groups.values()).map((row) => {
    const details = row.details.length ? row.details : [createEmptyDetail(row.airlines_code)];
    return {
      ...row,
      total_pieces: isBlank(row.total_pieces)
        ? getTotalPiecesFromDetails(details)
        : row.total_pieces,
      total_weight: isBlank(row.total_weight)
        ? getTotalWeightFromDetails(details)
        : row.total_weight,
      details,
    };
  });
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
  return /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(text) || /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(text);
};

const mapRowsToManifestPayload = (rows) => {
  const flightMap = new Map();
  const uldMap = new Map();
  const mawbMap = new Map();
  let ignoredMasters = 0;
  let ignoredDetails = 0;

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const airlineCode = toText(row?.airlines_code);
    const flightNumber = toText(row?.flight_number);
    const flightDate = toText(row?.flight_date);
    const pointOfLoading = toText(row?.origin);
    const pointOfUnloading = toText(row?.dest);
    const aircraftRegistration = toText(row?.aircraft_registration);
    const route = toText(row?.route);
    const natureOfGoods = toText(row?.nature_of_goods);

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
    const mawbInfo = parseMasterAwb(row?.mawb, airlineCode);
    if (!mawbInfo.mawb_prefix || !mawbInfo.mawb_number) {
      ignoredMasters += 1;
      return;
    }

    const rowTotalPieces = parseNumeric(row?.total_pieces);
    const fallbackTotalPieces =
      rowTotalPieces ?? parseNumeric(getTotalPiecesFromDetails(details)) ?? 0;
    const rowTotalWeight = parseNumeric(row?.total_weight);
    const fallbackTotalWeight =
      rowTotalWeight ?? parseNumeric(getTotalWeightFromDetails(details)) ?? 0;

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
      const uldOwner = toText(detail?.uld_owner) || airlineCode || 'FX';
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

      const detailPieces = parseNumeric(detail?.pieces) ?? 0;
      const detailWeight = parseNumeric(detail?.weight) ?? 0;
      masterPiecesAccumulated += detailPieces;

      const mawbKey = `${uldKey}|${mawbInfo.mawb_prefix}|${mawbInfo.mawb_number}`;
      if (!mawbMap.has(mawbKey)) {
          mawbMap.set(mawbKey, {
            flight_number: flightNumber,
            flight_date: flightDate,
            uld_type: uldType,
            uld_number: uldNumber,
            mawb_prefix: mawbInfo.mawb_prefix,
            mawb_number: mawbInfo.mawb_number,
            pieces: toNumericString(detailPieces),
            total_pieces: toNumericString(fallbackTotalPieces),
            total_weight_kg: toNumericString(fallbackTotalWeight),
            weight_kg: toNumericString(detailWeight),
            nature_of_goods: natureOfGoods,
            route: route,
            transit_flag: 0,
          });
      } else {
        const existing = mawbMap.get(mawbKey);
        const nextPieces = (parseNumeric(existing.pieces) ?? 0) + detailPieces;
        const nextWeight = (parseNumeric(existing.weight_kg) ?? 0) + detailWeight;
        existing.pieces = toNumericString(nextPieces);
        existing.weight_kg = toNumericString(nextWeight);
        if (!existing.nature_of_goods && natureOfGoods) {
          existing.nature_of_goods = natureOfGoods;
        }
        if (!existing.route && route) {
          existing.route = route;
        }
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

export default function BuildupForm({ onSaveDraft = async () => {} }) {
  const [inputValue, setInputValue] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

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

      const foundSet = new Set(result.map((item) => normalizeAwbKey(item?.mawb)).filter(Boolean));
      const missing = masterAwbs.filter((awb) => !foundSet.has(normalizeAwbKey(awb)));
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

        const nextDetails = [...row.details, createEmptyDetail(row.airlines_code)];
        return {
          ...row,
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
        const detailsOrFallback = nextDetails.length
          ? nextDetails
          : [createEmptyDetail(row.airlines_code)];

        return {
          ...row,
          details: detailsOrFallback,
        };
      })
    );
  };

  const handleSaveDraft = async () => {
    if (!rows.length) {
      showToast({
        type: 'warning',
        title: 'Draft Manifest',
        message: 'Data Master AWB belum ada untuk disimpan.',
      });
      return;
    }

    const { payload, ignored } = mapRowsToManifestPayload(rows);
    if (!payload.flight_manifest.length || !payload.uld.length || !payload.mawb.length) {
      showToast({
        type: 'warning',
        title: 'Draft Manifest',
        message:
          'Data belum memenuhi kriteria draft. Pastikan flight, ULD, dan MAWB terisi dengan benar.',
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      const draft = {
        rows,
        payload,
        ignored,
        masterAwbs: rows
          .map((row) => toText(row?.mawb))
          .filter(Boolean),
      };
      await onSaveDraft(draft);

      showToast({
        type: 'success',
        title: 'Draft Manifest',
        message: 'Draft manifest berhasil disimpan.',
      });

      if (ignored.masters || ignored.details) {
        showToast({
          type: 'warning',
          title: 'Draft Manifest',
          message: `${ignored.masters} master dan ${ignored.details} detail diabaikan karena tidak sesuai format.`,
        });
      }

      setRows([]);
      setInputValue('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan draft manifest.';
      showToast({
        type: 'danger',
        title: 'Draft Manifest',
        message,
      });
    } finally {
      setIsSavingDraft(false);
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
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
          </div>

          <div className="accordion accordion-header-primary" id="masterAwbAccordion">
            {rows.map((row, rowIndex) => {
              const rowKey = row.mawb ? `${row.mawb}-${rowIndex}` : `row-${rowIndex}`;
              const headingId = `heading-${rowIndex}`;
              const collapseId = `collapse-${rowIndex}`;
              const isFirstItem = rowIndex === 0;
              const masterLabel = row.mawb || `Master AWB #${rowIndex + 1}`;
              const remainingPieces = getRemainingFromDetails(
                row.total_pieces,
                row.details,
                'pieces'
              );
              const remainingWeight = getRemainingFromDetails(
                row.total_weight,
                row.details,
                'weight'
              );

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
                              className={`form-control form-control-sm ${field.className || ''} ${
                                field.readOnly ? 'bg-light' : ''
                              }`}
                              value={row[field.key] ?? ''}
                              readOnly={Boolean(field.readOnly)}
                              onChange={
                                field.readOnly
                                  ? undefined
                                  : (event) =>
                                      handleMasterFieldChange(
                                        rowIndex,
                                        field.key,
                                        event.target.value
                                      )
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
                                    {field.key === 'pieces' || field.key === 'weight' ? (
                                      <div className="input-group input-group-sm">
                                        <input
                                          type={field.type}
                                          className={`form-control ${field.className || ''}`}
                                          value={detail[field.key] ?? ''}
                                          aria-describedby={`${rowKey}-detail-${detailIndex}-${field.key}-remaining`}
                                          onChange={(event) =>
                                            handleDetailFieldChange(
                                              rowIndex,
                                              detailIndex,
                                              field.key,
                                              event.target.value
                                            )
                                          }
                                        />
                                        <span
                                          className="input-group-text"
                                          id={`${rowKey}-detail-${detailIndex}-${field.key}-remaining`}
                                        >
                                          {field.key === 'pieces'
                                            ? `Sisa: ${remainingPieces || '-'}`
                                            : `Sisa: ${remainingWeight || '-'}`}
                                        </span>
                                      </div>
                                    ) : (
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
                                    )}
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
