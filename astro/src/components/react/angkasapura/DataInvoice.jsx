import GridData from '@components/GridData';
import { DATA_INVOICE_COLUMNS, DATA_INVOICE_ENDPOINT, useDataInvoice } from './data-invoice.js';
import InvoiceFilters from './InvoiceFilters.jsx';

export default function DataInvoice() {
  const {
    tableRef,
    tableContainerRef,
    formFilters,
    activeFilters,
    tableOptions,
    isSubmitting,
    handleFilterChange,
    handleResetFilters,
    handleApplyFilters,
    handleProcessing,
  } = useDataInvoice();

  return (
    <div className="container-fluid px-0">
      {/* Header ringkas halaman */}
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">List Data Invoice Terkirim</h5>
        <p className="text-muted mb-0">Gunakan filter untuk mempercepat pencarian data.</p>
      </div>

      {/* Form filter responsif */}
      <InvoiceFilters
        values={formFilters}
        onChange={handleFilterChange}
        onSubmit={handleApplyFilters}
        onReset={handleResetFilters}
        isSubmitting={isSubmitting}
      />

      {/* Wrapper tabel server-side */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3" ref={tableContainerRef}>
          <div className="card-datatable mb-3">
            <GridData
              ref={tableRef}
              columns={DATA_INVOICE_COLUMNS}
              ajaxEndpoint={DATA_INVOICE_ENDPOINT}
              filters={activeFilters}
              options={tableOptions}
              onProcessing={handleProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
