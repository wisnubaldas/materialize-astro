import { hubnetApi } from '@lib/api/hubnetApi';
import { flatpickr } from '@libs/flatpickr/flatpickr';
import '@libs/flatpickr/flatpickr-month.css';
import '@libs/flatpickr/flatpickr.scss';
import dayjs from 'dayjs';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import { useEffect, useRef, useState } from 'react';

const STATUS_CONFIG = [
  {
    key: 'ekspor',
    label: 'Ekspor',
    borderColor: 'rgba(79, 70, 229, 0.9)',
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
  },
  {
    key: 'import',
    label: 'Import',
    borderColor: 'rgba(239, 68, 68, 0.9)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  {
    key: 'outgoing',
    label: 'Outgoing',
    borderColor: 'rgba(16, 185, 129, 0.9)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    key: 'incoming',
    label: 'Incoming',
    borderColor: 'rgba(251, 191, 36, 0.9)',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
];

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildChartData = (rows = []) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const labels = safeRows.map((row) =>
    dayjs(row.tanggal ?? row.date ?? '').isValid()
      ? dayjs(row.tanggal ?? row.date).format('DD MMM')
      : row.tanggal ?? '-'
  );

  const datasets = STATUS_CONFIG.map((status) => ({
    label: status.label,
    data: safeRows.map((row) => numberOrZero(row[status.key])),
    borderColor: status.borderColor,
    backgroundColor: status.backgroundColor,
    fill: 'origin',
    tension: 0.35,
    borderWidth: 2,
    pointRadius: 3,
  }));

  return { labels, datasets };
};

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Status Pengiriman HUBNET per Hari',
    },
  },
  elements: {
    line: {
      borderWidth: 2,
    },
    point: {
      hoverRadius: 5,
    },
  },
  scales: {
    x: {
      ticks: { color: '#475467' },
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 5 },
    },
  },
};

export default function ChartDataTerkirim() {
  const [LineComponent, setLineComponent] = useState(null);
  const [chartError, setChartError] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [chartData, setChartData] = useState(buildChartData());
  const [isLoadingData, setIsLoadingData] = useState(false);

  const monthInputRef = useRef(null);
  const pickerInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadChart() {
      try {
        const [{ Line }, chartJs] = await Promise.all([
          import('react-chartjs-2'),
          import('chart.js'),
        ]);

        chartJs.Chart.register(
          chartJs.CategoryScale,
          chartJs.LinearScale,
          chartJs.PointElement,
          chartJs.LineElement,
          chartJs.Filler,
          chartJs.Title,
          chartJs.Tooltip,
          chartJs.Legend
        );

        if (isMounted) {
          setLineComponent(() => Line);
        }
      } catch (err) {
        if (isMounted) {
          setChartError(err instanceof Error ? err.message : 'Gagal memuat chart');
        }
      }
    }

    loadChart();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!flatpickr || !monthInputRef.current) {
      return undefined;
    }

    const instance = flatpickr(monthInputRef.current, {
      dateFormat: 'Y-m',
      altInput: true,
      altFormat: 'F Y',
      defaultDate: `${selectedMonth}-01`,
      allowInput: false,
      plugins: [
        new monthSelectPlugin({
          shorthand: true,
          dateFormat: 'Y-m',
          altFormat: 'F Y',
          theme: 'light',
        }),
      ],
      onChange: (_, dateStr) => {
        if (dateStr) {
          setSelectedMonth(dateStr);
        }
      },
    });

    pickerInstanceRef.current = instance;

    return () => {
      instance.destroy();
      pickerInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (pickerInstanceRef.current && selectedMonth) {
      pickerInstanceRef.current.setDate(`${selectedMonth}-01`, false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    let isCurrent = true;

    async function fetchChartData() {
      setIsLoadingData(true);
      setDataError(null);
      try {
        const response = await hubnetApi.sendingPerbulan(selectedMonth);
        const payload = Array.isArray(response) ? response : response?.data ?? [];

        if (!isCurrent) return;

        setChartData(buildChartData(payload));
        if (!payload.length) {
          setDataError('Belum ada data terkirim untuk bulan ini.');
        }
      } catch (err) {
        if (!isCurrent) return;
        const message = err instanceof Error ? err.message : 'Gagal memuat data pengiriman';
        setDataError(message);
        setChartData(buildChartData());
      } finally {
        if (isCurrent) {
          setIsLoadingData(false);
        }
      }
    }

    fetchChartData();

    return () => {
      isCurrent = false;
    };
  }, [selectedMonth]);

  if (chartError) {
    return <div className="text-danger">Gagal memuat chart: {chartError}</div>;
  }

  if (!LineComponent) {
    return <div>Memuat chart...</div>;
  }

  return (
    <div className="row">
      <div className="col-12 p-3">
        <div className="card shadow-none border rounded-3">
          <div className="card-header d-flex flex-column flex-md-row align-items-md-center">
            <div>
              <h5 className="mb-1">Data Pengiriman HUBNET</h5>
              <p className="mb-0 text-muted">
                Periode {dayjs(`${selectedMonth}-01`).format('MMMM YYYY')}
              </p>
            </div>
            <div className="ms-md-auto mt-3 mt-md-0" style={{ minWidth: '220px' }}>
              <label className="form-label text-muted mb-1">Pilih Bulan</label>
              <input
                ref={monthInputRef}
                type="text"
                className="form-control form-control-sm bg-white"
                placeholder="Pilih bulan"
                readOnly
              />
            </div>
          </div>
          <div className="card-body" style={{ minHeight: '360px' }}>
            {isLoadingData && <p className="text-muted small mb-2">Mengambil data pengiriman...</p>}
            {dataError && !isLoadingData && (
              <div className="alert alert-warning py-2 px-3">{dataError}</div>
            )}
            <div style={{ height: '320px' }}>
              <LineComponent options={options} data={chartData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
