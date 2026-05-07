const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const normalizeString = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
};

const toInteger = (value, fallback = 0) => {
  const num = parseInt(String(value ?? ''), 10);
  return Number.isFinite(num) ? num : fallback;
};

const toDecimal = (value, fractionDigits, fallback = 0) => {
  const num = Number(String(value ?? '').replace(',', '.'));
  if (Number.isNaN(num)) {
    return fallback.toFixed(fractionDigits);
  }
  return num.toFixed(fractionDigits);
};

const formatFfmDate = (value) => {
  const raw = normalizeString(value);
  if (!raw) {
    return '01JAN';
  }

  if (/^[0-3]?\d[A-Z]{3}(\d{2})?$/i.test(raw)) {
    return raw.toUpperCase();
  }

  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(raw);
  if (match) {
    const [, yearStr, monthStr, dayStr] = match;
    const day = parseInt(dayStr, 10) || 1;
    const monthIndex = (parseInt(monthStr, 10) || 1) - 1;
    const monthLabel = MONTHS[monthIndex] ?? 'JAN';
    const year = yearStr.slice(-2);
    return `${String(day).padStart(2, '0')}${monthLabel}${year}`;
  }

  return raw.toUpperCase();
};

export const buildFfmMessage = (payload) => {
  const version = normalizeString(payload.version ?? payload.ffmVersion, '8');

  const origin =
    normalizeString(payload.origin) ||
    normalizeString(payload.Departure) ||
    normalizeString(payload.TransitCode) ||
    'XXX';

  const destination =
    normalizeString(payload.destination) ||
    normalizeString(payload.Arrival) ||
    normalizeString(payload.TransitCode) ||
    'XXX';

  const flightNumber =
    normalizeString(payload.flightNumber ?? payload.FlightNumber) ||
    normalizeString(payload.BuildUpNumber) ||
    'NA000';

  const date = formatFfmDate(payload.DateEntry ?? payload.flightDate);

  const awb = normalizeString(payload.MasterAWB, '000-00000000');
  const pieces = toInteger(payload.Pieces ?? payload.PartPieces, 0);
  const weight = toDecimal(payload.Netto ?? payload.PartNetto, 2, 0);
  const volume = toDecimal(payload.Volume, 3, 0);
  const goods = normalizeString(payload.KindOfGood ?? payload.Remarks, 'GENERAL CARGO');

  const uldCard = normalizeString(payload.UldCardNumber);
  const buildUpNumber = normalizeString(payload.BuildUpNumber);

  const lines = [];

  lines.push(`FFM/${version}`);
  lines.push(`1/${flightNumber}/${date}/${origin}`);
  lines.push(destination);

  lines.push(`${awb}${origin}${destination}/T${pieces}K${weight}MC${volume}/${goods}`);

  if (uldCard || buildUpNumber) {
    const suffix = [uldCard, buildUpNumber].filter(Boolean).join('/');
    lines.push(`ULD/${suffix}`);
  }

  lines.push('LAST');

  return lines.filter(Boolean).join('\n');
};
