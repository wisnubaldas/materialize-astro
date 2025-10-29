import { Icon } from '@iconify-icon/react';
import GridData from '@components/GridData';
export default function VoidInvoiceGrid() {
  const columns = [
    {
      data: 'TANGGAL',
      title: 'TANGGAL',
    },
    {
      data: 'NO_INVOICE',
      title: 'NO_INVOICE',
    },
    {
      data: 'SMU',
      title: 'SMU',
    },
    {
      data: 'HAWB',
      title: 'HAWB',
    },
  ];
  const endpoint = '/angkasapura/get-void-invoice';
  return (
    <div className="row invoice-edit">
      <div className="col-lg-9 col-12 mb-lg-0 mb-6">
        <div className="card invoice-preview-card p-sm-12">
          <div className="card-body invoice-preview-header rounded p-3 px-3 text-heading">
            <div className="row mx-0 px-3">
              <div className="col-md-7 mb-md-0 mb-0 ps-0">
                <div className="d-flex svg-illustration align-items-center gap-3 mb-0">
                  <span className="app-brand-logo demo">
                    <Icon
                      icon="line-md:cloud-alt-print-twotone-loop"
                      width="36"
                      height="36"
                      className="text-primary"
                    />
                  </span>
                  <span className="mb-0 app-brand-text fw-semibold">Data Invoice Void</span>
                </div>
              </div>
            </div>
          </div>
          <GridData columns={columns} ajaxEndpoint={endpoint} />
        </div>
      </div>

      <div className="col-lg-3 col-12 invoice-actions">
        <div className="card mb-6">
          <div className="card-body">
            <button
              className="btn btn-primary d-grid w-100 mb-4"
              data-bs-toggle="offcanvas"
              data-bs-target="#sendInvoiceOffcanvas"
            >
              <span className="d-flex align-items-center justify-content-center text-nowrap">
                <Icon icon="line-md:file-off-twotone" className="scaleX-n1-rtl me-2" />
                Void Invoice
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
