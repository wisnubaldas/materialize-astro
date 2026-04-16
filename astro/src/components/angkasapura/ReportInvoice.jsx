import GridData from '@components/GridData';
import { formatRupiah, showToast } from '@js/utils.js';
import { apiClient } from '@lib/api/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

const MONTH_LABELS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const formatDateLabel = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatDecimal = (value) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(amount);
};

const normalizeMonthlySeries = (payload) =>
  MONTH_LABELS.map((_, index) => {
    if (!Array.isArray(payload)) {
      return 0;
    }

    const month = index + 1;
    const entry = payload.find((item) => Number(item?.month) === month);
    const value = Number(entry?.total_sent ?? 0);
    return Number.isFinite(value) ? value : 0;
  });

const columns = [
  {
    data: 'tanggal',
    title: 'Tanggal',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? '';
      }
      return formatDateLabel(data);
    },
  },
  { data: 'jumlah_invoice', title: 'Jumlah Invoice' },
  {
    data: 'total_koli',
    title: 'Total Koli',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? 0;
      }
      return formatDecimal(data);
    },
  },
  {
    data: 'total_berat',
    title: 'Total Berat',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? 0;
      }
      return formatDecimal(data);
    },
  },
  {
    data: 'total_volume',
    title: 'Total Volume',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? 0;
      }
      return formatDecimal(data);
    },
  },
  {
    data: 'total_pendapatan_tanpa_ppn',
    title: 'Pendapatan Non PPN',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? 0;
      }
      return formatRupiah(Number(data ?? 0));
    },
  },
  {
    data: 'total_pendapatan_dengan_ppn',
    title: 'Pendapatan Dengan PPN',
    render: (data, type) => {
      if (type !== 'display') {
        return data ?? 0;
      }
      return formatRupiah(Number(data ?? 0));
    },
  },
];

const createDefaultFilters = () => ({
  tanggal: '',
});

export default function ReportInvoice() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthlySeriesData, setMonthlySeriesData] = useState(() => MONTH_LABELS.map(() => 0));
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [errorMonthly, setErrorMonthly] = useState('');

  const endpoint = '/angkasapura/report-invoice/datatables';
  const tableRef = useRef(null);
  const hasMounted = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formFilters, setFormFilters] = useState(() => createDefaultFilters());
  const [activeFilters, setActiveFilters] = useState(() => createDefaultFilters());

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => currentYear - 5 + index),
    [currentYear]
  );

  const totalInvoicesByYear = useMemo(
    () => monthlySeriesData.reduce((accumulator, value) => accumulator + Number(value || 0), 0),
    [monthlySeriesData]
  );

  const hasMonthlyData = useMemo(
    () => monthlySeriesData.some((value) => Number(value) > 0),
    [monthlySeriesData]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchMonthlyReport = async () => {
      setIsLoadingMonthly(true);
      setErrorMonthly('');

      try {
        const response = await apiClient.get(`/angkasapura/report-invoice/monthly/${selectedYear}`);
        const normalized = normalizeMonthlySeries(response);

        if (isMounted) {
          setMonthlySeriesData(normalized);
        }
      } catch (error) {
        if (isMounted) {
          const message = error?.message || 'Gagal mengambil data grafik invoice bulanan.';
          setErrorMonthly(message);
          setMonthlySeriesData(MONTH_LABELS.map(() => 0));
          showToast({
            type: 'danger',
            message,
            title: 'Report Invoice',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingMonthly(false);
        }
      }
    };

    fetchMonthlyReport();

    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  const monthlyChartOptions = useMemo(
    () => ({
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: false,
        },
      },
      noData: {
        text: 'Belum ada data invoice untuk ditampilkan.',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          fontSize: '14px',
          color: '#6c757d',
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.6,
          opacityFrom: 0.45,
          opacityTo: 0.1,
          stops: [0, 100],
        },
      },
      xaxis: {
        type: 'category',
        categories: MONTH_LABELS,
        title: {
          text: `Periode ${selectedYear}`,
        },
      },
      yaxis: {
        title: {
          text: 'Jumlah Invoice Terkirim',
        },
        min: 0,
        forceNiceScale: true,
      },
      tooltip: {
        y: {
          formatter: (value) => `${value} invoice`,
        },
      },
    }),
    [selectedYear]
  );

  const monthlyChartSeries = useMemo(
    () => [
      {
        name: `Invoice Terkirim ${selectedYear}`,
        data: monthlySeriesData,
      },
    ],
    [monthlySeriesData, selectedYear]
  );

  const tableOptions = useMemo(
    () => ({
      order: [[0, 'desc']],
      searching: false,
      lengthChange: false,
      pageLength: 10,
      info: true,
      paging: true,
    }),
    []
  );

  const handleProcessing = useCallback((_, __, processing) => {
    const next = Boolean(processing);
    setIsProcessing((prev) => (prev === next ? prev : next));
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setActiveFilters({ ...formFilters });
  };

  const resetFilters = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

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
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">Report Invoice Harian</h5>
        <p className="text-muted mb-0">
          Data report diambil dari tabel <code>invoice_daily_counter</code>.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-start gap-3 mb-4">
            <div>
              <small className="text-muted text-uppercase fw-semibold d-block">
                Grafik Per Bulan
              </small>
              <div className="d-flex align-items-center gap-2">
                <span className="fs-6 fw-semibold text-heading">Tahun</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ms-md-auto text-end">
              <small className="text-muted text-uppercase fw-semibold d-block">Total Invoice</small>
              <span className="fs-4 fw-bold text-primary">{totalInvoicesByYear}</span>
            </div>
          </div>

          {errorMonthly ? (
            <div className="alert alert-warning mb-0" role="alert">
              {errorMonthly}
            </div>
          ) : isLoadingMonthly ? (
            <div className="py-5 text-center text-muted">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
                aria-hidden="true"
              ></div>
              <span>Mengambil data grafik invoice bulanan...</span>
            </div>
          ) : (
            <>
              <ReactApexChart
                options={monthlyChartOptions}
                series={monthlyChartSeries}
                type="area"
                height={300}
              />
              {!hasMonthlyData ? (
                <p className="text-muted text-center fst-italic mt-3 mb-0">
                  Belum ada invoice yang terkirim pada tahun ini.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={applyFilters}>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label htmlFor="filter-tanggal" className="form-label form-label-sm">
                  Filter Bulan
                </label>
                <input
                  id="filter-tanggal"
                  type="month"
                  name="tanggal"
                  className="form-control form-control-sm"
                  value={formFilters.tanggal}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary w-100" disabled={isProcessing}>
                  {isProcessing ? 'Memuat...' : 'Apply'}
                </button>
                <button
                  type="button"
                  className="btn btn-label-secondary w-100"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="card-datatable m-3">
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
