import dayjs from 'dayjs';

const normalizeText = (value) => {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const toUpper = (value) => normalizeText(value).toUpperCase();

const ADDRESS_LINE_LIMIT = 35;

const normalizeAddressLine = (value) => {
  if (!value) return '';
  const cleaned = toUpper(value)
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned
    .replace(/^ADR\//, '')
    .replace(/^\/+/, '')
    .replace(/^\\+/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const stripAdminTokens = (value) =>
  value
    .replace(/\b(KEC|KEL)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const splitByLength = (text, limit) => {
  if (!text) return ['', ''];
  if (text.length <= limit) return [text, ''];

  const words = text.split(' ');
  let line = '';
  let index = 0;

  for (; index < words.length; index += 1) {
    const next = line ? `${line} ${words[index]}` : words[index];
    if (next.length > limit) break;
    line = next;
  }

  if (!line) {
    return [text.slice(0, limit), text.slice(limit).trim()];
  }

  return [line, words.slice(index).join(' ').trim()];
};

const buildAddressLines = (address1, address2, fallbackParts = []) => {
  const rawLines = [address1, address2].filter(Boolean).map(normalizeAddressLine).filter(Boolean);
  if (!rawLines.length) {
    const fallbackLine = fallbackParts
      .filter(Boolean)
      .map(normalizeAddressLine)
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!fallbackLine) return [];
    rawLines.push(fallbackLine);
  }

  let line1 = rawLines[0];
  let line2 = rawLines.slice(1).join(' ').trim();

  const commaSplit = line1
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (commaSplit.length > 1) {
    line1 = commaSplit[0];
    line2 = [commaSplit.slice(1).join(' '), line2].filter(Boolean).join(' ').trim();
  }

  if (!line2) {
    const [first, rest] = splitByLength(line1, ADDRESS_LINE_LIMIT);
    line1 = first;
    line2 = rest;
  } else if (line1.length > ADDRESS_LINE_LIMIT) {
    const [first, rest] = splitByLength(line1, ADDRESS_LINE_LIMIT);
    line1 = first;
    line2 = [rest, line2].filter(Boolean).join(' ').trim();
  }

  if (line2 && line2.length > ADDRESS_LINE_LIMIT) {
    line2 = stripAdminTokens(line2);
  }

  if (line2 && line2.length > ADDRESS_LINE_LIMIT) {
    const [second] = splitByLength(line2, ADDRESS_LINE_LIMIT);
    line2 = second;
  }

  if (line2) {
    line2 = normalizeAddressLine(line2);
  }

  return [line1, line2].filter(Boolean);
};

const formatMawb = (mawb) => {
  const clean = normalizeText(mawb).replace(/[^a-zA-Z0-9]/g, '');
  if (!clean) return '';
  if (clean.includes('-')) return clean.toUpperCase();
  const prefix = clean.slice(0, 3);
  const serial = clean.slice(3, 11);
  return [prefix, serial].filter(Boolean).join('-').toUpperCase();
};

const formatNumber = (value, fractionDigits = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toFixed(fractionDigits).replace(/\.?0+$/, '');
};

const sumBy = (items, getter) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const val = Number(getter(item));
    return Number.isFinite(val) ? acc + val : acc;
  }, 0);

const toNumberOr = (value, fallback) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getPieces = (item) => item?.Quantity ?? item?.Pieces ?? 0;

const getWeight = (item) => item?.Weight ?? item?.NettoWeight ?? item?.GrossWeight ?? 0;

const getVolume = (item) => item?.Volume ?? item?.VolumeCargo ?? 0;

const buildPartySegments = (prefix, info, fallbackCode) => {
  const lines = [];
  const name = toUpper(info?.name || fallbackCode || '');
  if (name) {
    lines.push(`${prefix}NAM/${name}`);
  }

  const addressLines = buildAddressLines(info?.address1, info?.address2, [
    info?.city,
    info?.country,
    info?.postal,
  ]);
  if (addressLines.length) {
    lines.push(`ADR/${addressLines[0]}`);
    if (addressLines[1]) {
      lines.push(`/${addressLines[1]}`);
    }
  }

  const city = toUpper(info?.city);
  const country = toUpper(info?.country);
  if (city || country) {
    lines.push(`LOC/${city || 'UNKNOWN'}/${country || 'XX'}`);
  }

  if (info?.postal) {
    lines.push(`ZIP/${toUpper(info.postal)}`);
  }

  if (info?.tax) {
    lines.push(`TAX/${toUpper(info.tax)}`);
  }

  return lines;
};

const formatFwbMessage = (payload, fallbackMawb) => {
  const fwb = payload?.fwb ?? {};
  const header = payload?.header ?? null;
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const master = payload?.master ?? header ?? {};
  const hosts = Array.isArray(payload?.host_awbs) ? payload.host_awbs : details;
  const primaryHost = hosts[0] ?? details[0] ?? {};
  const origin = toUpper(fwb?.origin || master?.Origin || header?.Origin || 'XXX');
  const destination = toUpper(fwb?.destination || master?.Destination || header?.Destination || 'XXX');
  const awbPrefix = normalizeText(fwb?.awb_prefix || '');
  const awbNumber = normalizeText(fwb?.awb_number || '');
  const fwbAwb =
    awbPrefix || awbNumber
      ? [awbPrefix, awbNumber].filter(Boolean).join(awbPrefix && awbNumber ? '-' : '')
      : '';
  const masterAwb =
    fwbAwb ||
    master?.MasterAWB ||
    header?.MasterAWB ||
    details[0]?.MasterAWB ||
    fallbackMawb;
  const formattedMawb = formatMawb(masterAwb);

  const baseTotalPieces =
    master?.Pieces ??
    header?.TotalPieces ??
    (hosts.length ? sumBy(hosts, getPieces) : getPieces(primaryHost)) ??
    0;
  const baseTotalWeight =
    master?.Weight ??
    header?.TotalNetto ??
    (hosts.length ? sumBy(hosts, getWeight) : getWeight(primaryHost)) ??
    0;
  const baseTotalVolume =
    master?.Volume ??
    header?.TotalVolume ??
    (hosts.length ? sumBy(hosts, getVolume) : getVolume(primaryHost)) ??
    0;

  const totalPieces = toNumberOr(fwb?.total_pieces, baseTotalPieces);
  const totalWeight = toNumberOr(fwb?.gross_weight, baseTotalWeight);
  const totalVolume = toNumberOr(fwb?.volume, baseTotalVolume);

  const goods = toUpper(
    fwb?.goods_description ||
      master?.KindOfGood ||
      primaryHost?.descriptiongoods ||
      primaryHost?.KindOfNature ||
      'GENERAL CARGO'
  );
  const rateClass = toUpper(
    fwb?.rate_class || master?.KindOfCode || primaryHost?.kd_kemasan || primaryHost?.KindOfCode || ''
  );

  const flightNumber = toUpper(
    fwb?.flight_number ||
      master?.FlightNo ||
      header?.FlightNumber ||
      primaryHost?.FlightNo ||
      primaryHost?.FlightNumber ||
      ''
  );
  const carrier = toUpper(
    fwb?.flight_carrier ||
      master?.AirlinesCode ||
      header?.AirlinesCode ||
      primaryHost?.airlinescode ||
      primaryHost?.AirlinesCode ||
      ''
  );
  const flightDesignator = `${carrier}${flightNumber}`;
  const flightDateRaw =
    fwb?.flight_date || master?.DateOfFlight || header?.DateOfFlight || primaryHost?.DateOfFlight || '';
  const flightDate =
    flightDateRaw && dayjs(flightDateRaw).isValid()
      ? dayjs(flightDateRaw).format('DDMMM').toUpperCase()
      : '';

  const slac = toNumberOr(
    fwb?.slac,
    primaryHost?.Quantity ?? primaryHost?.Pieces ?? totalPieces
  );

  const shipperCustomer = header?.shipper ?? payload?.shipper;
  const consigneeCustomer = header?.consignee ?? payload?.consignee;

  const shipperInfo = {
    name: fwb?.shipper_name || primaryHost?.shippername || shipperCustomer?.CompanyName,
    address1: fwb?.shipper_address || primaryHost?.shipperaddress || shipperCustomer?.Address1,
    address2: shipperCustomer?.Address2,
    city: fwb?.shipper_city || primaryHost?.shippercity || shipperCustomer?.City,
    country: fwb?.shipper_country || primaryHost?.shippercountry || shipperCustomer?.CountryCode,
    postal: fwb?.shipper_postcode || primaryHost?.shipperpostal || shipperCustomer?.PostCode,
    tax: primaryHost?.shipperTaxNo || shipperCustomer?.NPWPNumber,
  };

  const consigneeInfo = {
    name:
      fwb?.consignee_name ||
      primaryHost?.Consigneename ||
      consigneeCustomer?.CompanyName ||
      master?.ConsigneeCode,
    address1:
      fwb?.consignee_address || primaryHost?.Consigneeaddress || consigneeCustomer?.Address1,
    address2: consigneeCustomer?.Address2,
    city: fwb?.consignee_city || primaryHost?.Consigneecity || consigneeCustomer?.City,
    country: fwb?.consignee_country || primaryHost?.Consigneecountry || consigneeCustomer?.CountryCode,
    postal: fwb?.consignee_postcode || consigneeCustomer?.PostCode,
    tax: consigneeCustomer?.NPWPNumber,
  };

  const agentName = toUpper(fwb?.agent_name || payload?.agen?.CompanyName || 'AGENT');
  const agentCode =
    fwb?.agent_account || payload?.agen?.CustomerCode || master?.AgenCode || header?.AgenCode || '';
  const agentCity = toUpper(fwb?.agent_city || origin);

  const issueDateRaw = fwb?.issue_date || master?.DateEntry || header?.DateOfEntry || '';
  const issueDate =
    issueDateRaw && dayjs(issueDateRaw).isValid() ? dayjs(issueDateRaw) : dayjs();

  const messageType = toUpper(fwb?.message_type || 'FWB');
  const messageVersion = normalizeText(fwb?.message_version || '17');
  const shipmentDescriptionCode = toUpper(fwb?.shipment_description_code || 'T');
  const weightUnit = toUpper(fwb?.weight_unit || 'K');

  const cvdCurrency = toUpper(fwb?.currency || 'USD');
  const cvdChargeCode = toUpper(fwb?.charge_code || '');
  const cvdWeightCharge = toUpper(fwb?.weight_charge_pp_cc || 'PP');
  const declaredValueCarriage = toUpper(fwb?.declared_value_carriage || 'NVD');
  const declaredValueCustoms = toUpper(fwb?.declared_value_customs || 'NCV');
  const insuranceValue = toUpper(fwb?.insurance_value || 'XXX');

  const prepaidWeight = toNumberOr(fwb?.prepaid_weight_charge, 0);
  const prepaidOther = toNumberOr(fwb?.prepaid_other_charge, 0);
  const totalPrepaid = toNumberOr(fwb?.total_prepaid, 0);
  const collectCharge = toNumberOr(fwb?.collect_charge, 0);
  const rateLineNo = normalizeText(fwb?.rate_line_no || '1');
  const ratePieces = toNumberOr(fwb?.pieces, slac || totalPieces || 0);
  const rateWeight = toNumberOr(fwb?.weight, totalWeight);

  const lines = [];

  lines.push(`${messageType}/${messageVersion}`);
  const headerParts = [
    `${formattedMawb}${origin}${destination}`,
    `${shipmentDescriptionCode}${totalPieces || 0}`,
    `${weightUnit}${formatNumber(totalWeight, 1)}`,
  ];
  if (totalVolume) {
    headerParts.push(`MC${formatNumber(totalVolume, 3)}`);
  }
  lines.push(headerParts.join('/'));

  if (fwb?.routing_list) {
    lines.push(`RTG/${toUpper(fwb.routing_list)}`);
  } else if (destination) {
    lines.push(`RTG/${destination}II`);
  }

  if (flightDesignator || flightDate) {
    lines.push(`FLT/${flightDesignator || 'UNKNOWN'}${flightDate ? `/${flightDate}` : ''}`);
  }

  lines.push(...buildPartySegments('SHP', shipperInfo, master?.ShipperCode));
  lines.push(...buildPartySegments('CNE', consigneeInfo, master?.ConsigneeCode));

  if (agentCode || agentName) {
    lines.push(`AGT//${agentCode || '0000000'}/${agentName}/${agentCity || origin}`);
  }

  lines.push(
    `CVD/${cvdCurrency}/${cvdChargeCode}/${cvdWeightCharge}/${declaredValueCarriage}/${declaredValueCustoms}/${insuranceValue}`
  );

  const rateParts = [
    'RTD',
    rateLineNo || '1',
    `P${ratePieces}`,
    `K${formatNumber(rateWeight, 1)}`,
  ];

  if (rateClass) {
    rateParts.push(`NC/${rateClass}`);
  }

  rateParts.push(`NG/${goods}`);

  if (slac) {
    rateParts.push(`SLAC${slac}`);
  }

  if (totalVolume) {
    rateParts.push(`MC${formatNumber(totalVolume, 3)}`);
  }

  lines.push(rateParts.join('/'));
  lines.push(
    `PPD/WT${formatNumber(prepaidWeight, 1)}/OC${formatNumber(
      prepaidOther,
      1
    )}/CT${formatNumber(totalPrepaid, 1)}`
  );
  if (collectCharge) {
    lines.push(`COL/CT${formatNumber(collectCharge, 1)}`);
  }

  const certificationName = toUpper(fwb?.shipper_certification || shipperInfo?.name || '');
  if (certificationName) {
    lines.push(`CER/${certificationName}`);
  }

  const issuePlace = toUpper(fwb?.issue_place || origin);
  const issuedBy = toUpper(fwb?.issued_by || agentName);
  lines.push(`ISU/${issueDate.format('DDMMMYY').toUpperCase()}/${issuePlace}/${issuedBy}`);
  lines.push(`REF///MAWB/${formattedMawb}`);

  return lines.filter(Boolean).join('\n');
};

export default formatFwbMessage;
