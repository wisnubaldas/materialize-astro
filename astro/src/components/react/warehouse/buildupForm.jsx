import warehouseClient from '@lib/api/warehouse';
import { showToast } from '@utils';
import { useEffect, useState } from 'react';
import { resolveErrorMessage } from './shared';

const EMPTY_LIST = Object.freeze([]);
const AIRLINE_CODE_RE = /^[A-Z0-9]{2,3}$/;
const FLIGHT_NUMBER_RE = /^[A-Z0-9]{2,8}$/;
const AIRPORT_CODE_RE = /^[A-Z]{3}$/;
const MAWB_RE = /^\d{3}-?\d{8}$/;
const ULD_TYPE_RE = /^[A-Z0-9]{3}$/;
const ULD_OWNER_RE = /^[A-Z]{2}$/;
const AIRCRAFT_REG_RE = /^[A-Z0-9-]{2,20}$/;

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
    key: 'total_volume',
    label: 'Total Volume',
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
    readOnly: false,
  },
  {
    key: 'aircraft_registration',
    label: 'Aircraft Registration',
    type: 'text',
    className: 'text-nowrap',
  },
  { key: 'route', label: 'Route', type: 'text', className: 'text-nowrap', readOnly: false },
];

const DETAIL_FIELDS = [
  { key: 'uld_type', label: 'ULD Type', type: 'text', className: 'text-nowrap' },
  { key: 'uld_number', label: 'ULD Number', type: 'text', className: 'text-nowrap' },
  { key: 'pieces', label: 'Pieces', type: 'text', className: 'text-end' },
  { key: 'weight', label: 'Weight', type: 'text', className: 'text-end' },
  { key: 'volume', label: 'Volume (MC)', type: 'text', className: 'text-end' },
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

const toFixedNumericString = (value, fractionDigits = 2, fallback = '0.00') => {
  const parsed = parseNumeric(value);
  if (parsed === null) {
    return fallback;
  }
  return Number(parsed).toFixed(fractionDigits);
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

const getTotalVolumeFromDetails = (details) => {
  const numericVolume = details
    .map((detail) => parseNumeric(detail?.volume))
    .filter((value) => value !== null);

  if (!numericVolume.length) {
    return details[0]?.volume ?? '';
  }

  const sum = numericVolume.reduce((acc, value) => acc + value, 0);
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
  volume: '',
  uld_owner: defaultOwner || 'FX',
});

const createDetailFromItem = (item, defaultOwner = '') => ({
  uld_type: '',
  uld_number: '',
  pieces: '',
  weight: '',
  volume: item?.total_volume ?? item?.volume ?? '',
  uld_owner: defaultOwner || 'FX',
});

const cloneRows = (rows) =>
  (Array.isArray(rows) ? rows : []).map((row) => {
    const details = Array.isArray(row?.details) ? row.details : EMPTY_LIST;
    return {
      ...row,
      details: details.length
        ? details.map((detail) => ({ ...detail }))
        : [createEmptyDetail(row?.airlines_code)],
    };
  });

const mergeMasterRows = (existingRows, incomingRows) => {
  const mergedRows = [...(Array.isArray(existingRows) ? existingRows : EMPTY_LIST)];
  const seenAwb = new Set(mergedRows.map((row) => normalizeAwbKey(row?.mawb)).filter(Boolean));

  let duplicates = 0;
  (Array.isArray(incomingRows) ? incomingRows : EMPTY_LIST).forEach((row) => {
    const awbKey = normalizeAwbKey(row?.mawb);
    if (awbKey && seenAwb.has(awbKey)) {
      duplicates += 1;
      return;
    }

    mergedRows.push(row);
    if (awbKey) {
      seenAwb.add(awbKey);
    }
  });

  return { mergedRows, duplicates };
};

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
    const totalVolume = item?.total_volume ?? item?.volume ?? '';

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
        total_volume: totalVolume,
        initial_total_pieces: totalPieces,
        initial_total_weight: totalWeight,
        initial_total_volume: totalVolume,
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
    if (isBlank(row.total_volume) && totalVolume !== '') {
      row.total_volume = totalVolume;
      row.initial_total_volume = totalVolume;
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
      total_volume: isBlank(row.total_volume)
        ? getTotalVolumeFromDetails(details)
        : row.total_volume,
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

const sanitizeCargoText = (value) => toText(value).replace(/\s+/g, ' ').toUpperCase();

const normalizeUldNumber = (value) => sanitizeCargoText(value).replace(/[^A-Z0-9]/g, '');

const validateRowsForCargoImp = (rows) => {
  const errors = [];
  const rowErrors = {};
  const safeRows = Array.isArray(rows) ? rows : [];

  const setRowFieldError = (rowIndex, field, message) => {
    if (!rowErrors[rowIndex]) {
      rowErrors[rowIndex] = { fields: {}, details: {} };
    }
    rowErrors[rowIndex].fields[field] = message;
    errors.push(`MAWB #${rowIndex + 1}: ${message}`);
  };

  const setDetailFieldError = (rowIndex, detailIndex, field, message) => {
    if (!rowErrors[rowIndex]) {
      rowErrors[rowIndex] = { fields: {}, details: {} };
    }
    if (!rowErrors[rowIndex].details[detailIndex]) {
      rowErrors[rowIndex].details[detailIndex] = {};
    }
    rowErrors[rowIndex].details[detailIndex][field] = message;
    errors.push(`MAWB #${rowIndex + 1}, ULD #${detailIndex + 1}: ${message}`);
  };

  safeRows.forEach((row, rowIndex) => {
    const mawb = sanitizeCargoText(row?.mawb);
    const airlineCode = sanitizeCargoText(row?.airlines_code);
    const flightNumber = sanitizeCargoText(row?.flight_number);
    const origin = sanitizeCargoText(row?.origin);
    const dest = sanitizeCargoText(row?.dest);
    const flightDate = toText(row?.flight_date);
    const aircraftRegistration = sanitizeCargoText(row?.aircraft_registration);
    const details = Array.isArray(row?.details) ? row.details : [];

    if (!MAWB_RE.test(mawb)) {
      setRowFieldError(
        rowIndex,
        'mawb',
        'Format MAWB harus 3 digit prefix + 8 digit serial (contoh: 023-47922604).'
      );
    }
    if (!AIRLINE_CODE_RE.test(airlineCode)) {
      setRowFieldError(
        rowIndex,
        'airlines_code',
        'Airline code harus 2-3 karakter alfanumerik (contoh: FX).'
      );
    }
    if (!FLIGHT_NUMBER_RE.test(flightNumber)) {
      setRowFieldError(
        rowIndex,
        'flight_number',
        'Flight number harus 2-8 karakter alfanumerik tanpa spasi.'
      );
    }
    if (!AIRPORT_CODE_RE.test(origin)) {
      setRowFieldError(rowIndex, 'origin', 'Origin harus 3 huruf kode bandara IATA (contoh: CGK).');
    }
    if (!AIRPORT_CODE_RE.test(dest)) {
      setRowFieldError(
        rowIndex,
        'dest',
        'Destination harus 3 huruf kode bandara IATA (contoh: SIN).'
      );
    }
    if (!isAcceptedFlightDate(flightDate)) {
      setRowFieldError(
        rowIndex,
        'flight_date',
        'Flight date harus format YYYY-MM-DD atau DD-MM-YYYY.'
      );
    }
    if (aircraftRegistration && !AIRCRAFT_REG_RE.test(aircraftRegistration)) {
      setRowFieldError(
        rowIndex,
        'aircraft_registration',
        'Aircraft registration hanya boleh huruf/angka/tanda minus (2-20 karakter).'
      );
    }
    if (!details.length) {
      setRowFieldError(rowIndex, 'details', 'Minimal harus ada 1 detail ULD.');
      return;
    }

    const uldKeySet = new Set();
    let detailPiecesTotal = 0;
    let detailWeightTotal = 0;
    let detailVolumeTotal = 0;

    details.forEach((detail, detailIndex) => {
      const uldType = sanitizeCargoText(detail?.uld_type);
      const uldNumberRaw = normalizeUldNumber(detail?.uld_number);
      const uldOwner = sanitizeCargoText(detail?.uld_owner);
      const pieces = parseNumeric(detail?.pieces);
      const weight = parseNumeric(detail?.weight);
      const volume = parseNumeric(detail?.volume);
      const serialMatch = uldNumberRaw.match(/(\d{4,5})/);

      if (!ULD_TYPE_RE.test(uldType)) {
        setDetailFieldError(
          rowIndex,
          detailIndex,
          'uld_type',
          'ULD Type harus 3 karakter alfanumerik (contoh: PMC, AKE).'
        );
      }
      if (!serialMatch) {
        setDetailFieldError(
          rowIndex,
          detailIndex,
          'uld_number',
          'ULD Number harus mengandung serial numerik 4-5 digit.'
        );
      }
      if (!ULD_OWNER_RE.test(uldOwner)) {
        setDetailFieldError(
          rowIndex,
          detailIndex,
          'uld_owner',
          'ULD Owner harus tepat 2 huruf (contoh: FX).'
        );
      }
      if (pieces === null || !Number.isInteger(pieces) || pieces <= 0) {
        setDetailFieldError(
          rowIndex,
          detailIndex,
          'pieces',
          'Pieces harus bilangan bulat lebih dari 0.'
        );
      }
      if (weight === null || weight <= 0) {
        setDetailFieldError(rowIndex, detailIndex, 'weight', 'Weight harus angka lebih dari 0.');
      }
      if (volume === null || volume < 0) {
        setDetailFieldError(
          rowIndex,
          detailIndex,
          'volume',
          'Volume harus angka 0 atau lebih (nilai 0 otomatis dikonversi menjadi 1.00).'
        );
      }

      if (serialMatch && ULD_TYPE_RE.test(uldType)) {
        const uldKey = `${uldType}|${serialMatch[1]}|${uldOwner}`;
        if (uldKeySet.has(uldKey)) {
          setDetailFieldError(
            rowIndex,
            detailIndex,
            'uld_number',
            'Kombinasi ULD Type, serial, dan owner duplikat.'
          );
        } else {
          uldKeySet.add(uldKey);
        }
      }

      if (Number.isFinite(pieces)) {
        detailPiecesTotal += pieces;
      }
      if (Number.isFinite(weight)) {
        detailWeightTotal += weight;
      }
      if (Number.isFinite(volume)) {
        detailVolumeTotal += volume <= 0 ? 1 : volume;
      }
    });

    const rowTotalPieces = parseNumeric(row?.total_pieces);
    if (rowTotalPieces !== null && detailPiecesTotal > rowTotalPieces) {
      setRowFieldError(
        rowIndex,
        'total_pieces',
        `Total pieces detail (${detailPiecesTotal}) melebihi total pieces MAWB (${rowTotalPieces}).`
      );
    }

    const rowTotalWeight = parseNumeric(row?.total_weight);
    if (rowTotalWeight !== null && detailWeightTotal > rowTotalWeight) {
      setRowFieldError(
        rowIndex,
        'total_weight',
        `Total weight detail (${detailWeightTotal}) melebihi total weight MAWB (${rowTotalWeight}).`
      );
    }

    const rowTotalVolume = parseNumeric(row?.total_volume);
    if (rowTotalVolume !== null && rowTotalVolume > 0 && detailVolumeTotal > rowTotalVolume) {
      setRowFieldError(
        rowIndex,
        'total_volume',
        `Total volume detail (${detailVolumeTotal}) melebihi total volume MAWB (${rowTotalVolume}).`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    rowErrors,
  };
};

const mapRowsToManifestPayload = (rows) => {
  const flightMap = new Map();
  const uldMap = new Map();
  const mawbMap = new Map();
  let ignoredMasters = 0;
  let ignoredDetails = 0;

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const airlineCode = sanitizeCargoText(row?.airlines_code);
    const flightNumber = sanitizeCargoText(row?.flight_number);
    const flightDate = normalizeDateText(row?.flight_date);
    const pointOfLoading = sanitizeCargoText(row?.origin);
    const pointOfUnloading = sanitizeCargoText(row?.dest);
    const aircraftRegistration = sanitizeCargoText(row?.aircraft_registration);
    const route = sanitizeCargoText(row?.route);
    const natureOfGoods = sanitizeCargoText(row?.nature_of_goods);

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
    const rowTotalVolume = parseNumeric(row?.total_volume);

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
        total_volume: 0,
        source_document: 'manual-form',
        raw_text: '',
      });
    }

    let masterPiecesAccumulated = 0;
    details.forEach((detail) => {
      const uldType = sanitizeCargoText(detail?.uld_type);
      const uldNumber = normalizeUldNumber(detail?.uld_number);
      const uldOwner = sanitizeCargoText(detail?.uld_owner) || airlineCode || 'FX';
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
      const detailVolumeSeed = parseNumeric(detail?.volume) ?? 0;
      const detailVolume = detailVolumeSeed <= 0 ? 1 : detailVolumeSeed;
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
          volume: toFixedNumericString(detailVolume, 2, '0.00'),
          nature_of_goods: natureOfGoods,
          route: route,
          transit_flag: 0,
        });
      } else {
        const existing = mawbMap.get(mawbKey);
        const nextPieces = (parseNumeric(existing.pieces) ?? 0) + detailPieces;
        const nextWeight = (parseNumeric(existing.weight_kg) ?? 0) + detailWeight;
        const nextVolume = (parseNumeric(existing.volume) ?? 0) + detailVolume;
        existing.pieces = toNumericString(nextPieces);
        existing.weight_kg = toNumericString(nextWeight);
        existing.volume = toFixedNumericString(nextVolume, 2, '0.00');
        if (!existing.nature_of_goods && natureOfGoods) {
          existing.nature_of_goods = natureOfGoods;
        }
        if (!existing.route && route) {
          existing.route = route;
        }
      }

      const flightRow = flightMap.get(flightKey);
      flightRow.total_weight_kg += detailWeight;
      flightRow.total_volume += detailVolume;
    });

    const flightRow = flightMap.get(flightKey);
    flightRow.total_pieces += rowTotalPieces ?? masterPiecesAccumulated;
    if ((rowTotalVolume ?? 0) <= 0 && flightRow.total_volume === 0) {
      flightRow.total_volume += 1;
    } else if ((rowTotalVolume ?? 0) > 0 && flightRow.total_volume === 0) {
      flightRow.total_volume += rowTotalVolume ?? 0;
    }
  });

  const flight_manifest = Array.from(flightMap.values()).map((flight) => ({
    ...flight,
    total_pieces: toNumericString(flight.total_pieces),
    total_weight_kg: toNumericString(flight.total_weight_kg),
    total_volume: toFixedNumericString(flight.total_volume, 2, '0.00'),
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

export default function BuildupForm({
  onSaveDraft = async () => {},
  initialRows = EMPTY_LIST,
  initialMasterAwbs = EMPTY_LIST,
  heading = 'Pencarian Master AWB',
  description = 'Masukkan lebih dari satu Master AWB. Pisahkan dengan koma, spasi, atau baris baru.',
  saveButtonLabel = 'Simpan Draft',
  saveToastMessage = 'Draft manifest berhasil disimpan.',
  onCancel = null,
  showSearchButton = true,
  prefillSearchInput = true,
}) {
  const [inputValue, setInputValue] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [validationResult, setValidationResult] = useState({
    isValid: true,
    errors: [],
    rowErrors: {},
  });

  useEffect(() => {
    setRows(cloneRows(initialRows));
    setInputValue(
      prefillSearchInput && Array.isArray(initialMasterAwbs) && initialMasterAwbs.length
        ? initialMasterAwbs.join('\n')
        : ''
    );
    setValidationResult({ isValid: true, errors: [], rowErrors: {} });
  }, [initialRows, initialMasterAwbs, prefillSearchInput]);

  const revalidateRows = (nextRows) => {
    const result = validateRowsForCargoImp(nextRows);
    setValidationResult(result);
    return result;
  };

  const getRowFieldError = (rowIndex, field) =>
    validationResult?.rowErrors?.[rowIndex]?.fields?.[field] ?? '';

  const getDetailFieldError = (rowIndex, detailIndex, field) =>
    validationResult?.rowErrors?.[rowIndex]?.details?.[detailIndex]?.[field] ?? '';

  const runSearchMasterAwb = async ({ append = false } = {}) => {
    const masterAwbs = splitAwbInput(inputValue);

    if (!masterAwbs.length) {
      if (!append) {
        setRows([]);
      }
      showToast({
        type: 'warning',
        title: 'Master AWB',
        message: 'Master AWB wajib diisi (boleh lebih dari satu).',
      });
      return;
    }

    setIsLoading(true);
    if (!append) {
      setRows([]);
    }

    try {
      const data = await warehouseClient.masterwaybillBulk({ MasterAWB: masterAwbs });
      const result = mapMasterRows(data);
      let duplicateCount = 0;
      let nextRows = result;

      if (append) {
        const merged = mergeMasterRows(rows, result);
        nextRows = merged.mergedRows;
        duplicateCount = merged.duplicates;
      }

      setRows(nextRows);
      revalidateRows(nextRows);

      if (result.length) {
        const successMessage = append
          ? `Berhasil menambahkan ${result.length - duplicateCount} data Master AWB.`
          : `Ditemukan ${result.length} data Master AWB.`;
        showToast({
          type: 'success',
          title: 'Master AWB',
          message: successMessage,
        });
      } else {
        showToast({
          type: 'warning',
          title: 'Master AWB',
          message: 'Data Master AWB tidak ditemukan.',
        });
      }

      if (append && duplicateCount > 0) {
        showToast({
          type: 'warning',
          title: 'Master AWB',
          message: `${duplicateCount} Master AWB dilewati karena sudah ada di draft.`,
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

      if (append) {
        setInputValue('');
      }
    } catch (err) {
      const message = resolveErrorMessage(err, 'Gagal mengambil data Master AWB.');
      if (!append) {
        setRows([]);
        setValidationResult({ isValid: true, errors: [], rowErrors: {} });
      }
      showToast({
        type: 'danger',
        title: 'Master AWB',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runSearchMasterAwb({ append: false });
  };

  const handleAppendMasterAwb = async () => {
    await runSearchMasterAwb({ append: true });
  };

  const handleReset = () => {
    setInputValue('');
    setRows([]);
    setValidationResult({ isValid: true, errors: [], rowErrors: {} });
  };

  const handleMasterFieldChange = (rowIndex, fieldKey, nextValue) => {
    setRows((prevRows) => {
      const nextRows = prevRows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [fieldKey]:
                fieldKey === 'aircraft_registration' ? sanitizeCargoText(nextValue) : nextValue,
            }
          : row
      );
      revalidateRows(nextRows);
      return nextRows;
    });
  };

  const handleDetailFieldChange = (rowIndex, detailIndex, fieldKey, nextValue) => {
    setRows((prevRows) => {
      const nextRows = prevRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextDetails = row.details.map((detail, currentDetailIndex) =>
          currentDetailIndex === detailIndex
            ? {
                ...detail,
                [fieldKey]:
                  fieldKey === 'pieces' || fieldKey === 'weight' || fieldKey === 'volume'
                    ? nextValue
                    : sanitizeCargoText(nextValue),
              }
            : detail
        );

        return {
          ...row,
          details: nextDetails,
        };
      });
      revalidateRows(nextRows);
      return nextRows;
    });
  };

  const handleAddDetail = (rowIndex) => {
    setRows((prevRows) => {
      const nextRows = prevRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextDetails = [...row.details, createEmptyDetail(row.airlines_code)];
        return {
          ...row,
          details: nextDetails,
        };
      });
      revalidateRows(nextRows);
      return nextRows;
    });
  };

  const handleRemoveDetail = (rowIndex, detailIndex) => {
    setRows((prevRows) => {
      const nextRows = prevRows.map((row, index) => {
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
      });
      revalidateRows(nextRows);
      return nextRows;
    });
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

    const validation = revalidateRows(rows);
    if (!validation.isValid) {
      const previewErrors = validation.errors.slice(0, 3).join(' | ');
      showToast({
        type: 'warning',
        title: 'Validasi Cargo-IMP',
        message:
          validation.errors.length > 3
            ? `${previewErrors} | +${validation.errors.length - 3} error lainnya.`
            : previewErrors,
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
        masterAwbs: rows.map((row) => toText(row?.mawb)).filter(Boolean),
      };
      await onSaveDraft(draft);

      showToast({
        type: 'success',
        title: 'Draft Manifest',
        message: saveToastMessage,
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
      const message = resolveErrorMessage(err, 'Gagal menyimpan draft manifest.');
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
        {heading || description ? (
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
            <div>
              {heading ? <h5 className="mb-1 fw-bold text-uppercase">{heading}</h5> : null}
              {description ? <p className="mb-0 text-muted">{description}</p> : null}
            </div>
          </div>
        ) : null}

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
                {showSearchButton ? (
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
                ) : null}
                <button
                  type="button"
                  className="btn btn-outline-primary flex-fill"
                  onClick={handleAppendMasterAwb}
                  disabled={isLoading || !rows.length}
                  title={rows.length ? 'Tambah hasil Master AWB ke data draft saat ini' : ''}
                >
                  Tambah AWB
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
          {!validationResult.isValid ? (
            <div className="alert alert-warning mb-3" role="alert">
              Ditemukan {validationResult.errors.length} masalah validasi Cargo-IMP. Perbaiki field
              yang ditandai merah sebelum menyimpan draft.
            </div>
          ) : null}
          <div className="d-flex justify-content-end gap-2 mb-3">
            {typeof onCancel === 'function' ? (
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                Batal
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? 'Menyimpan...' : saveButtonLabel}
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
              const remainingVolume = getRemainingFromDetails(
                row.total_volume,
                row.details,
                'volume'
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
                            {(() => {
                              const fieldError = getRowFieldError(rowIndex, field.key);
                              return (
                                <>
                                  <input
                                    type={field.type}
                                    className={`form-control form-control-sm ${field.className || ''} ${
                                      field.readOnly ? 'bg-light' : ''
                                    } ${fieldError ? 'is-invalid' : ''}`}
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
                                  {fieldError ? (
                                    <div className="invalid-feedback">{fieldError}</div>
                                  ) : null}
                                </>
                              );
                            })()}
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
                                  <div key={field.key} className="col-12 col-md-6 col-xl-4">
                                    <label className="form-label mb-1">{field.label}</label>
                                    {(() => {
                                      const fieldError = getDetailFieldError(
                                        rowIndex,
                                        detailIndex,
                                        field.key
                                      );
                                      return (
                                        <>
                                          {field.key === 'pieces' ||
                                          field.key === 'weight' ||
                                          field.key === 'volume' ? (
                                            <div className="input-group input-group-sm">
                                              <input
                                                type={field.type}
                                                className={`form-control ${field.className || ''} ${
                                                  fieldError ? 'is-invalid' : ''
                                                }`}
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
                                                  : field.key === 'weight'
                                                    ? `Sisa: ${remainingWeight || '-'}`
                                                    : `Sisa: ${remainingVolume || '-'}`}
                                              </span>
                                            </div>
                                          ) : (
                                            <input
                                              type={field.type}
                                              className={`form-control form-control-sm ${field.className || ''} ${
                                                fieldError ? 'is-invalid' : ''
                                              }`}
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
                                          {fieldError ? (
                                            <div className="invalid-feedback d-block">
                                              {fieldError}
                                            </div>
                                          ) : null}
                                        </>
                                      );
                                    })()}
                                  </div>
                                ))}

                                <div className="col-12 col-xl-12">
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
