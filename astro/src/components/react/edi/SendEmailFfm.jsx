import GridData from '@components/GridData';
import formatFfmMessage from '@components/edi/ffmGenerator';
import ediClient from '@lib/api/edi';
import { showToast } from '@utils';
import { useEffect, useMemo, useState } from 'react';
import { promptEmailAddress, resolveErrorMessage } from './shared';

const numberRenderer = (value, type, fractionDigits = 0) => {
  if (type !== 'display' && type !== 'filter') {
    return value ?? null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  return numeric.toLocaleString('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const badgeRenderer = (value, type, { trueLabel, falseLabel, trueClass, falseClass }) => {
  if (type !== 'display') {
    return value;
  }

  const isTrue = value === true || value === 1 || value === '1' || value === 'true';
  const label = isTrue ? trueLabel : falseLabel;
  const theme = isTrue ? trueClass : falseClass;

  return `<span class="badge rounded-pill ${theme} px-2">${label}</span>`;
};

export default function SendEmailFfm({ slug }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataAjax, setDataAjax] = useState(null);
  const flightData = dataAjax?.buildup ?? dataAjax?.flight ?? null;
  const detailData = Array.isArray(dataAjax?.details) ? dataAjax.details : [];

  const formattedTitle = useMemo(() => {
    const titleRef = flightData?.flight_number ?? flightData?.buildup_number ?? slug ?? '';
    return `FFM Message (${titleRef})`;
  }, [flightData?.buildup_number, flightData?.flight_number, slug]);
  const detailColumns = useMemo(
    () => [
      {
        data: 'MasterAWB',
        title: 'MAWB',
        className: 'text-uppercase',
      },
      { data: 'BuildUpNumber', title: 'Build Up No', className: 'text-uppercase' },
      { data: 'TransitCode', title: 'Transit', className: 'text-uppercase' },
      { data: 'UldCardNumber', title: 'ULD Card', className: 'text-uppercase' },
      {
        data: 'Pieces',
        title: 'Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'Netto',
        title: 'Weight (Kg)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      {
        data: 'Volume',
        title: 'Volume',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      { data: 'KindOfGood', title: 'Nature of Goods' },
      { data: 'Remarks', title: 'Remarks' },
      {
        data: 'FFM',
        title: 'FFM',
        className: 'text-center text-uppercase',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Sent',
            falseLabel: 'Draft',
            trueClass: 'bg-label-success',
            falseClass: 'bg-label-secondary',
          }),
      },
    ],
    []
  );
  const detailTableOptions = useMemo(
    () => ({
      paging: true,
      searching: true,
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
    }),
    []
  );
  const clickSendMail = async (e) => {
    e.preventDefault();
    const email = await promptEmailAddress('Email Send FFM');
    if (email) {
      try {
        await ediClient.sendEmailEdi({
          email: email,
          message: message,
          data: dataAjax,
          edi: 'FFM',
        });
        showToast({ type: 'success', title: 'FFM', message: 'Email FFM berhasil dikirim.' });
      } catch (err) {
        const toastMessage = resolveErrorMessage(err, 'Gagal mengirim email FFM.');
        showToast({ type: 'danger', title: 'FFM', message: toastMessage });
      }
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
        setError(resolveErrorMessage(err, 'Gagal memuat data FFM'));
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
      setError('Build up number tidak valid');
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
                    Data FFM
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
                {detailData.length ? (
                  <GridData
                    columns={detailColumns}
                    data={detailData}
                    options={detailTableOptions}
                    className="table-bordered table-striped align-middle"
                  />
                ) : loading ? (
                  <div className="text-muted">Memuat data...</div>
                ) : error ? (
                  <div className="alert alert-danger mb-0">{error}</div>
                ) : (
                  <div className="text-muted">Tidak ada detail FFM.</div>
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



