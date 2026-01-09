import GridData from '@components/GridData';
import formatFfmMessage from '@components/edi/ffmGenerator';
import ediClient from '@lib/api/edi';
import warehouseClient from '@lib/api/warehouse';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

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
  const flightData = dataAjax?.flight ?? null;
  const detailData = Array.isArray(dataAjax?.details) ? dataAjax.details : [];

  const formattedTitle = useMemo(() => {
    const titleRef = flightData?.flight_number ?? slug ?? '';
    return `FFM Message (${titleRef})`;
  }, [flightData?.flight_number, slug]);
  const detailColumns = useMemo(
    () => [
      { data: 'uld_type', title: 'ULD Type', className: 'text-uppercase' },
      { data: 'uld_number', title: 'ULD Number', className: 'text-uppercase' },
      { data: 'uld_owner', title: 'Owner', className: 'text-uppercase' },
      { data: 'destination', title: 'Destination', className: 'text-uppercase text-center' },
      {
        data: 'mawb_number',
        title: 'MAWB',
        className: 'text-uppercase',
        render: (value, type, row) => {
          if (type !== 'display') {
            return value ?? '';
          }
          const prefix = row?.mawb_prefix ? `${row.mawb_prefix}-` : '';
          return `${prefix}${value ?? ''}`;
        },
      },
      {
        data: 'pieces',
        title: 'Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'weight_kg',
        title: 'Weight (Kg)',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      { data: 'nature_of_goods', title: 'Nature of Goods' },
      { data: 'route', title: 'Route', className: 'text-uppercase' },
      {
        data: 'transit_flag',
        title: 'Transit',
        className: 'text-center',
        render: (value, type) =>
          badgeRenderer(value, type, {
            trueLabel: 'Transit',
            falseLabel: 'Direct',
            trueClass: 'bg-label-warning',
            falseClass: 'bg-label-success',
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
        const data = await warehouseClient.manifestFlightDetail(slug);
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
      setError('Flight ID tidak valid');
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
