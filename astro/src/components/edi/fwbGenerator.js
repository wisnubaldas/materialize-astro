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
  const header = payload?.header ?? null;
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const master = payload?.master ?? header ?? {};
  const hosts = Array.isArray(payload?.host_awbs) ? payload.host_awbs : details;
  const primaryHost = hosts[0] ?? details[0] ?? {};
  const origin = toUpper(master?.Origin || header?.Origin || 'XXX');
  const destination = toUpper(master?.Destination || header?.Destination || 'XXX');
  const masterAwb =
    master?.MasterAWB || header?.MasterAWB || details[0]?.MasterAWB || fallbackMawb;
  const formattedMawb = formatMawb(masterAwb);

  const totalPieces =
    master?.Pieces ??
    header?.TotalPieces ??
    (hosts.length ? sumBy(hosts, getPieces) : getPieces(primaryHost)) ??
    0;
  const totalWeight =
    master?.Weight ??
    header?.TotalNetto ??
    (hosts.length ? sumBy(hosts, getWeight) : getWeight(primaryHost)) ??
    0;
  const totalVolume =
    master?.Volume ??
    header?.TotalVolume ??
    (hosts.length ? sumBy(hosts, getVolume) : getVolume(primaryHost)) ??
    0;

  const goods = toUpper(
    master?.KindOfGood ||
      primaryHost?.descriptiongoods ||
      primaryHost?.KindOfNature ||
      'GENERAL CARGO'
  );
  const rateClass = toUpper(master?.KindOfCode || primaryHost?.kd_kemasan || primaryHost?.KindOfCode || '');

  const flightNumber = toUpper(
    master?.FlightNo || header?.FlightNumber || primaryHost?.FlightNo || primaryHost?.FlightNumber || ''
  );
  const carrier = toUpper(
    master?.AirlinesCode || header?.AirlinesCode || primaryHost?.airlinescode || primaryHost?.AirlinesCode || ''
  );
  const flightDesignator = `${carrier}${flightNumber}`;
  const flightDateRaw = master?.DateOfFlight || header?.DateOfFlight || primaryHost?.DateOfFlight || '';
  const flightDate =
    flightDateRaw && dayjs(flightDateRaw).isValid()
      ? dayjs(flightDateRaw).format('DDMMM').toUpperCase()
      : '';

  const slac = primaryHost?.Quantity ?? primaryHost?.Pieces ?? totalPieces;

  const shipperCustomer = header?.shipper ?? payload?.shipper;
  const consigneeCustomer = header?.consignee ?? payload?.consignee;

  const shipperInfo = {
    name: primaryHost?.shippername || shipperCustomer?.CompanyName,
    address1: primaryHost?.shipperaddress || shipperCustomer?.Address1,
    address2: shipperCustomer?.Address2,
    city: primaryHost?.shippercity || shipperCustomer?.City,
    country: primaryHost?.shippercountry || shipperCustomer?.CountryCode,
    postal: primaryHost?.shipperpostal || shipperCustomer?.PostCode,
    tax: primaryHost?.shipperTaxNo || shipperCustomer?.NPWPNumber,
  };

  const consigneeInfo = {
    name: primaryHost?.Consigneename || consigneeCustomer?.CompanyName || master?.ConsigneeCode,
    address1: primaryHost?.Consigneeaddress || consigneeCustomer?.Address1,
    address2: consigneeCustomer?.Address2,
    city: primaryHost?.Consigneecity || consigneeCustomer?.City,
    country: primaryHost?.Consigneecountry || consigneeCustomer?.CountryCode,
    postal: consigneeCustomer?.PostCode,
    tax: consigneeCustomer?.NPWPNumber,
  };

  const agentName = toUpper(payload?.agen?.CompanyName || 'AGENT');
  const agentCode = payload?.agen?.CustomerCode || master?.AgenCode || header?.AgenCode || '';

  const issueDateRaw = master?.DateEntry || header?.DateOfEntry || '';
  const issueDate =
    issueDateRaw && dayjs(issueDateRaw).isValid() ? dayjs(issueDateRaw) : dayjs();

  const lines = [];

  lines.push('FWB/17');
  const headerParts = [
    `${formattedMawb}${origin}${destination}`,
    `T${totalPieces || 0}`,
    `K${formatNumber(totalWeight, 1)}`,
  ];
  if (totalVolume) {
    headerParts.push(`MC${formatNumber(totalVolume, 3)}`);
  }
  lines.push(headerParts.join('/'));

  if (destination) {
    lines.push(`RTG/${destination}II`);
  }

  if (flightDesignator || flightDate) {
    lines.push(`FLT/${flightDesignator || 'UNKNOWN'}${flightDate ? `/${flightDate}` : ''}`);
  }

  lines.push(...buildPartySegments('SHP', shipperInfo, master?.ShipperCode));
  lines.push(...buildPartySegments('CNE', consigneeInfo, master?.ConsigneeCode));

  if (agentCode || agentName) {
    lines.push(`AGT//${agentCode || '0000000'}/${agentName}/${origin}`);
  }

  lines.push('CVD/USD//PP/NVD/NCV/XXX');

  const rateParts = [
    'RTD',
    '1',
    `P${slac || totalPieces || 0}`,
    `K${formatNumber(totalWeight, 1)}`,
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
  lines.push('PPD/WT0/OC0/CT0');

  if (shipperInfo?.name) {
    lines.push(`CER/${toUpper(shipperInfo.name)}`);
  }

  lines.push(`ISU/${issueDate.format('DDMMMYY').toUpperCase()}/${origin}/${agentName}`);
  lines.push(`REF///MAWB/${formattedMawb}`);

  return lines.filter(Boolean).join('\n');
};

export default formatFwbMessage;
