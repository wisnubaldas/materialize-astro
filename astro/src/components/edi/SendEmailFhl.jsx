import ediClient from '@lib/api/edi';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

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
  lines.push(
    `MBI/${mawb}/${origin}${destination}/T${totalPieces || 0}K${formatWeight(totalNetto)}`
  );

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
      item['GrossWeight'] ?? item['NettoWeight'] ?? item['Netto'] ?? header?.TotalNetto ?? 0;
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
  const [dataAjax, setDataAjax] = useState('');
  const formattedTitle = useMemo(() => `FHL Message (${slug ?? ''})`, [slug]);
  const clickSendMail = async (e) => {
    e.preventDefault();
    const { value: email } = await Swal.fire({
      title: 'Email Send',
      theme: 'bootstrap-5',
      input: 'email',
      inputPlaceholder: 'Email tijuan ',
    });

    if (email) {
      //   kirim email fhlnya disini
      //   Swal.fire(`Entered email: ${email}`);
      //   console.log(email);
      //   console.log(message);
      //   console.log(dataAjax);
      const response = await ediClient.sendEmailEdi({
        email: email,
        message: message,
        data: dataAjax,
        edi: 'FHL',
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
        const data = await ediClient.parseFhl(slug);
        if (!active) return;
        setDataAjax(data);
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
                <h4 className="lh-1">Master Data</h4>
                <div className="row">
                  {dataAjax.header
                    ? Object.entries(dataAjax.header).map(([key, value]) => (
                        <div key={key} className="col-md-4">
                          <strong className="fs-big text-primary">{key}:</strong> {String(value)}
                        </div>
                      ))
                    : 'Loading header...'}
                </div>
                <h4 className="lh-1 pt-4">Detail Data</h4>
                {dataAjax.details ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-striped ">
                      <thead>
                        <tr>
                          {Object.keys(dataAjax.details[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dataAjax.details.map((row, i) => (
                          <tr key={row.noid ?? i}>
                            {Object.values(row).map((value, idx) => (
                              <td key={idx}>{String(value ?? '-')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  'Loading details...'
                )}
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
                <a href="/edi/fhl" className="btn btn-primary me-2" onClick={clickSendMail}>
                  <span className="icon-base ri ri-mail-send-line icon-16px me-1"></span> Send Email
                </a>
                <a href="/edi/fhl" className="btn btn-secondary me-2">
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
