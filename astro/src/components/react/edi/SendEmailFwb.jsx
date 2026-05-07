import FwbForm from '@components/edi/fwbForm';
import { showToast } from '@utils';
import ediClient from '@lib/api/edi';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import formatFwbMessage from './fwbGenerator';
import { resolveErrorMessage } from './shared';

const splitAwb = (awb) => {
  const raw = String(awb ?? '').replace(/[^0-9A-Za-z]/g, '');
  if (!raw) return { awb_prefix: '', awb_number: '' };
  return {
    awb_prefix: raw.slice(0, 3),
    awb_number: raw.slice(3, 11),
  };
};

const formatDateInput = (value) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

const joinParts = (...parts) =>
  parts
    .map((item) => (item ? String(item).trim() : ''))
    .filter(Boolean)
    .join(' ');

const buildContact = (customer) =>
  joinParts(
    customer?.EmailAddress,
    customer?.MobileNumber || customer?.Phonenumber,
    customer?.ContactNumber
  );

const sumBy = (items, getter) =>
  (Array.isArray(items) ? items : []).reduce((total, item) => {
    const value = Number(getter(item));
    if (!Number.isFinite(value)) return total;
    return total + value;
  }, 0);

const buildFwbDefaults = (payload, fallbackAwb) => {
  const header = payload?.header ?? {};
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const primaryDetail = details[0] ?? {};
  const agent = payload?.agen ?? {};
  const shipper = header?.shipper ?? {};
  const consignee = header?.consignee ?? {};

  const totalPieces = header?.TotalPieces ?? sumBy(details, (item) => item?.Pieces);
  const grossWeight =
    header?.TotalNetto ?? sumBy(details, (item) => item?.GrossWeight ?? item?.NettoWeight);
  const totalVolume = header?.TotalVolume ?? sumBy(details, (item) => item?.VolumeCargo);

  const { awb_prefix, awb_number } = splitAwb(header?.MasterAWB || fallbackAwb || '');
  const flightDate = formatDateInput(header?.DateOfFlight);
  const issueDate = formatDateInput(header?.DateOfEntry) || formatDateInput(new Date());

  const dimensions = [primaryDetail?.LongCargo, primaryDetail?.WidthCargo, primaryDetail?.HighCargo]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .join('x');

  return {
    message_type: 'FWB',
    message_version: '17',
    awb_prefix,
    awb_number,
    origin: header?.Origin ?? '',
    destination: header?.Destination ?? '',
    shipment_description_code: 'T',
    total_pieces: totalPieces || '',
    weight_unit: 'K',
    gross_weight: grossWeight || '',
    routing_list: '',
    first_carrier: '',
    onward_carrier: '',
    flight_number: header?.FlightNumber ?? '',
    flight_date: flightDate,
    flight_carrier: header?.AirlinesCode ?? '',
    shipper_name: shipper?.CompanyName ?? '',
    shipper_address: joinParts(shipper?.Address1, shipper?.Address2),
    shipper_city: shipper?.City ?? '',
    shipper_state: '',
    shipper_country: shipper?.CountryCode ?? '',
    shipper_postcode: shipper?.PostCode ?? '',
    shipper_contact: buildContact(shipper),
    consignee_name: consignee?.CompanyName ?? '',
    consignee_address: joinParts(consignee?.Address1, consignee?.Address2),
    consignee_city: consignee?.City ?? '',
    consignee_state: '',
    consignee_country: consignee?.CountryCode ?? '',
    consignee_postcode: consignee?.PostCode ?? '',
    consignee_contact: buildContact(consignee),
    agent_iata_code: '',
    agent_account: agent?.CustomerCode ?? header?.AgenCode ?? '',
    agent_name: agent?.CompanyName ?? '',
    agent_city: agent?.City ?? '',
    currency: 'USD',
    charge_code: '',
    weight_charge_pp_cc: header?.PaymentCode ?? 'PP',
    other_charge_pp_cc: header?.PaymentCode ?? 'PP',
    declared_value_carriage: 'NVD',
    declared_value_customs: 'NCV',
    insurance_value: 'XXX',
    rate_line_no: '1',
    pieces: totalPieces || '',
    weight: grossWeight || '',
    rate_class: primaryDetail?.KindOfCode ?? '',
    chargeable_weight: header?.TotalCAW ?? '',
    rate: '',
    total_charge: '',
    goods_description: primaryDetail?.KindOfNature ?? '',
    dimensions,
    volume: totalVolume || '',
    slac: primaryDetail?.Pieces ?? (totalPieces || ''),
    hs_code: '',
    country_of_origin: '',
    other_charge_code: '',
    entitlement: '',
    amount: '',
    prepaid_weight_charge: '',
    prepaid_other_charge: '',
    total_prepaid: '',
    collect_charge: '',
    shipper_certification: shipper?.CompanyName ?? '',
    issue_date: issueDate,
    issue_place: header?.Origin ?? '',
    issued_by: agent?.CompanyName ?? '',
    special_handling_code: primaryDetail?.DG ?? '',
    ssr: '',
    osi: '',
    oci: '',
  };
};
export default function SendEmailFwb({ slug }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fwbDbData, setFwbDbData] = useState(null);
  const [fwbDbError, setFwbDbError] = useState('');
  const [fwbDbLoading, setFwbDbLoading] = useState(false);

  const formattedTitle = useMemo(() => `FWB Message (${slug ?? ''})`, [slug]);

  const [sendData, setSendData] = useState(null);
  const fwbData = useMemo(() => {
    if (!sendData) return null;
    return sendData.fwb ?? buildFwbDefaults(sendData, slug);
  }, [sendData, slug]);
  const handleSendEmail = async ({ emails }) => {
    const recipients = Array.isArray(emails) ? emails : [];
    if (!recipients.length) {
      showToast({ type: 'danger', title: 'FWB', message: 'Alamat email wajib diisi.' });
      return;
    }
    if (!sendData || !message) {
      showToast({ type: 'danger', title: 'FWB', message: 'Data FWB belum siap dikirim.' });
      return;
    }

    try {
      setSending(true);
      await ediClient.sendEmailFwb({
        emails: recipients,
        message: message,
        data: sendData,
        edi: 'FWB',
      });
      showToast({ type: 'success', title: 'FWB', message: 'Email FWB berhasil dikirim.' });
    } catch (err) {
      const toastMessage = resolveErrorMessage(err, 'Gagal mengirim email FWB.');
      showToast({ type: 'danger', title: 'FWB', message: toastMessage });
    } finally {
      setSending(false);
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
        if (!active) return;
        setSendData(data);
      } catch (err) {
        if (!active) return;
        setError(resolveErrorMessage(err, 'Gagal memuat data FWB'));
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
    let active = true;
    const loadFwbDb = async () => {
      if (!slug) return;
      setFwbDbLoading(true);
      setFwbDbError('');
      try {
        const data = await ediClient.getFwbByMawb(slug);
        if (!active) return;
        setFwbDbData(data);
      } catch (err) {
        if (!active) return;
        setFwbDbError(resolveErrorMessage(err, 'Gagal memuat data FWB dari database'));
        setFwbDbData(null);
      } finally {
        if (active) {
          setFwbDbLoading(false);
        }
      }
    };
    loadFwbDb();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!sendData || !slug) return;
    setMessage(formatFwbMessage(sendData, slug));
  }, [sendData, slug]);

  const updateFwbField = (key, value) => {
    setSendData((prev) => {
      if (!prev) return prev;
      const current = prev.fwb ?? buildFwbDefaults(prev, slug);
      return { ...prev, fwb: { ...current, [key]: value } };
    });
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
                    className="nav-link"
                    role="tab"
                    data-bs-toggle="tab"
                    data-bs-target="#navs-tab-fwb-db"
                    aria-controls="navs-tab-fwb-db"
                    aria-selected="false"
                  >
                    FWB DB
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
                <FwbForm
                  fwbData={fwbData}
                  onFwbChange={updateFwbField}
                  onSubmit={handleSendEmail}
                  isLoading={loading}
                  isSending={sending}
                />
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
              </div>
              <div className="tab-pane fade" id="navs-tab-fwb-db" role="tabpanel">
                <h5 className="card-title">Data FWB (Database)</h5>
                {fwbDbLoading ? (
                  <div className="text-muted">Memuat data FWB...</div>
                ) : fwbDbError ? (
                  <div className="alert alert-danger mb-0">{fwbDbError}</div>
                ) : fwbDbData ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <tbody>
                        {Object.entries(fwbDbData).map(([key, value]) => (
                          <tr key={key}>
                            <th className="text-nowrap">{key}</th>
                            <td>{value === null || value === undefined ? '-' : String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted">Belum ada data FWB tersimpan.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

