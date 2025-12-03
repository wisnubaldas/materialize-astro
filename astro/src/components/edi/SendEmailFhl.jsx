import ediClient from '@lib/api/edi';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

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

const formatFhlMessage = (payload, fallbackMawb) => {
  const header = payload?.header;
  const details = Array.isArray(payload?.details) ? payload.details : [];

  const mawb = formatMawb(header?.MasterAWB ?? fallbackMawb);
  const origin = (header?.Origin ?? '').trim().toUpperCase() || 'XXX';
  const destination = (header?.Destination ?? '').trim().toUpperCase() || 'XXX';
  const totalPieces = header?.TotalPieces ?? 0;
  const totalNetto = header?.TotalNetto ?? 0;

  const lines = [];
  lines.push('FHL/5');
  lines.push(`MBI/${mawb}/${origin}${destination}/T${totalPieces || 0}K${formatWeight(totalNetto)}`);

  const houses = details.length
    ? details
    : [
        {
          HostAWB: header?.MasterAWB ?? fallbackMawb,
          Pieces: header?.TotalPieces ?? 0,
          NettoWeight: header?.TotalNetto ?? 0,
          KindOfNature: 'GENERAL CARGO',
        },
      ];

  houses.forEach((item) => {
    const hawb = item['HostAWB'] ?? item['ProofNumber'] ?? header?.MasterAWB ?? fallbackMawb ?? '';
    const pieces = item['Pieces'] ?? item['pieces'] ?? 0;
    const weight =
      item['GrossWeight'] ??
      item['NettoWeight'] ??
      item['Netto'] ??
      header?.TotalNetto ??
      0;
    const nature = String(
      item['KindOfNature'] ?? item['KindOfCode'] ?? header?.KindOfGood ?? 'GENERAL CARGO'
    ).trim();

    lines.push(
      `HBS/${hawb}/${origin}${destination}/${pieces || 0}/K${formatWeight(weight)}//${nature}`
    );
    const remarks = item['Remarks'];
    if (remarks) {
      lines.push(`TXT/${remarks}`);
    }
  });

  return lines.filter(Boolean).join('\n') || 'Tidak ada data FHL';
};

export default function SendEmailFhl({ slug }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const formattedTitle = useMemo(() => `FHL Message (${slug ?? ''})`, [slug]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ediClient.parseFhl(slug);
        if (!active) return;
        setMessage(formatFhlMessage(data, slug));
      } catch (err) {
        if (!active) return;
        setError(err?.message ?? 'Gagal memuat data FHL');
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
