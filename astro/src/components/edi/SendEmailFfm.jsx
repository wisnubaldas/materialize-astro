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

const selectFirst = (...values) => {
  for (const val of values) {
    if (val !== null && val !== undefined && val !== '') {
      return val;
    }
  }
  return '';
};

const formatFfmMessage = (payload, fallbackBuildup) => {
  const header = payload?.buildup;
  const master = payload?.master;
  const details = Array.isArray(payload?.details) ? payload.details : [];

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
    const goods = toUpper(selectFirst(item.KindOfGood, master.KindOfGood, 'GENERAL CARGO'));
    const flightSegment = `${mawb}${origin}${destination}`;
    const segment = [flightSegment, `T${pieces}K${weight}`, volume, goods]
      .filter(Boolean)
      .join('/');
    lines.push(segment);
  });

  lines.push('LAST');
  return lines.filter(Boolean).join('\n');
};

export default function SendEmailFfm({ slug }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const formattedTitle = useMemo(() => `FFM Message (${slug ?? ''})`, [slug]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ediClient.parseBuildupMawb(slug);
        if (!active) return;
        setMessage(formatFfmMessage(data, slug));
      } catch (err) {
        if (!active) return;
        setError(err?.message ?? 'Gagal memuat data FFM');
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
      setError('Slug buildup tidak valid');
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
