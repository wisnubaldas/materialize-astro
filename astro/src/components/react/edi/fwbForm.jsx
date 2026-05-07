import '@libs/bs-stepper/bs-stepper.scss';
import { Fragment, useEffect, useRef, useState } from 'react';

const fwbSections = [
  {
    id: 'message-awb',
    title: 'Identifikasi Message & AWB',
    subtitle: 'Segment FWB/AWB',
    fields: [
      { key: 'message_type', label: 'Message Type', required: true, readOnly: true },
      { key: 'message_version', label: 'Message Version', required: true, readOnly: true },
      { key: 'awb_prefix', label: 'AWB Prefix', required: true },
      { key: 'awb_number', label: 'AWB Number', required: true },
      { key: 'origin', label: 'Origin', required: true },
      { key: 'destination', label: 'Destination', required: true },
      { key: 'shipment_description_code', label: 'Shipment Description Code', required: true },
      { key: 'total_pieces', label: 'Total Pieces', type: 'number', required: true },
      { key: 'weight_unit', label: 'Weight Unit', required: true },
      { key: 'gross_weight', label: 'Gross Weight', type: 'number', step: '0.01', required: true },
    ],
  },
  {
    id: 'routing-flight',
    title: 'Routing & Flight Booking',
    subtitle: 'Segment RTG/FLT',
    fields: [
      { key: 'routing_list', label: 'Routing List', colClass: 'col-12', type: 'textarea' },
      { key: 'first_carrier', label: 'First Carrier' },
      { key: 'onward_carrier', label: 'Onward Carrier' },
      { key: 'flight_number', label: 'Flight Number' },
      { key: 'flight_date', label: 'Flight Date', type: 'date' },
      { key: 'flight_carrier', label: 'Flight Carrier' },
    ],
  },
  {
    id: 'shipper',
    title: 'Shipper (Pengirim)',
    subtitle: 'Segment SHP',
    fields: [
      { key: 'shipper_name', label: 'Shipper Name', required: true },
      { key: 'shipper_address', label: 'Shipper Address', colClass: 'col-12', type: 'textarea' },
      { key: 'shipper_city', label: 'Shipper City' },
      { key: 'shipper_state', label: 'Shipper State' },
      { key: 'shipper_country', label: 'Shipper Country' },
      { key: 'shipper_postcode', label: 'Shipper Postcode' },
      { key: 'shipper_contact', label: 'Shipper Contact' },
    ],
  },
  {
    id: 'consignee',
    title: 'Consignee (Penerima)',
    subtitle: 'Segment CNE',
    fields: [
      { key: 'consignee_name', label: 'Consignee Name', required: true },
      {
        key: 'consignee_address',
        label: 'Consignee Address',
        colClass: 'col-12',
        type: 'textarea',
      },
      { key: 'consignee_city', label: 'Consignee City' },
      { key: 'consignee_state', label: 'Consignee State' },
      { key: 'consignee_country', label: 'Consignee Country' },
      { key: 'consignee_postcode', label: 'Consignee Postcode' },
      { key: 'consignee_contact', label: 'Consignee Contact' },
    ],
  },
  {
    id: 'agent',
    title: 'Agent (Forwarder)',
    subtitle: 'Segment AGT',
    fields: [
      { key: 'agent_iata_code', label: 'Agent IATA Code' },
      { key: 'agent_account', label: 'Agent Account' },
      { key: 'agent_name', label: 'Agent Name' },
      { key: 'agent_city', label: 'Agent City' },
    ],
  },
  {
    id: 'charge-declaration',
    title: 'Charge Declaration (CVD)',
    subtitle: 'Segment CVD',
    fields: [
      { key: 'currency', label: 'Currency', required: true },
      { key: 'charge_code', label: 'Charge Code' },
      { key: 'weight_charge_pp_cc', label: 'Weight Charge PP/CC', required: true },
      { key: 'other_charge_pp_cc', label: 'Other Charge PP/CC', required: true },
      { key: 'declared_value_carriage', label: 'Declared Value Carriage' },
      { key: 'declared_value_customs', label: 'Declared Value Customs' },
      { key: 'insurance_value', label: 'Insurance Value' },
    ],
  },
  {
    id: 'rate-goods',
    title: 'Rate & Goods Detail (RTD)',
    subtitle: 'Segment RTD',
    fields: [
      { key: 'rate_line_no', label: 'Rate Line No', required: true },
      { key: 'pieces', label: 'Pieces', type: 'number', required: true },
      { key: 'weight', label: 'Weight', type: 'number', step: '0.01', required: true },
      { key: 'rate_class', label: 'Rate Class' },
      { key: 'chargeable_weight', label: 'Chargeable Weight', type: 'number', step: '0.01' },
      { key: 'rate', label: 'Rate', type: 'number', step: '0.01' },
      { key: 'total_charge', label: 'Total Charge', type: 'number', step: '0.01' },
      {
        key: 'goods_description',
        label: 'Goods Description',
        colClass: 'col-12',
        type: 'textarea',
        required: true,
      },
      { key: 'dimensions', label: 'Dimensions', colClass: 'col-12' },
      { key: 'volume', label: 'Volume', type: 'number', step: '0.001' },
      { key: 'slac', label: 'SLAC', type: 'number', step: '1' },
      { key: 'hs_code', label: 'HS Code' },
      { key: 'country_of_origin', label: 'Country of Origin' },
    ],
  },
  {
    id: 'other-charges',
    title: 'Other Charges',
    subtitle: 'Segment OTH',
    fields: [
      { key: 'other_charge_code', label: 'Other Charge Code' },
      { key: 'entitlement', label: 'Entitlement' },
      { key: 'amount', label: 'Amount', type: 'number', step: '0.01' },
    ],
  },
  {
    id: 'charge-summary',
    title: 'Charge Summary (PPD / COL)',
    subtitle: 'Segment PPD/COL',
    fields: [
      {
        key: 'prepaid_weight_charge',
        label: 'Prepaid Weight Charge',
        type: 'number',
        step: '0.01',
      },
      { key: 'prepaid_other_charge', label: 'Prepaid Other Charge', type: 'number', step: '0.01' },
      { key: 'total_prepaid', label: 'Total Prepaid', type: 'number', step: '0.01' },
      { key: 'collect_charge', label: 'Collect Charge', type: 'number', step: '0.01' },
    ],
  },
  {
    id: 'certification-issue',
    title: 'Certification & Issue',
    subtitle: 'Segment CER/ISU',
    fields: [
      { key: 'shipper_certification', label: 'Shipper Certification' },
      { key: 'issue_date', label: 'Issue Date', type: 'date', required: true },
      { key: 'issue_place', label: 'Issue Place', required: true },
      { key: 'issued_by', label: 'Issued By', required: true },
    ],
  },
  {
    id: 'special-handling',
    title: 'Special Handling & Regulatory',
    subtitle: 'Segment SPH/SSR/OSI/OCI',
    fields: [
      { key: 'special_handling_code', label: 'Special Handling Code' },
      { key: 'ssr', label: 'SSR', colClass: 'col-12', type: 'textarea' },
      { key: 'osi', label: 'OSI', colClass: 'col-12', type: 'textarea' },
      { key: 'oci', label: 'OCI', colClass: 'col-12', type: 'textarea' },
    ],
  },
];

const renderField = (field, data, onChange) => {
  const value = data?.[field.key] ?? '';
  const id = `fwb-${field.key}`;
  const label = field.required ? (
    <>
      {field.label} <span className="text-danger">*</span>
    </>
  ) : (
    field.label
  );
  const colClass = field.colClass ?? 'col-md-6';
  const isReadOnly = field.readOnly === true;

  if (field.type === 'textarea') {
    return (
      <div key={field.key} className={`${colClass} mb-3`}>
        <label className="form-label text-primary" htmlFor={id}>
          {label}
        </label>
        <textarea
          id={id}
          className={`form-control${isReadOnly ? ' readonly' : ''}`}
          rows={field.rows ?? 2}
          value={value}
          placeholder={field.placeholder}
          readOnly={isReadOnly}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
        {field.helper ? <div className="form-text text-muted">{field.helper}</div> : null}
      </div>
    );
  }

  return (
    <div key={field.key} className={`${colClass} mb-3`}>
      <label className="form-label text-primary" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={field.type ?? 'text'}
        step={field.step}
        className={`form-control${isReadOnly ? ' readonly' : ''}`}
        value={value}
        placeholder={field.placeholder}
        readOnly={isReadOnly}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
      {field.helper ? <div className="form-text text-muted">{field.helper}</div> : null}
    </div>
  );
};

const parseEmails = (value) =>
  String(value || '')
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function FwbForm({
  fwbData,
  onFwbChange,
  onSubmit,
  isLoading = false,
  isSending = false,
}) {
  const initializedRef = useRef(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const initStepper = (StepperCtor) => {
    if (initializedRef.current || typeof window === 'undefined') {
      return;
    }

    const wizardModernVertical = document.querySelector('.wizard-modern-vertical');

    if (!wizardModernVertical || typeof StepperCtor !== 'function') {
      return;
    }

    const wizardModernVerticalBtnNextList = [].slice.call(
      wizardModernVertical.querySelectorAll('.btn-next')
    );
    const wizardModernVerticalBtnPrevList = [].slice.call(
      wizardModernVertical.querySelectorAll('.btn-prev')
    );
    const modernVerticalStepper = new StepperCtor(wizardModernVertical, {
      linear: false,
    });

    wizardModernVerticalBtnNextList?.forEach((wizardModernVerticalBtnNext) => {
      wizardModernVerticalBtnNext.addEventListener('click', (event) => {
        event.preventDefault();
        modernVerticalStepper.next();
      });
    });

    wizardModernVerticalBtnPrevList?.forEach((wizardModernVerticalBtnPrev) => {
      wizardModernVerticalBtnPrev.addEventListener('click', (event) => {
        event.preventDefault();
        modernVerticalStepper.previous();
      });
    });

    initializedRef.current = true;
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const module = await import('@libs/bs-stepper/bs-stepper.js');
        if (!active) return;
        initStepper(module.Stepper || window.Stepper);
      } catch (error) {
        console.error('[FwbForm] Failed to load bs-stepper', error);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || isSending) return;
    const recipients = parseEmails(emailInput);
    if (!recipients.length) {
      setEmailError('Alamat email wajib diisi.');
      return;
    }
    const invalid = recipients.filter((email) => !isValidEmail(email));
    if (invalid.length) {
      setEmailError(`Format email tidak valid: ${invalid.join(', ')}`);
      return;
    }
    setEmailError('');
    onSubmit?.({ emails: recipients });
  };

  const data = fwbData ?? {};
  const emailData = { email_recipients: emailInput };
  const handleChange = (key, value) => {
    onFwbChange?.(key, value);
  };
  const handleEmailChange = (key, value) => {
    if (key !== 'email_recipients') return;
    setEmailInput(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const emailSection = {
    id: 'email-recipients',
    title: 'Alamat Email Tujuan',
    subtitle: 'Pisahkan dengan koma atau baris baru',
    source: 'email',
    fields: [
      {
        key: 'email_recipients',
        label: 'Email Tujuan',
        type: 'textarea',
        colClass: 'col-12',
        required: true,
        rows: 3,
        placeholder: 'contoh: admin@example.com, operasi@example.com',
        helper: 'Pisahkan email dengan koma atau tekan Enter untuk baris baru.',
      },
    ],
  };
  const sections = [...fwbSections, emailSection];

  return (
    <div className="col-md-12">
      <div className="bs-stepper vertical wizard-modern wizard-modern-vertical">
        <div className="bs-stepper-header gap-lg-2">
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              <div className="step" data-target={`#${section.id}-step`}>
                <button type="button" className="step-trigger">
                  <span className="bs-stepper-circle">
                    <i className="icon-base ri ri-check-line"></i>
                  </span>
                  <span className="bs-stepper-label">
                    <span className="bs-stepper-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="d-flex flex-column gap-1 ms-2">
                      <span className="bs-stepper-title">{section.title}</span>
                      <span className="bs-stepper-subtitle">{section.subtitle}</span>
                    </span>
                  </span>
                </button>
              </div>
              {index < sections.length - 1 ? <div className="line"></div> : null}
            </Fragment>
          ))}
        </div>
        <div className="bs-stepper-content">
          <form onSubmit={handleSubmit}>
            {sections.map((section, index) => {
              const sectionData = section.source === 'email' ? emailData : data;
              const sectionChange = section.source === 'email' ? handleEmailChange : handleChange;

              return (
              <div id={`${section.id}-step`} key={section.id} className="content">
                <div className="content-header mb-3">
                  <h6 className="mb-0">{section.title}</h6>
                  <small>{section.subtitle}</small>
                </div>
                <div className="row g-3">
                  {section.fields.map((field) => renderField(field, sectionData, sectionChange))}
                  {section.id === 'email-recipients' && emailError ? (
                    <div className="col-12">
                      <div className="alert alert-danger py-2 mb-0">{emailError}</div>
                    </div>
                  ) : null}
                  <div className="col-12 d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-prev"
                      disabled={index === 0}
                    >
                      <i className="icon-base ri ri-arrow-left-line icon-sm scaleX-n1-rtl me-sm-1 me-0"></i>
                      <span className="align-middle d-sm-inline-block d-none">Previous</span>
                    </button>
                    {index === sections.length - 1 ? (
                      <button
                        type="submit"
                        className="btn btn-primary btn-submit"
                        disabled={isSending || isLoading}
                      >
                        {isSending ? 'Mengirim...' : 'Kirim Email'}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-primary btn-next">
                        <span className="align-middle d-sm-inline-block d-none me-sm-1">Next</span>{' '}
                        <i className="icon-base ri ri-arrow-right-line icon-sm"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </form>
        </div>
      </div>
    </div>
  );
}
