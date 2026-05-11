import FwbForm from '@components/edi/fwbForm';
import ediClient from '@lib/api/edi';
import { showToast } from '@utils';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveErrorMessage } from './shared';
import { validateFwbData } from './fwbValidation';

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

  const origin = header?.Origin ?? '';
  const destination = header?.Destination ?? '';
  const shipperName = shipper?.CompanyName ?? 'UNKNOWN SHIPPER';
  const consigneeName = consignee?.CompanyName ?? 'UNKNOWN CONSIGNEE';
  const agentName = agent?.CompanyName ?? shipperName;

  return {
    message_type: 'FWB',
    message_version: '17',
    awb_prefix,
    awb_number,
    origin,
    destination,
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
    shipper_name: shipperName,
    shipper_address: joinParts(shipper?.Address1, shipper?.Address2),
    shipper_city: shipper?.City ?? origin,
    shipper_state: '',
    shipper_country: shipper?.CountryCode ?? 'ID',
    shipper_postcode: shipper?.PostCode ?? '',
    shipper_contact: buildContact(shipper),
    consignee_name: consigneeName,
    consignee_address: joinParts(consignee?.Address1, consignee?.Address2),
    consignee_city: consignee?.City ?? destination,
    consignee_state: '',
    consignee_country: consignee?.CountryCode ?? 'XX',
    consignee_postcode: consignee?.PostCode ?? '',
    consignee_contact: buildContact(consignee),
    agent_iata_code: '',
    agent_account: agent?.CustomerCode ?? header?.AgenCode ?? '',
    agent_name: agentName,
    agent_city: agent?.City ?? origin,
    currency: 'USD',
    charge_code: 'PX',
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
    goods_description: primaryDetail?.KindOfNature ?? 'GENERAL CARGO',
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
    shipper_certification: shipperName,
    issue_date: issueDate,
    issue_place: origin,
    issued_by: agentName,
    special_handling_code: primaryDetail?.DG ?? '',
    ssr: '',
    osi: '',
    oci: '',
  };
};

export default function FwbComposer({ mawb, onBack, onSaved }) {
  const previewModalRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sendData, setSendData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [previewState, setPreviewState] = useState({
    error: '',
    cargoImp: '',
    cargoXml: '',
    activeTab: 'cargo-imp',
  });

  const fwbData = useMemo(() => {
    if (!sendData) return null;
    const defaults = buildFwbDefaults(sendData, mawb);
    return {
      ...defaults,
      ...(sendData.fwb ?? {}),
    };
  }, [sendData, mawb]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ediClient.parseFwb(mawb);
        if (!active) return;
        setSendData(data);
      } catch (err) {
        if (!active) return;
        const msg = resolveErrorMessage(err, 'Gagal memuat data FWB');
        console.error('Gagal memuat data FWB:', err);
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (mawb) {
      load();
    } else {
      setLoading(false);
      setError('Master AWB tidak valid');
    }
    return () => {
      active = false;
    };
  }, [mawb]);

  useEffect(() => {
    const modalElement = previewModalRef.current;
    if (!modalElement) {
      return undefined;
    }
    const reset = () =>
      setPreviewState({
        error: '',
        cargoImp: '',
        cargoXml: '',
        activeTab: 'cargo-imp',
      });
    modalElement.addEventListener('hidden.bs.modal', reset);
    return () => modalElement.removeEventListener('hidden.bs.modal', reset);
  }, []);

  const updateFwbField = (key, value) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSendData((prev) => {
      if (!prev) return prev;
      const current = prev.fwb ?? buildFwbDefaults(prev, mawb);
      return { ...prev, fwb: { ...current, [key]: value } };
    });
  };

  const handleSave = async () => {
    if (!sendData || !fwbData) {
      showToast({ type: 'danger', title: 'FWB', message: 'Data FWB belum siap disimpan.' });
      return;
    }

    const validated = validateFwbData(fwbData);
    if (!validated.isValid) {
      setFormErrors(validated.errors);
      const firstError = Object.values(validated.errors)[0] || 'Validasi FWB belum lengkap.';
      showToast({ type: 'danger', title: 'FWB', message: firstError });
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});
      const payload = { ...sendData, fwb: validated.normalized };
      const saved = await ediClient.saveFwb({
        message: null,
        data: payload,
      });
      showToast({ type: 'success', title: 'FWB', message: 'Data FWB berhasil disimpan.' });
      onSaved?.(saved);
    } catch (err) {
      const msg = resolveErrorMessage(err, 'Gagal menyimpan data FWB.');
      console.error('Gagal menyimpan data FWB:', err);
      showToast({ type: 'danger', title: 'FWB', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!sendData || !fwbData) {
      showToast({ type: 'danger', title: 'FWB', message: 'Data FWB belum siap dipreview.' });
      return;
    }

    const validated = validateFwbData(fwbData);
    if (!validated.isValid) {
      setFormErrors(validated.errors);
      const firstError = Object.values(validated.errors)[0] || 'Validasi FWB belum lengkap.';
      showToast({ type: 'danger', title: 'FWB', message: firstError });
      return;
    }

    try {
      setPreviewing(true);
      setFormErrors({});
      setPreviewState({
        error: '',
        cargoImp: '',
        cargoXml: '',
        activeTab: 'cargo-imp',
      });
      const payload = { ...sendData, fwb: validated.normalized };
      const preview = await ediClient.previewFwb({ data: payload });
      setPreviewState({
        error: '',
        cargoImp: preview?.cargo_imp ?? '',
        cargoXml: preview?.cargo_xml ?? '',
        activeTab: 'cargo-imp',
      });
    } catch (err) {
      const msg = resolveErrorMessage(err, 'Gagal memuat preview FWB');
      console.error('Gagal preview FWB:', err);
      setPreviewState({
        error: msg,
        cargoImp: '',
        cargoXml: '',
        activeTab: 'cargo-imp',
      });
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="card shadow-none border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1 fw-bold text-uppercase">Form Pembuatan FWB</h5>
            <div className="text-muted small">Master AWB: {mawb || '-'}</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#fwbPreviewModal"
              onClick={handlePreview}
              disabled={loading || saving || previewing}
            >
              {previewing ? 'Memuat Preview...' : 'Preview FWB'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
              Kembali ke DataTable
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Memuat data FWB...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <FwbForm
            fwbData={fwbData}
            onFwbChange={updateFwbField}
            onSubmit={handleSave}
            isLoading={loading}
            isSending={saving}
            validationErrors={formErrors}
          />
        )}
      </div>

      <div
        className="modal fade"
        id="fwbPreviewModal"
        tabIndex={-1}
        aria-labelledby="fwbPreviewModalLabel"
        aria-hidden="true"
        ref={previewModalRef}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="fwbPreviewModalLabel">
                Preview FWB {mawb ? `- ${mawb}` : ''}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="nav-align-top mb-3">
                <ul className="nav nav-tabs" role="tablist">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${previewState.activeTab === 'cargo-imp' ? 'active' : ''}`}
                      onClick={() => setPreviewState((prev) => ({ ...prev, activeTab: 'cargo-imp' }))}
                    >
                      Cargo-IMP
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${previewState.activeTab === 'cargo-xml' ? 'active' : ''}`}
                      onClick={() => setPreviewState((prev) => ({ ...prev, activeTab: 'cargo-xml' }))}
                    >
                      Cargo-XML
                    </button>
                  </li>
                </ul>
              </div>
              {previewing ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  Memuat preview FWB...
                </div>
              ) : previewState.error ? (
                <div className="alert alert-danger mb-0">{previewState.error}</div>
              ) : (
                <pre className="bg-light border rounded p-3 small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {previewState.activeTab === 'cargo-xml'
                    ? previewState.cargoXml || 'Cargo-XML belum tersedia.'
                    : previewState.cargoImp || 'Cargo-IMP belum tersedia.'}
                </pre>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
