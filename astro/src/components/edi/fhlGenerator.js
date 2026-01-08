const formatMawb = (mawb) => {
  if (!mawb) return '';
  if (mawb.includes('-')) return mawb;
  if (mawb.length >= 11) {
    const prefix = mawb.slice(0, 3);
    const serial = mawb.slice(3);
    return `${prefix}-${serial}`;
  }
  return mawb;
};

const formatWeight = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const normalizeText = (value) => {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const toUpper = (value) => normalizeText(value).toUpperCase();

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizePartyData = (party, fallbackCode) => {
  if (!party && !fallbackCode) {
    return null;
  }

  return {
    name: party?.CompanyName ?? party?.name ?? fallbackCode ?? '',
    address1: party?.Address1 ?? party?.address1 ?? party?.address ?? '',
    address2: party?.Address2 ?? party?.address2 ?? '',
    city: party?.City ?? party?.city ?? '',
    country: party?.CountryCode ?? party?.country ?? '',
    postal: party?.PostCode ?? party?.postal ?? '',
    tax: party?.NPWPNumber ?? party?.tax ?? '',
  };
};

const extractHostParty = (item, type) => {
  if (!item) {
    return null;
  }

  const party =
    type === 'shipper'
      ? {
          name: item.shippername ?? item.ShipperName ?? '',
          address1: item.shipperaddress ?? item.ShipperAddress ?? '',
          city: item.shippercity ?? item.ShipperCity ?? '',
          country: item.shippercountry ?? item.ShipperCountry ?? '',
          postal: item.shipperpostal ?? item.ShipperPostal ?? '',
          tax: item.shipperTaxNo ?? item.ShipperTaxNo ?? '',
        }
      : {
          name: item.Consigneename ?? item.ConsigneeName ?? '',
          address1: item.Consigneeaddress ?? item.ConsigneeAddress ?? '',
          city: item.Consigneecity ?? item.ConsigneeCity ?? '',
          country: item.Consigneecountry ?? item.ConsigneeCountry ?? '',
          postal: item.Consigneepostal ?? item.ConsigneePostal ?? '',
          tax: item.ConsigneeTaxNo ?? '',
        };

  const hasValue = Object.values(party).some((value) => normalizeText(value));
  return hasValue ? party : null;
};

const buildPartyBlock = (tag, party, fallbackCode) => {
  const lines = [];
  const normalized = normalizePartyData(party, fallbackCode);
  const name = toUpper(normalized?.name ?? '');
  if (!name) {
    return lines;
  }

  lines.push(tag);
  lines.push(`NAM/${name}`);

  const address = [normalized?.address1, normalized?.address2]
    .map(toUpper)
    .filter(Boolean)
    .join(' ');
  if (address) {
    lines.push(`ADR/${address}`);
  }

  const city = toUpper(normalized?.city);
  const country = toUpper(normalized?.country);
  if (city || country) {
    lines.push(`LOC/${city || 'UNKNOWN'}/${country || 'XX'}`);
  }

  if (normalized?.postal) {
    lines.push(`ZIP/${toUpper(normalized.postal)}`);
  }

  if (normalized?.tax) {
    lines.push(`TAX/${toUpper(normalized.tax)}`);
  }

  return lines;
};

const getTxtLines = (item, header) => {
  const lines = [];
  const raw =
    item?.Remarks ??
    item?.Remark ??
    item?.TXT ??
    item?.Txt ??
    item?.TxtLines ??
    item?.descriptiongoods ??
    item?.descriptionGoods ??
    header?.Remarks ??
    header?.TXT ??
    '';

  if (Array.isArray(raw)) {
    raw.forEach((text) => {
      const cleaned = normalizeText(text);
      if (cleaned) {
        lines.push(cleaned);
      }
    });
  } else if (raw) {
    const cleaned = normalizeText(raw);
    if (cleaned) {
      lines.push(cleaned);
    }
  }

  if (!lines.length) {
    const fallback = normalizeText(item?.KindOfNature ?? header?.KindOfGood ?? '');
    if (fallback) {
      lines.push(fallback);
    }
  }

  return lines;
};

const formatFhlMessage = (payload, fallbackMawb) => {
  const header = payload?.header;
  const master = payload?.master ?? header ?? {};
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const hosts = Array.isArray(payload?.host_awbs) ? payload.host_awbs : [];

  const mawb = formatMawb(master?.MasterAWB ?? header?.MasterAWB ?? fallbackMawb);
  const origin = (master?.Origin ?? header?.Origin ?? '').trim().toUpperCase() || 'XXX';
  const destination = (master?.Destination ?? header?.Destination ?? '').trim().toUpperCase() || 'XXX';
  const airlinesCode = toUpper(master?.AirlinesCode ?? master?.airlinescode ?? hosts[0]?.airlinescode);
  const includeParties = airlinesCode !== 'FX';

  const houses = hosts.length
    ? hosts
    : details.length
    ? details
    : [
        {
          HostAWB: master?.MasterAWB ?? header?.MasterAWB ?? fallbackMawb,
          Pieces: master?.Pieces ?? master?.TotalPieces ?? header?.TotalPieces ?? 0,
          NettoWeight: master?.Weight ?? master?.TotalNetto ?? header?.TotalNetto ?? 0,
          KindOfNature: master?.KindOfGood ?? header?.KindOfGood ?? 'GENERAL CARGO',
        },
      ];

  const normalizedHouses = houses.map((item) => {
    const hawb =
      item?.HostAWB ?? item?.ProofNumber ?? master?.MasterAWB ?? header?.MasterAWB ?? fallbackMawb ?? '';
    const pieces = toNumber(item?.Quantity ?? item?.Pieces ?? item?.pieces ?? 0);
    const weight = toNumber(item?.Weight ?? item?.GrossWeight ?? item?.NettoWeight ?? item?.Netto ?? 0);
    const nature = String(
      item?.descriptiongoods ??
        item?.KindOfNature ??
        item?.KindOfCode ??
        master?.KindOfGood ??
        header?.KindOfGood ??
        'GENERAL CARGO'
    ).trim();
    const txtLines = getTxtLines(item, master ?? header ?? {});
    const shipper =
      extractHostParty(item, 'shipper') ??
      payload?.shipper ??
      header?.shipper ??
      null;
    const consignee = extractHostParty(item, 'consignee') ?? header?.consignee ?? null;
    const shipperCode = item?.ShipperCode ?? master?.ShipperCode ?? header?.ShipperCode ?? '';
    const consigneeCode = item?.ConsigneeCode ?? master?.ConsigneeCode ?? header?.ConsigneeCode ?? '';

    return {
      hawb,
      pieces,
      weight,
      nature,
      txtLines,
      shipper,
      consignee,
      shipperCode,
      consigneeCode,
    };
  });

  const totals = normalizedHouses.reduce(
    (acc, item) => {
      acc.pieces += item.pieces;
      acc.weight += item.weight;
      return acc;
    },
    { pieces: 0, weight: 0 }
  );

  const lines = [];
  lines.push('FHL/5');
  lines.push(
    `MBI/${mawb}/${origin}${destination}/T${totals.pieces || 0}K${formatWeight(totals.weight)}`
  );

  normalizedHouses.forEach((item) => {
    lines.push(
      `HBS/${item.hawb}/${origin}${destination}/${item.pieces || 0}/K${formatWeight(
        item.weight
      )}//${item.nature}`
    );
    item.txtLines.forEach((text) => {
      lines.push(`TXT/${text}`);
    });
    if (includeParties) {
      lines.push(...buildPartyBlock('SHP', item.shipper, item.shipperCode));
      lines.push(...buildPartyBlock('CNE', item.consignee, item.consigneeCode));
    }
  });

  return lines.filter(Boolean).join('\n') || 'Tidak ada data FHL';
};

export default formatFhlMessage;
