import ediClient from '@lib/api/edi';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

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
  const master = payload?.master ?? {};
  const hosts = Array.isArray(payload?.host_awbs) ? payload.host_awbs : [];
  const primaryHost = hosts[0] ?? {};
  const origin = toUpper(master?.Origin || 'XXX');
  const destination = toUpper(master?.Destination || 'XXX');
  const formattedMawb = formatMawb(master?.MasterAWB || fallbackMawb);

  const totalPieces =
    master?.Pieces ??
    (hosts.length ? sumBy(hosts, (item) => item?.Quantity) : primaryHost?.Quantity) ??
    0;
  const totalWeight =
    master?.Weight ??
    (hosts.length ? sumBy(hosts, (item) => item?.Weight) : primaryHost?.Weight) ??
    0;
  const totalVolume =
    master?.Volume ??
    (hosts.length ? sumBy(hosts, (item) => item?.Volume) : primaryHost?.Volume) ??
    0;

  const goods = toUpper(master?.KindOfGood || primaryHost?.descriptiongoods || 'GENERAL CARGO');
  const rateClass = toUpper(master?.KindOfCode || primaryHost?.kd_kemasan || '');

  const flightNumber = toUpper(master?.FlightNo || primaryHost?.FlightNo || '');
  const carrier = toUpper(master?.AirlinesCode || primaryHost?.airlinescode || '');
  const flightDesignator = `${carrier}${flightNumber}`;
  const flightDateRaw = master?.DateOfFlight || primaryHost?.DateOfFlight || '';
  const flightDate =
    flightDateRaw && dayjs(flightDateRaw).isValid()
      ? dayjs(flightDateRaw).format('DDMMM').toUpperCase()
      : '';

  const slac = primaryHost?.Quantity ?? totalPieces;

  const shipperInfo = {
    name: primaryHost?.shippername || payload?.shipper?.CompanyName,
    address1: primaryHost?.shipperaddress || payload?.shipper?.Address1,
    address2: payload?.shipper?.Address2,
    city: primaryHost?.shippercity || payload?.shipper?.City,
    country: primaryHost?.shippercountry || payload?.shipper?.CountryCode,
    postal: primaryHost?.shipperpostal || payload?.shipper?.PostCode,
    tax: primaryHost?.shipperTaxNo || payload?.shipper?.NPWPNumber,
  };

  const consigneeInfo = {
    name: primaryHost?.Consigneename || master?.ConsigneeCode,
    address1: primaryHost?.Consigneeaddress,
    address2: '',
    city: primaryHost?.Consigneecity,
    country: primaryHost?.Consigneecountry,
    postal: '',
    tax: '',
  };

  const agentName = toUpper(payload?.agen?.CompanyName || 'AGENT');
  const agentCode = payload?.agen?.CustomerCode || master?.AgenCode || '';

  const issueDate = master?.DateEntry && dayjs(master.DateEntry).isValid()
    ? dayjs(master.DateEntry)
    : dayjs();

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

export default function SendEmailFwb({ slug }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const formattedTitle = useMemo(() => `FWB Message (${slug ?? ''})`, [slug]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ediClient.parseAwbMawb(slug);
        if (!active) return;
        setMessage(formatFwbMessage(data, slug));
      } catch (err) {
        if (!active) return;
        setError(err?.message ?? 'Gagal memuat data FWB');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    if (slug) {
      load();
    } else {
      setLoading(false);
      setError('Slug AWB tidak valid');
    }

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h6 className="card-title mb-0 text-uppercase">{formattedTitle}</h6>
        {!loading && !error ? (
          <small className="text-muted">
            Generated at {dayjs().format('DD MMM YYYY HH:mm')}
          </small>
        ) : null}
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-muted">Memuat data...</div>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : (
          <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap' }}>
            {message}
          </pre>
        )}
      </div>
    </div>
  );
}
