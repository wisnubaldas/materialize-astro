import dayjs from 'dayjs';

const normalizeText = (value) => {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

const toUpper = (value) => normalizeText(value).toUpperCase();

const sanitizeSegmentText = (value) => {
  if (!value) return '';
  return normalizeText(value)
    .replace(/^ADR\//i, '')
    .replace(/^[\/\\]+/, '')
    .trim();
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

const selectFirst = (...values) => {
  for (const val of values) {
    if (val !== null && val !== undefined && val !== '') {
      return val;
    }
  }
  return '';
};

const parseRoute = (value) => {
  const cleaned = normalizeText(value);
  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(/[-/>\s]+/)
    .map((part) => normalizeText(part))
    .filter(Boolean);
};

const formatFfmMessage = (payload, fallbackBuildup) => {
  const header = payload?.buildup ?? payload?.flight ?? null;
  const master = payload?.master ?? null;
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const isManifest =
    !payload?.buildup &&
    (payload?.flight || details.some((item) => 'mawb_number' in (item ?? {})));

  if (isManifest) {
    if (!header || !details.length) {
      throw new Error('data manifest flight atau mawb tidak lengkap');
    }

    const origin = toUpper(selectFirst(header.point_of_loading, header.origin, 'XXX'));
    const destination = toUpper(selectFirst(header.point_of_unloading, header.destination, 'XXX'));
    const carrier = toUpper(selectFirst(header.airline_code, header.airlines_code, 'XX'));
    const flightNo = toUpper(selectFirst(header.flight_number, header.FlightNo, '0000'));
    const flightDateRaw = selectFirst(header.flight_date, header.date_of_flight, header.DateOfFlight);
    const flightDate =
      flightDateRaw && dayjs(flightDateRaw).isValid()
        ? dayjs(flightDateRaw).format('DDMMM').toUpperCase()
        : '01JAN';

    const lines = [];
    lines.push('FFM/8');
    lines.push(`1/${carrier}${flightNo}/${flightDate}/${origin}`);
    lines.push(destination);

    let currentUldKey = null;
    details.forEach((item) => {
      const mawbSeed = selectFirst(
        item?.MasterAWB,
        item?.mawb,
        item?.mawb_number ? `${item?.mawb_prefix ?? ''}${item?.mawb_number}` : ''
      );
      const hasUldId = Boolean(item?.uld_type || item?.uld_number || item?.uld_owner);
      const uldKey = hasUldId
        ? `${item?.uld_type ?? ''}|${item?.uld_number ?? ''}|${item?.uld_owner ?? ''}`
        : null;
      if (hasUldId && uldKey !== currentUldKey && (mawbSeed || item?.remarks)) {
        const uldId = [
          toUpper(item?.uld_type),
          toUpper(item?.uld_number),
          toUpper(item?.uld_owner),
        ]
          .filter(Boolean)
          .join('');
        const remarks = toUpper(sanitizeSegmentText(item?.remarks));
        const uldLine = remarks ? `ULD/${uldId}/${remarks}` : `ULD/${uldId}`;
        lines.push(uldLine);
        currentUldKey = uldKey;
      }
      if (!mawbSeed) {
        return;
      }
      const mawb = formatMawb(mawbSeed);
      const routeParts = parseRoute(item?.route);
      const routeOrigin = routeParts[0];
      const routeDestination = routeParts[routeParts.length - 1];
      const isTransit =
        item?.transit_flag === true ||
        item?.transit_flag === 1 ||
        item?.transit_flag === '1' ||
        item?.transit_flag === 'true';
      const useRoute = Boolean(routeDestination) && (isTransit || routeParts.length > 2);
      const segmentOrigin = toUpper(
        selectFirst(useRoute ? routeOrigin : '', header.point_of_loading, header.origin, 'XXX')
      );
      const segmentDestination = toUpper(
        selectFirst(
          useRoute ? routeDestination : '',
          item?.destination,
          header.point_of_unloading,
          'XXX'
        )
      );
      const pieces = formatNumber(selectFirst(item?.pieces, item?.Pieces, 0));
      const weight = formatNumber(selectFirst(item?.weight_kg, item?.Netto, 0), 1);
      const volumeVal = selectFirst(item?.volume, item?.Volume);
      const volume = volumeVal ? `MC${formatNumber(volumeVal, 2)}` : '';
      const goods = toUpper(
        sanitizeSegmentText(selectFirst(item?.nature_of_goods, item?.KindOfGood, 'GENERAL CARGO'))
      );
      const flightSegment = `${mawb}${segmentOrigin}${segmentDestination}`;
      const segment = [flightSegment, `T${pieces}K${weight}`, volume, goods]
        .filter(Boolean)
        .join('/');
      lines.push(segment);
    });

    lines.push('LAST');
    return lines.filter(Boolean).join('\n');
  }

  if (!header || !master || !details.length) {
    throw new Error('data buildup atau awb, mawb tidak lengkap');
  }

  const origin = toUpper(selectFirst(master.Origin, header.destination_code, 'XXX'));
  const destination = toUpper(selectFirst(master.Destination, header.destination_code, 'XXX'));

  const carrier = toUpper(selectFirst(header.airlines_code, master.AirlinesCode, 'XX'));
  const flightNo = toUpper(selectFirst(header.flight_number, master.FlightNo, '0000'));
  const flightDateRaw = selectFirst(header.date_of_flight, master.DateOfFlight);
  const flightDate =
    flightDateRaw && dayjs(flightDateRaw).isValid()
      ? dayjs(flightDateRaw).format('DDMMM').toUpperCase()
      : '01JAN';

  const lines = [];
  lines.push('FFM/8');
  lines.push(`1/${carrier}${flightNo}/${flightDate}/${origin}`);
  lines.push(destination);

  details.forEach((item) => {
    const mawb = formatMawb(selectFirst(item.MasterAWB, master.MasterAWB, fallbackBuildup));
    const pieces = formatNumber(selectFirst(item.Pieces, item.PartPieces, master.Pieces, 0));
    const weight = formatNumber(selectFirst(item.Netto, item.PartNetto, master.Weight, 0), 1);
    const volumeVal = selectFirst(item.Volume, master.Volume);
    const volume = volumeVal ? `MC${formatNumber(volumeVal, 2)}` : '';
    const goods = toUpper(
      sanitizeSegmentText(selectFirst(item.KindOfGood, master.KindOfGood, 'GENERAL CARGO'))
    );
    const flightSegment = `${mawb}${origin}${destination}`;
    const segment = [flightSegment, `T${pieces}K${weight}`, volume, goods]
      .filter(Boolean)
      .join('/');
    lines.push(segment);
  });

  lines.push('LAST');
  return lines.filter(Boolean).join('\n');
};

export default formatFfmMessage;
