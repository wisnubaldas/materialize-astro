import ediClient from '@lib/api/edi';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import formatFwbMessage from './fwbGenerator';

export default function SendEmailFwb({ slug }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const formattedTitle = useMemo(() => `FWB Message (${slug ?? ''})`, [slug]);

  const [sendData, setSendData] = useState(null);
  const headerData = sendData?.header ?? null;
  const agentData = sendData?.agen ?? null;
  const shipperData = headerData?.shipper ?? null;
  const consigneeData = headerData?.consignee ?? null;
  const agentEditableFields = ['CompanyName', 'CustomerCode'];
  const partyEditableFields = [
    'CompanyName',
    'Address1',
    'Address2',
    'City',
    'CountryCode',
    'PostCode',
    'NPWPNumber',
  ];
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
      console.log(email);
      console.log(message);
      const response = await ediClient.sendEmailEdi({
        email: email,
        message: message,
        data: sendData,
        edi: 'FWB',
      });
      console.log('response nya', response);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const data = await ediClient.parseFwb(slug);
        setSendData(data);
        if (!active) return;
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

  useEffect(() => {
    if (!sendData || !slug) return;
    setMessage(formatFwbMessage(sendData, slug));
  }, [sendData, slug]);

  const updateAgentField = (key, value) => {
    setSendData((prev) => {
      if (!prev) return prev;
      const nextAgent = { ...(prev.agen ?? {}), [key]: value };
      return { ...prev, agen: nextAgent };
    });
  };

  const updateHeaderPartyField = (partyKey, key, value) => {
    setSendData((prev) => {
      if (!prev) return prev;
      const header = { ...(prev.header ?? {}) };
      const party = { ...(header[partyKey] ?? {}), [key]: value };
      header[partyKey] = party;
      return { ...prev, header };
    });
  };

  const renderEditableFields = (data, onChange, emptyText, allowedKeys) => {
    if (!data) return emptyText;
    const entries = allowedKeys?.length
      ? allowedKeys
          .filter((key) => Object.prototype.hasOwnProperty.call(data, key))
          .map((key) => [key, data[key]])
      : Object.entries(data);
    if (!entries.length) return emptyText;
    return entries.map(([key, value]) => (
      <div key={key} className="col-md-4 mb-2">
        <label className="form-label text-primary">{key}</label>
        <input
          type="text"
          className="form-control"
          value={value ?? ''}
          onChange={(e) => onChange(key, e.target.value)}
        />
      </div>
    ));
  };
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
                    Data AWB
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
                <h4 className="lh-1">Data AWB</h4>
                <div className="row">
                  {headerData
                    ? Object.entries(headerData)
                        .filter(([key]) => key !== 'shipper' && key !== 'consignee')
                        .map(([key, value]) => (
                          <div key={key} className="col-md-4">
                            <strong className="fs-big text-primary">{key}:</strong> {String(value)}
                          </div>
                        ))
                    : 'Loading header...'}
                </div>
                <div className="nav-align-top mt-4">
                  <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item">
                      <button
                        type="button"
                        className="nav-link active"
                        role="tab"
                        data-bs-toggle="tab"
                        data-bs-target="#awb-tab-agent"
                        aria-controls="awb-tab-agent"
                        aria-selected="true"
                      >
                        Agen
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className="nav-link"
                        role="tab"
                        data-bs-toggle="tab"
                        data-bs-target="#awb-tab-shipper"
                        aria-controls="awb-tab-shipper"
                        aria-selected="false"
                      >
                        Shipper
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className="nav-link"
                        role="tab"
                        data-bs-toggle="tab"
                        data-bs-target="#awb-tab-consignee"
                        aria-controls="awb-tab-consignee"
                        aria-selected="false"
                      >
                        Consignee
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="tab-content p-0 pt-3">
                  <div className="tab-pane fade show active" id="awb-tab-agent" role="tabpanel">
                    <div className="row">
                      {renderEditableFields(
                        agentData,
                        updateAgentField,
                        'Tidak ada data agen.',
                        agentEditableFields,
                      )}
                    </div>
                  </div>
                  <div className="tab-pane fade" id="awb-tab-shipper" role="tabpanel">
                    <div className="row">
                      {renderEditableFields(
                        shipperData,
                        (key, value) => updateHeaderPartyField('shipper', key, value),
                        'Tidak ada data shipper.',
                        partyEditableFields,
                      )}
                    </div>
                  </div>
                  <div className="tab-pane fade" id="awb-tab-consignee" role="tabpanel">
                    <div className="row">
                      {renderEditableFields(
                        consigneeData,
                        (key, value) => updateHeaderPartyField('consignee', key, value),
                        'Tidak ada data consignee.',
                        partyEditableFields,
                      )}
                    </div>
                  </div>
                </div>
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
                <a href="#" className="btn btn-primary me-2" onClick={clickSendMail}>
                  <span className="icon-base ri ri-mail-send-line icon-16px me-1"></span> Send Email
                </a>
                <a href="/edi/fwb" className="btn btn-secondary me-2">
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
