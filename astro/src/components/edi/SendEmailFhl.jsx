import formatFhlMessage from '@components/edi/fhlGenerator';
import Spinner from '@components/parsial/Spinner';
import { showToast } from '@js/utils';
import ediClient from '@lib/api/edi';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';

export default function SendEmailFhl({ slug }) {
  console.log(slug);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataAjax, setDataAjax] = useState(null);
  const formattedTitle = useMemo(() => `FHL Message (${slug ?? ''})`, [slug]);
  const masterData = dataAjax?.master ?? null;
  const hostData = Array.isArray(dataAjax?.host_awbs) ? dataAjax.host_awbs : [];
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
      try {
        const response = await ediClient.sendEmailEdi({
          email: email,
          message: message,
          data: dataAjax,
          edi: 'FHL',
        });
        showToast({ type: 'success', title: 'FHL', message: 'Email FHL berhasil dikirim.' });
        console.log('response nya', response);
      } catch (err) {
        const toastMessage = err?.message ?? 'Gagal mengirim email FHL.';
        showToast({ type: 'danger', title: 'FHL', message: toastMessage });
      }
    }
  };
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ediClient.parseAwbMawb(slug);
        if (!active) return;
        // set data ajaxnya untuk ditampilkan di tab pertama
        setDataAjax(data);
        // bikn format fhl messagenya
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
                <h4 className="lh-1 pt-4">FHL Data Grid</h4>
                {hostData.length ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-striped ">
                      <thead>
                        <tr>
                          {Object.keys(hostData[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hostData.map((row, i) => (
                          <tr key={row.noid ?? i}>
                            {Object.values(row).map((value, idx) => (
                              <td key={idx}>{String(value ?? '-')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : dataAjax ? (
                  <div className="text-muted">Tidak ada data host.</div>
                ) : (
                  <Spinner />
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

