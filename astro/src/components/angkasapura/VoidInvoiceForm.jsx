import { useMemo, useState } from 'react';
import { apiClient } from '@lib/api/client';
import { showToast } from '@js/utils';

export default function VoidInvoiceForm() {
  const [formData, setFormData] = useState({
    TANGGAL: '',
    NO_INVOICE: '',
    SMU: '',
    HAWB: '',
  });
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('JSON:', JSON.stringify(formData));
    try {
      const rersponse = await apiClient.post('/angkasapura/void-invoice', formData);
      console.log(rersponse);
      showToast({
        type: 'auccess',
        message: 'Berhasil data void.',
        title: 'Void Invoice',
      });
    } catch (error) {
      console.error(error);
      showToast({
        type: 'danger',
        message: error.message,
        title: 'Void Invoice',
      });
    }
  };
  return (
    <div className="offcanvas offcanvas-end" id="sendInvoiceOffcanvas" aria-hidden="true">
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title">Void Invoice</h5>
        <button
          type="button"
          className="btn-close text-reset"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>
      <div className="offcanvas-body grow">
        <form onSubmit={handleSubmit}>
          <div className="form-floating form-floating-outline mb-5">
            <input
              id="invoice-from"
              type="date"
              className="form-control"
              placeholder="YYYY-MM-DD"
              value={formData.TANGGAL}
              onChange={handleChange}
              name="TANGGAL"
            />
            <label htmlFor="invoice-from">TANGGAL</label>
          </div>

          <div className="form-floating form-floating-outline mb-5">
            <input
              type="text"
              className="form-control"
              id="invoice-to"
              name="NO_INVOICE"
              value={formData.NO_INVOICE}
              onChange={handleChange}
            />
            <label htmlFor="invoice-to">NO_INVOICE</label>
          </div>
          <div className="form-floating form-floating-outline mb-5">
            <input
              type="text"
              className="form-control"
              id="smu"
              name="SMU"
              value={formData.SMU}
              onChange={handleChange}
            />
            <label htmlFor="smu">SMU</label>
          </div>
          <div className="form-floating form-floating-outline mb-5">
            <input
              type="text"
              className="form-control"
              id="hawb"
              name="HAWB"
              value={formData.HAWB}
              onChange={handleChange}
            />
            <label htmlFor="hawb">HAWB</label>
          </div>
          <div className="mb-4 d-flex flex-wrap">
            <button type="submit" className="btn btn-primary me-4" data-bs-dismiss="offcanvas">
              Send Void
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
