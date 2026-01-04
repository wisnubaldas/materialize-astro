import ediClient from '@lib/api/edi';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

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
  const [dataAjax, setDataAjax] = useState('');

  const formattedTitle = useMemo(() => `FFM Message (${slug ?? ''})`, [slug]);
  const clickSendMail = async (e) => {
    e.preventDefault();
    const { value: email } = await Swal.fire({
      title: 'Email Send',
      theme: 'bootstrap-5',
      input: 'email',
      inputPlaceholder: 'Email tijuan ',
    });
    if (email) {
      console.log(email);
      console.log(message);
      console.log(dataAjax);
      const response = await ediClient.sendEmailEdi({
        email: email,
        message: message,
        data: dataAjax,
        edi: 'FFM',
      });
      console.log('response nya', response);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ediClient.parseBuildupMawb(slug);
        if (!active) return;
        setDataAjax(data);
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
    <>
      <div className="col-md-12 col-xl-12">
        <div className="card">
          <div className="card-header px-0 pt-0">
            <div className="nav-align-top">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link active"
                    role="tab"
                    data-bs-toggle="tab"
                    data-bs-target="#navs-tab-home"
                    aria-controls="navs-tab-home"
                    aria-selected="true"
                  >
                    Data Breakdown
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link"
                    role="tab"
                    data-bs-toggle="tab"
                    data-bs-target="#navs-tab-profile"
                    aria-controls="navs-tab-profile"
                    aria-selected="false"
                  >
                    Cargo-IMP
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link disabled"
                    data-bs-toggle="tab"
                    role="tab"
                    aria-selected="false"
                  >
                    Cargo-XML
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="card-body">
            <div className="tab-content p-0">
              <div className="tab-pane fade show active" id="navs-tab-home" role="tabpanel">
                <h5 className="card-title">Special title treatment</h5>
                <div>{JSON.stringify(dataAjax)}</div>
              </div>
              <div className="tab-pane fade" id="navs-tab-profile" role="tabpanel">
                <h5 className="card-title">{formattedTitle} </h5>
                {loading ? (
                  <div className="text-muted">Memuat data...</div>
                ) : error ? (
                  <div className="alert alert-danger mb-0">{error}</div>
                ) : (
                  <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap' }}>
                    {message}
                  </pre>
                )}
                <a href="/edi/ffm" className="btn btn-primary me-2" onClick={clickSendMail}>
                  <span className="icon-base ri ri-mail-send-line icon-16px me-1"></span> Send Email
                </a>
                <a href="/edi/ffm" className="btn btn-secondary me-2">
                  <span className="icon-base ri ri-arrow-go-back-fill icon-16px me-1"></span> Back
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
