import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridData from '@components/GridData';
import InvoiceFilters from './InvoiceFilters.jsx';
import { formatRupiah } from '@js/utils.js';
// Kolom yang dikirim ke DataTables (server-side) termasuk renderer badge untuk invoice.
const columns = [
  {
    data: 'NO_INVOICE',
    title: 'No Invoice',
    className: 'text-primary fw-semibold',
    render: (data, type) => {
      if (type === 'display') {
        return `<span class="badge bg-label-primary border border-primary text-primary text-uppercase fw-semibold px-3 py-2 rounded-pill" style="cursor: pointer;">
        ${data ?? ''}</span>`;
      }
      return data;
    },
  },
  { data: 'TANGGAL', title: 'Tanggal' },
  { data: 'SMU', title: 'SMU' },
  { data: 'KDAIRLINE', title: 'Kode Airline' },
  { data: 'FLIGHT_NUMBER', title: 'Flight Number' },
  { data: 'DOM_INT', title: 'Dom/Int' },
  { data: 'INC_OUT', title: 'Inc/Out' },
  { data: 'ASAL', title: 'Asal' },
  { data: 'TUJUAN', title: 'Tujuan' },
  { data: 'JENIS_KARGO', title: 'Jenis Kargo' },
  { data: 'TARIF_KARGO', title: 'Tarif Kargo' },
  { data: 'KOLI', title: 'Koli' },
  { data: 'BERAT', title: 'Berat' },
  { data: 'VOLUME', title: 'Volume' },
  { data: 'JML_HARI', title: 'Jumlah Hari' },
  {
    data: 'CARGO_CHG',
    title: 'Cargo Charger',
    render: (data, type) => {
      return data ? formatRupiah(data) : '0';
    },
  },
  {
    data: 'KADE',
    title: 'Biaya Cade',
    render: (data, type) => {
      return data ? formatRupiah(data) : '0';
    },
  },
  {
    data: 'TOTAL_PENDAPATAN_TANPA_PPN',
    title: 'Pendapatan Non PPN',
    render: (data, type) => {
      return data ? formatRupiah(data) : '0';
    },
  },
  {
    data: 'TOTAL_PENDAPATAN_DENGAN_PPN',
    title: 'Pendapatan Include PPN',
    render: (data, type) => {
      return data ? formatRupiah(data) : '0';
    },
  },
  {
    data: 'PJT_HANDLING_FEE',
    title: 'Penanganan PJT',
    render: (data, type) => {
      return data ? formatRupiah(data) : '0';
    },
  },
  {
    data: 'RUSH_HANDLING_FEE',
    title: 'Penanganan Rush Handling',
    render: (data, type) => {
      return data ? formatRupiah(data) : '0';
    },
  },

];

// Nilai dasar untuk filter form dan payload DataTables.
const createDefaultFilters = () => ({
  NO_INVOICE: '',
  TANGGAL: '',
  FLIGHT_NUMBER: '',
  KDAIRLINE: '',
});

export default function DataInvoice() {
  const endpoint = '/angkasapura/datatables';
  // Simpan referensi API DataTables untuk trigger reload manual.
  const tableRef = useRef(null);
  // State penampung input form filter sebelum dikirim ke server.
  const [formFilters, setFormFilters] = useState(() => createDefaultFilters());
  // State filter yang sudah diterapkan (tersinkron ke request DataTables).
  const [activeFilters, setActiveFilters] = useState(() => createDefaultFilters());
  // Flag loading untuk men-disable tombol Apply selama DataTables memproses request.
  const [isProcessing, setIsProcessing] = useState(false);
  // Penanda agar reload otomatis tidak jalan pada render pertama.
  const hasMounted = useRef(false);
  // Opsi DataTables yang jarang berubah dibuat memo supaya referensinya stabil.
  const tableOptions = useMemo(
    () => ({
      order: [[1, 'desc']],
      searching: false,
      lengthChange: false,
      pageLength: 10,
      info: true,
      paging: true,
    }),
    []
  );

  // Update state form ketika pengguna mengetik.
  const handleFilterChange = (name, value) => {
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form dan payload filter ke kondisi awal.
  const handleResetFilters = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

  // Terapkan filter: cukup copy state form ke state aktif agar useEffect memicu reload.
  const handleApplyFilters = () => {
    setActiveFilters({ ...formFilters });
  };

  // Terima event processing dari DataTables untuk toggle spinner/tombol Apply.
  const handleProcessing = useCallback((_, __, processing) => {
    const next = Boolean(processing);
    setIsProcessing((prev) => (prev === next ? prev : next));
  }, []);

  // Reload tabel ketika filter aktif berubah setelah render pertama.
  useEffect(() => {
    const api = tableRef.current;
    if (!api?.reload) {
      return;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    api.reload(true);
  }, [activeFilters]);

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
        isSubmitting={isProcessing}
      />

      {/* Wrapper tabel server-side */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="card-datatable mb-3">
            <GridData
              ref={tableRef}
              columns={columns}
              ajaxEndpoint={endpoint}
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
