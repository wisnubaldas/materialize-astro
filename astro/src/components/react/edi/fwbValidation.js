const collapseSpaces = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const sanitizeAlpha = (value, maxLength) =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, maxLength);

const sanitizeAlnum = (value, maxLength) =>
  String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, maxLength);

const sanitizeDigits = (value, maxLength) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, maxLength);

const sanitizeDecimal = (value, maxInteger = 12, maxFraction = 3) => {
  const raw = String(value ?? '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!raw) return '';

  const dotIndex = raw.indexOf('.');
  if (dotIndex === -1) {
    return raw.slice(0, maxInteger);
  }

  const integerPart = raw.slice(0, dotIndex).replace(/\./g, '').slice(0, maxInteger);
  const fractionPart = raw
    .slice(dotIndex + 1)
    .replace(/\./g, '')
    .slice(0, maxFraction);

  if (!fractionPart) {
    return `${integerPart || '0'}.`;
  }
  return `${integerPart || '0'}.${fractionPart}`;
};

const sanitizeText = (value, maxLength) => collapseSpaces(value).slice(0, maxLength);

const sanitizePpCc = (value) => {
  const token = sanitizeAlpha(value, 2);
  if (token === 'P') return 'PP';
  if (token === 'C') return 'CC';
  if (['PP', 'CC', 'PC', 'CP'].includes(token)) return token;
  return token;
};

const sanitizeDeclaredValue = (value, literalCode) => {
  const raw = String(value ?? '').toUpperCase().trim();
  if (!raw) return '';
  if (raw === literalCode) return literalCode;
  return sanitizeDecimal(raw, 12, 2).replace(/\.$/, '');
};

export const sanitizeFwbFieldValue = (key, value) => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (key) {
    case 'message_type':
      return sanitizeAlpha(value, 3);
    case 'message_version':
      return sanitizeDigits(value, 3);
    case 'awb_prefix':
      return sanitizeDigits(value, 3);
    case 'awb_number':
      return sanitizeDigits(value, 8);
    case 'origin':
    case 'destination':
      return sanitizeAlpha(value, 3);
    case 'shipment_description_code':
      return sanitizeAlpha(value, 1);
    case 'total_pieces':
    case 'pieces':
    case 'slac':
      return sanitizeDigits(value, 4);
    case 'weight_unit':
      return sanitizeAlpha(value, 1);
    case 'gross_weight':
    case 'weight':
    case 'chargeable_weight':
      return sanitizeDecimal(value, 7, 3).replace(/\.$/, '');
    case 'volume':
      return sanitizeDecimal(value, 9, 3).replace(/\.$/, '');
    case 'rate':
      return sanitizeDecimal(value, 8, 2).replace(/\.$/, '');
    case 'total_charge':
    case 'amount':
    case 'prepaid_weight_charge':
    case 'prepaid_other_charge':
    case 'total_prepaid':
    case 'collect_charge':
      return sanitizeDecimal(value, 12, 2).replace(/\.$/, '');
    case 'currency':
      return sanitizeAlpha(value, 3);
    case 'charge_code':
      return sanitizeAlpha(value, 2);
    case 'weight_charge_pp_cc':
    case 'other_charge_pp_cc':
      return sanitizePpCc(value);
    case 'declared_value_carriage':
      return sanitizeDeclaredValue(value, 'NVD');
    case 'declared_value_customs':
      return sanitizeDeclaredValue(value, 'NCV');
    case 'insurance_value': {
      const raw = String(value ?? '').toUpperCase().trim();
      if (!raw) return '';
      if (raw === 'XXX') return 'XXX';
      return sanitizeDecimal(raw, 11, 2).replace(/\.$/, '');
    }
    case 'rate_line_no':
      return sanitizeDigits(value, 2);
    case 'rate_class':
      return sanitizeAlpha(value, 1);
    case 'agent_iata_code':
      return sanitizeDigits(value, 7);
    case 'flight_carrier':
    case 'first_carrier':
    case 'onward_carrier':
      return sanitizeAlnum(value, 2);
    case 'flight_number':
      return sanitizeAlnum(value, 5);
    case 'shipper_country':
    case 'consignee_country':
    case 'country_of_origin':
      return sanitizeAlpha(value, 2);
    case 'hs_code':
      return sanitizeAlnum(value, 18);
    case 'special_handling_code':
      return sanitizeAlnum(value, 3);
    case 'shipper_name':
    case 'consignee_name':
      return sanitizeText(value, 35);
    case 'shipper_address':
    case 'consignee_address':
      return sanitizeText(value, 70);
    case 'shipper_city':
    case 'consignee_city':
    case 'agent_city':
      return sanitizeText(value, 17);
    case 'shipper_state':
    case 'consignee_state':
      return sanitizeText(value, 9);
    case 'shipper_postcode':
    case 'consignee_postcode':
      return sanitizeAlnum(value, 9);
    case 'agent_name':
    case 'issued_by':
    case 'shipper_certification':
      return sanitizeText(value, 20);
    case 'issue_place':
      return sanitizeText(value, 17);
    case 'goods_description':
      return sanitizeText(value, 20);
    case 'dimensions':
      return String(value ?? '')
        .toUpperCase()
        .replace(/[^A-Z0-9./\- ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 65);
    case 'shipper_contact':
    case 'consignee_contact':
    case 'agent_account':
      return String(value ?? '')
        .toUpperCase()
        .replace(/[^A-Z0-9 +().\-@/]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 25);
    case 'routing_list':
      return String(value ?? '')
        .toUpperCase()
        .replace(/[^A-Z0-9/ ,;\r\n-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);
    case 'ssr':
    case 'osi':
    case 'oci':
      return sanitizeText(value, 65);
    default:
      return value;
  }
};

const REQUIRED_RULES = [
  ['message_type', 'Message Type'],
  ['message_version', 'Message Version'],
  ['awb_prefix', 'AWB Prefix'],
  ['awb_number', 'AWB Number'],
  ['origin', 'Origin'],
  ['destination', 'Destination'],
  ['shipment_description_code', 'Shipment Description Code'],
  ['total_pieces', 'Total Pieces'],
  ['weight_unit', 'Weight Unit'],
  ['gross_weight', 'Gross Weight'],
  ['shipper_name', 'Shipper Name'],
  ['consignee_name', 'Consignee Name'],
  ['currency', 'Currency'],
  ['charge_code', 'Charge Code'],
  ['weight_charge_pp_cc', 'Weight Charge PP/CC'],
  ['other_charge_pp_cc', 'Other Charge PP/CC'],
  ['rate_line_no', 'Rate Line No'],
  ['pieces', 'Pieces'],
  ['weight', 'Weight'],
  ['goods_description', 'Goods Description'],
  ['issue_date', 'Issue Date'],
  ['issue_place', 'Issue Place'],
  ['issued_by', 'Issued By'],
];

const FIELD_PATTERNS = {
  message_type: {
    pattern: /^FWB$/,
    message: 'Message Type harus "FWB".',
  },
  message_version: {
    pattern: /^\d{1,3}$/,
    message: 'Message Version harus numerik maksimal 3 digit.',
  },
  awb_prefix: {
    pattern: /^\d{3}$/,
    message: 'AWB Prefix harus 3 digit.',
  },
  awb_number: {
    pattern: /^\d{8}$/,
    message: 'AWB Number harus 8 digit.',
  },
  origin: {
    pattern: /^[A-Z]{3}$/,
    message: 'Origin harus kode IATA 3 huruf.',
  },
  destination: {
    pattern: /^[A-Z]{3}$/,
    message: 'Destination harus kode IATA 3 huruf.',
  },
  shipment_description_code: {
    pattern: /^[TP]$/,
    message: 'Shipment Description Code harus T atau P.',
  },
  total_pieces: {
    pattern: /^\d{1,4}$/,
    message: 'Total Pieces maksimal 4 digit.',
  },
  weight_unit: {
    pattern: /^[A-Z]$/,
    message: 'Weight Unit harus 1 karakter huruf (contoh: K).',
  },
  gross_weight: {
    pattern: /^\d{1,7}(\.\d{1,3})?$/,
    message: 'Gross Weight maksimal format n[...7]p.',
  },
  pieces: {
    pattern: /^\d{1,4}$/,
    message: 'Pieces maksimal 4 digit.',
  },
  weight: {
    pattern: /^\d{1,7}(\.\d{1,3})?$/,
    message: 'Weight maksimal format n[...7]p.',
  },
  currency: {
    pattern: /^[A-Z]{3}$/,
    message: 'Currency harus kode ISO 3 huruf.',
  },
  charge_code: {
    pattern: /^[A-Z]{2}$/,
    message: 'Charge Code harus 2 huruf.',
  },
  weight_charge_pp_cc: {
    pattern: /^(PP|CC|PC|CP)$/,
    message: 'Weight Charge harus PP/CC/PC/CP.',
  },
  other_charge_pp_cc: {
    pattern: /^(PP|CC|PC|CP)$/,
    message: 'Other Charge harus PP/CC/PC/CP.',
  },
  rate_line_no: {
    pattern: /^\d{1,2}$/,
    message: 'Rate Line No maksimal 2 digit.',
  },
  goods_description: {
    pattern: /^.{1,20}$/,
    message: 'Goods Description maksimal 20 karakter.',
  },
  issue_place: {
    pattern: /^.{1,17}$/,
    message: 'Issue Place maksimal 17 karakter.',
  },
  issued_by: {
    pattern: /^.{1,20}$/,
    message: 'Issued By maksimal 20 karakter.',
  },
  shipper_country: {
    pattern: /^[A-Z]{2}$/,
    message: 'Shipper Country harus kode ISO 2 huruf.',
  },
  consignee_country: {
    pattern: /^[A-Z]{2}$/,
    message: 'Consignee Country harus kode ISO 2 huruf.',
  },
  flight_carrier: {
    pattern: /^[A-Z0-9]{2}$/,
    message: 'Flight Carrier harus 2 karakter.',
  },
};

export const validateFwbData = (data) => {
  const source = data ?? {};
  const normalized = {};

  Object.keys(source).forEach((key) => {
    normalized[key] = sanitizeFwbFieldValue(key, source[key]);
  });

  const errors = {};
  REQUIRED_RULES.forEach(([key, label]) => {
    if (!String(normalized[key] ?? '').trim()) {
      errors[key] = `${label} wajib diisi.`;
    }
  });

  Object.entries(FIELD_PATTERNS).forEach(([key, rule]) => {
    if (errors[key]) return;
    const value = String(normalized[key] ?? '').trim();
    if (!value) return;
    if (!rule.pattern.test(value)) {
      errors[key] = rule.message;
    }
  });

  return {
    errors,
    normalized,
    isValid: Object.keys(errors).length === 0,
  };
};

export const getFwbFieldInputProps = (key) => {
  const map = {
    message_type: { maxLength: 3 },
    message_version: { maxLength: 3, inputMode: 'numeric' },
    awb_prefix: { maxLength: 3, inputMode: 'numeric', placeholder: '777' },
    awb_number: { maxLength: 8, inputMode: 'numeric', placeholder: '12345675' },
    origin: { maxLength: 3, placeholder: 'CGK' },
    destination: { maxLength: 3, placeholder: 'SIN' },
    shipment_description_code: { maxLength: 1, placeholder: 'T' },
    total_pieces: { maxLength: 4, inputMode: 'numeric' },
    weight_unit: { maxLength: 1, placeholder: 'K' },
    gross_weight: { inputMode: 'decimal', placeholder: '150.5' },
    shipper_name: { maxLength: 35 },
    consignee_name: { maxLength: 35 },
    shipper_city: { maxLength: 17 },
    consignee_city: { maxLength: 17 },
    shipper_country: { maxLength: 2, placeholder: 'ID' },
    consignee_country: { maxLength: 2, placeholder: 'US' },
    currency: { maxLength: 3, placeholder: 'USD' },
    charge_code: { maxLength: 2, placeholder: 'PX' },
    weight_charge_pp_cc: { maxLength: 2, placeholder: 'PP' },
    other_charge_pp_cc: { maxLength: 2, placeholder: 'PP' },
    rate_line_no: { maxLength: 2, inputMode: 'numeric', placeholder: '1' },
    pieces: { maxLength: 4, inputMode: 'numeric' },
    weight: { inputMode: 'decimal' },
    rate_class: { maxLength: 1, placeholder: 'M' },
    goods_description: { maxLength: 20 },
    hs_code: { maxLength: 18 },
    issue_place: { maxLength: 17 },
    issued_by: { maxLength: 20 },
  };
  return map[key] ?? {};
};
