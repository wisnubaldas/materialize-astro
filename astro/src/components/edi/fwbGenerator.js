import dayjs from 'dayjs';

const normalizeText = (value) => {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const toUpper = (value) => normalizeText(value).toUpperCase();

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

  const addressParts = [info?.address1, info?.address2].map(toUpper).filter(Boolean);
  if (addressParts.length) {
    lines.push(`ADR/${addressParts.join(' ')}`);
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
  const formattedMawb = formatMawb(master?.MasterAWB || header?.MasterAWB || fallbackMawb);

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

  const headerParts = [
    `FWB/17 ${formattedMawb}${origin}${destination}`,
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
