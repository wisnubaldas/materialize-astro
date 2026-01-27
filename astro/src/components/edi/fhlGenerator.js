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

  const addressLines = buildAddressLines(normalized?.address1, normalized?.address2, [
    normalized?.city,
    normalized?.country,
    normalized?.postal,
  ]);
  if (addressLines.length) {
    lines.push(`ADR/${addressLines[0]}`);
    if (addressLines[1]) {
      const safeLine2 = normalizeAddressLine(addressLines[1]);
      lines.push(`/${safeLine2}`);
    }
  }

  const city = toUpper(normalized?.city);
  const country = toUpper(normalized?.country);
  if (city || country) {
    lines.push(`LOC/${city || 'UNKNOWN'}/${country || 'ID'}`);
  }

  //   if (normalized?.postal) {
  //     lines.push(`ZIP/${toUpper(normalized.postal)}`);
  //   }

  //   if (normalized?.tax) {
  //     lines.push(`TAX/${toUpper(normalized.tax)}`);
  //   }

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
  const destination =
    (master?.Destination ?? header?.Destination ?? '').trim().toUpperCase() || 'XXX';
  const airlinesCode = toUpper(
    master?.AirlinesCode ?? master?.airlinescode ?? hosts[0]?.airlinescode
  );
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
      item?.HostAWB ??
      item?.ProofNumber ??
      master?.MasterAWB ??
      header?.MasterAWB ??
      fallbackMawb ??
      '';
    const pieces = toNumber(item?.Quantity ?? item?.Pieces ?? item?.pieces ?? 0);
    const weight = toNumber(
      item?.Weight ?? item?.GrossWeight ?? item?.NettoWeight ?? item?.Netto ?? 0
    );
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
      extractHostParty(item, 'shipper') ?? payload?.shipper ?? header?.shipper ?? null;
    const consignee = extractHostParty(item, 'consignee') ?? header?.consignee ?? null;
    const shipperCode = item?.ShipperCode ?? master?.ShipperCode ?? header?.ShipperCode ?? '';
    const consigneeCode =
      item?.ConsigneeCode ?? master?.ConsigneeCode ?? header?.ConsigneeCode ?? '';

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
