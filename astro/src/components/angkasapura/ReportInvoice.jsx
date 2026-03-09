import { useEffect, useMemo, useState, useRef } from 'react';
import { apiClient } from '@lib/api/client';
import ReactApexChart from 'react-apexcharts';
import flatpickr from 'flatpickr';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import '@libs/flatpickr/flatpickr.scss';
import '@libs/flatpickr/flatpickr-month.css';
import { showToast } from '@js/utils';

/**
 * @typedef {Object} ReportInvoiceEntry
 * @property {number} [month]
 * @property {number} [day]
 * @property {number} [total_sent]
 */

/**
 * @typedef {Object} ReportInvoiceInitialData
 * @property {number} year
 * @property {number} month
 * @property {Array<number | ReportInvoiceEntry>} monthly
 * @property {Array<number | ReportInvoiceEntry>} daily
 */

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

const normalizeMonthlySeries = (payload) =>
  MONTH_LABELS.map((_, index) => {
    if (!Array.isArray(payload)) {
      return 0;
    }

    const entry =
      payload.find((item) =>
        typeof item === 'number'
          ? false
          : Number(item?.month) === index + 1
      ) ?? payload[index];
    const rawValue = typeof entry === 'number' ? entry : entry?.total_sent;
    const value = Number(rawValue ?? 0);
    return Number.isFinite(value) ? value : 0;
  });

const normalizeDailySeries = (payload, dayLabels) =>
  dayLabels.map((day, index) => {
    if (!Array.isArray(payload)) {
      return 0;
    }

    const entry =
      payload.find((item) =>
        typeof item === 'number'
          ? false
          : Number(item?.day) === day
      ) ?? payload[index];
    const rawValue = typeof entry === 'number' ? entry : entry?.total_sent;
    const value = Number(rawValue ?? 0);
    return Number.isFinite(value) ? value : 0;
  });

/**
 * @param {{ initialData?: ReportInvoiceInitialData | null }} props
 */
export default function ReportInvoice({ initialData = null }) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const initialMonth = useMemo(() => {
    const fallback = new Date().getMonth() + 1;
    const month = Number(initialData?.month);
    return Number.isFinite(month) && month >= 1 && month <= 12 ? month : fallback;
  }, [initialData]);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const hasInitialMonthlyData = useMemo(
    () => Number(initialData?.year) === currentYear && Array.isArray(initialData?.monthly),
    [currentYear, initialData]
  );
  const daysInSelectedMonth = useMemo(
    () => new Date(currentYear, selectedMonth, 0).getDate(),
    [currentYear, selectedMonth]
  );
  const dayLabels = useMemo(
    () => Array.from({ length: daysInSelectedMonth }, (_, index) => index + 1),
    [daysInSelectedMonth]
  );
  const hasInitialDailyData = useMemo(
    () =>
      Number(initialData?.year) === currentYear &&
      Number(initialData?.month) === selectedMonth &&
      Array.isArray(initialData?.daily),
    [currentYear, initialData, selectedMonth]
  );
  const [seriesData, setSeriesData] = useState(() =>
    hasInitialMonthlyData ? normalizeMonthlySeries(initialData?.monthly) : MONTH_LABELS.map(() => 0)
  );
  const [isLoadingData, setIsLoadingData] = useState(() => !hasInitialMonthlyData);
  const [error, setError] = useState('');
  const [dailySeriesData, setDailySeriesData] = useState(() =>
    hasInitialDailyData ? normalizeDailySeries(initialData?.daily, dayLabels) : dayLabels.map(() => 0)
  );
  const [isLoadingDaily, setIsLoadingDaily] = useState(() => !hasInitialDailyData);
  const [errorDaily, setErrorDaily] = useState('');
  const totalInvoices = useMemo(
    () => seriesData.reduce((accumulator, value) => accumulator + Number(value || 0), 0),
    [seriesData]
  );
  const hasData = useMemo(() => seriesData.some((value) => Number(value) > 0), [seriesData]);
  const totalInvoicesSelectedMonth = useMemo(
    () => dailySeriesData.reduce((accumulator, value) => accumulator + Number(value || 0), 0),
    [dailySeriesData]
  );
  const hasDailyData = useMemo(
    () => dailySeriesData.some((value) => Number(value) > 0),
    [dailySeriesData]
  );

  useEffect(() => {
    let isMounted = true;

    if (hasInitialMonthlyData) {
      setSeriesData(normalizeMonthlySeries(initialData?.monthly));
      setIsLoadingData(false);
      setError('');
      return () => {
        isMounted = false;
      };
    }

    const fetchMonthlyReport = async () => {
      setIsLoadingData(true);
      setError('');

      try {
        const response = await apiClient.get(`/angkasapura/invoice-perbulan/${currentYear}`);
        const normalized = normalizeMonthlySeries(response);

        if (isMounted) {
          setSeriesData(normalized);
        }
      } catch (err) {
        if (isMounted) {
          const message = err?.message || 'Gagal mengambil data laporan invoice.';
          showToast({
            type: 'danger',
            message,
            title: 'Search Invoice',
          });
          setError(message);
          setSeriesData(MONTH_LABELS.map(() => 0));
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    fetchMonthlyReport();

    return () => {
      isMounted = false;
    };
  }, [currentYear, hasInitialMonthlyData, initialData]);

  useEffect(() => {
    let isMounted = true;

    if (hasInitialDailyData) {
      setDailySeriesData(normalizeDailySeries(initialData?.daily, dayLabels));
      setIsLoadingDaily(false);
      setErrorDaily('');
      return () => {
        isMounted = false;
      };
    }

    const fetchDailyReport = async () => {
      if (!dayLabels.length) {
        if (isMounted) {
          setDailySeriesData([]);
          setIsLoadingDaily(false);
        }
        return;
      }

      setIsLoadingDaily(true);
      setErrorDaily('');

      try {
        const response = await apiClient.get(
          `/angkasapura/invoice-perbulan/${currentYear}/${selectedMonth}`
        );
        const normalized = normalizeDailySeries(response, dayLabels);

        if (isMounted) {
          setDailySeriesData(normalized);
        }
      } catch (err) {
        if (isMounted) {
          const message = err?.message || 'Gagal mengambil data laporan invoice harian.';
          setErrorDaily(message);
          showToast({
            type: 'danger',
            message,
            title: 'Search Invoice',
          });
          setDailySeriesData(dayLabels.map(() => 0));
        }
      } finally {
        if (isMounted) {
          setIsLoadingDaily(false);
        }
      }
    };

    fetchDailyReport();

    return () => {
      isMounted = false;
    };
  }, [currentYear, selectedMonth, dayLabels, hasInitialDailyData, initialData]);

  const chartOptions = useMemo(
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
          text: `Periode ${currentYear}`,
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
    [currentYear]
  );

  const chartSeries = useMemo(
    () => [
      {
        name: `Invoice Terkirim ${currentYear}`,
        data: seriesData,
      },
    ],
    [seriesData, currentYear]
  );

  const dailyChartOptions = useMemo(
    () => ({
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: false,
        },
      },
      noData: {
        text: 'Belum ada data invoice untuk periode ini.',
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
        categories: dayLabels.map((day) => String(day)),
        title: {
          text: `Bulan ${MONTH_LABELS[selectedMonth - 1]} ${currentYear}`,
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
    [dayLabels, currentYear, selectedMonth]
  );

  const dailyChartSeries = useMemo(
    () => [
      {
        name: `Invoice Terkirim ${MONTH_LABELS[selectedMonth - 1]} ${currentYear}`,
        data: dailySeriesData,
      },
    ],
    [dailySeriesData, selectedMonth, currentYear]
  );

  // flatficker bisa dipakai di sini buat report export
  const inputRef = useRef(null);
  const inputRefPdf = useRef(null);
  useEffect(() => {
    if (!inputRef.current || !inputRefPdf.current) {
      return undefined;
    }

    const instance = flatpickr(inputRef.current, {
      dateFormat: 'Y-m',
      defaultDate: new Date(),
      allowInput: true,
      plugins: [
        new monthSelectPlugin({
          shorthand: true, //defaults to false
          dateFormat: 'Y-m', //defaults to "F Y"
          altFormat: 'F Y', //defaults to "F Y"
          theme: 'light', // defaults to "light"
        }),
      ],
      // enableTime: true,
      onChange: async (_selectedDates, dateStr, fp) => {
        try {
          const response = await apiClient.get(`/angkasapura/invoice-perbulan/pdf/${dateStr}`, {
            headers: {
              Accept: 'application/pdf',
            },
            raw: true,
          });
          const pdfBlob = await response.blob();
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
          // (opsional) hapus blob dari memori setelah beberapa waktu
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
        } catch (error) {
          if (error?.status === 404) {
            showToast({
              type: 'danger',
              message: 'Data invoice tidak ditemukan untuk bulan tersebut.',
              title: 'Search Invoice',
            });
            console.error(error);
          }
        } finally {
          fp.close();
        }
      },
    });
    const instancePdf = flatpickr(inputRefPdf.current, {
      dateFormat: 'Y-m',
      defaultDate: new Date(),
      plugins: [
        new monthSelectPlugin({
          shorthand: true, //defaults to false
          dateFormat: 'Y-m', //defaults to "F Y"
          altFormat: 'F Y', //defaults to "F Y"
          theme: 'light', // defaults to "light"
        }),
      ],
      onChange: async (_selectedDates, dateStr, fp) => {
        try {
          const response = await apiClient.get(`/angkasapura/invoice-perbulan/excel/${dateStr}`, {
            headers: {
              Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            raw: true,
          });
          const excelBlob = await response.blob();
          const excelUrl = URL.createObjectURL(excelBlob);
          window.open(excelUrl, '_blank');
          // (opsional) hapus blob dari memori setelah beberapa waktu
          setTimeout(() => URL.revokeObjectURL(excelUrl), 10000);
        } catch (error) {
          console.error(error);
          showToast({
            type: 'danger',
            message: 'Data invoice tidak ditemukan untuk bulan tersebut.',
            title: 'Search Invoice',
          });
        } finally {
          fp.close();
        }
      },
    });
    return () => {
      instance.destroy();
      instancePdf.destroy();
    };
  }, []);

  return (
    <div className="container-fluid px-0">
      <div className="row">
        <div className="col-6">
          <h5 className="fw-bold mb-1 text-uppercase">Laporan Invoice Terkirim</h5>
          <p className="text-muted mb-0">Pantau performa pengiriman invoice per bulan.</p>
        </div>
        <div className="col-6 row">
          <div className="form-floating form-floating-outline col-6">
            <input id="floatingInput" ref={inputRef} type="text" className="form-control" />
            <label htmlFor="floatingInput" className="text-primary fw-bold ">
              Export PDF Report
            </label>
          </div>
          <div className="form-floating form-floating-outline col-6">
            <input id="pdf" ref={inputRefPdf} type="text" className="form-control" />
            <label htmlFor="pdf" className="text-primary fw-bold ">
              Export Excel Report
            </label>
          </div>
        </div>
      </div>
      <div className="row g-2 mt-4">
        <div className="col-sm-12 col-md-6 col-lg-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                  <small className="text-muted text-uppercase fw-semibold d-block">Periode</small>
                  <span className="fs-5 fw-semibold text-heading">Tahun {currentYear}</span>
                </div>
                <div className="text-end">
                  <small className="text-muted text-uppercase fw-semibold d-block">
                    Total Invoice
                  </small>
                  <span className="fs-4 fw-bold text-primary">{totalInvoices}</span>
                </div>
              </div>
              {error ? (
                <div className="alert alert-warning mb-0" role="alert">
                  {error}
                </div>
              ) : isLoadingData ? (
                <div className="py-5 text-center text-muted">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                    aria-hidden="true"
                  ></div>
                  <span>Mengambil data laporan invoice...</span>
                </div>
              ) : (
                <>
                  <ReactApexChart
                    options={chartOptions}
                    series={chartSeries}
                    type="area"
                    height={300}
                  />
                  {!hasData ? (
                    <p className="text-muted text-center fst-italic mt-3 mb-0">
                      Belum ada invoice yang terkirim pada tahun ini.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="col-sm-12 col-md-6 col-lg-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-start gap-3 mb-4">
                <div>
                  <small className="text-muted text-uppercase fw-semibold d-block">
                    Pilih Bulan
                  </small>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-6 fw-semibold text-heading">Tahun {currentYear}</span>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(Number(event.target.value))}
                    >
                      {MONTH_LABELS.map((label, index) => (
                        <option key={label} value={index + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ms-md-auto text-end">
                  <small className="text-muted text-uppercase fw-semibold d-block">
                    Total Invoice Bulan Ini
                  </small>
                  <span className="fs-4 fw-bold text-primary">{totalInvoicesSelectedMonth}</span>
                </div>
              </div>
              {errorDaily ? (
                <div className="alert alert-warning mb-0" role="alert">
                  {errorDaily}
                </div>
              ) : isLoadingDaily ? (
                <div className="py-5 text-center text-muted">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                    aria-hidden="true"
                  ></div>
                  <span>Mengambil data invoice harian...</span>
                </div>
              ) : (
                <>
                  <ReactApexChart
                    options={dailyChartOptions}
                    series={dailyChartSeries}
                    type="area"
                    height={300}
                  />
                  {!hasDailyData ? (
                    <p className="text-muted text-center fst-italic mt-3 mb-0">
                      Belum ada invoice yang terkirim pada bulan ini.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
