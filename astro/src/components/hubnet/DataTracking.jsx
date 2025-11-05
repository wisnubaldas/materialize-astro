import GridData from '@components/GridData';
import SelectMonth from '@components/parsial/SelectMonth';
import { hubnetApi } from '@lib/api/hubnetApi';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
export default function DataTracking() {
  const columns = [
    { data: 'AWB_NO', title: 'awb' },
    {
      data: 'FLT_NUMBER',
      title: 'Flight Number',
    },
    {
      data: 'FLT_DATE',
      title: 'Flight Date',
    },
    {
      data: 'ORI',
      title: 'Origin',
    },
    {
      data: 'DEST',
      title: 'Destination',
    },
    {
      data: 'IS_INTERNATIONAL',
      title: '#',
      render: (data, type, row) => {
        const fe = row.IS_EKSPOR;
        const fi = row.IS_INTERNATIONAL;
        if (fe === '1' && fi === '1') {
          return `<span class="badge bg-label-primary">EKSPORT</span>`;
        }
        if (fe === '0' && fi === '1') {
          return `<span class="badge bg-label-secondary">IMPORT</span>`;
        }
        if (fe === '1' && fi === '0') {
          return `<span class="badge bg-label-warning">OUTGOING</span>`;
        }
        if (fe === '0' && fi === '0') {
          return `<span class="badge bg-label-info">INCOMING</span>`;
        }
      },
    },
  ];
  const [trackingData, setTrackingData] = useState(null);
  const handleDataMonth = (data) => {
    setTrackingData(data);
  };
  useEffect(() => {
    if (!trackingData) {
      return;
    }

    let timeoutId;
    let isCancelled = false;

    const openPdf = async () => {
      try {
        const pdfBlob = await trackingData.blob();
        if (isCancelled) {
          return;
        }

        const pdfUrl = URL.createObjectURL(pdfBlob);
        // window.open(pdfUrl, '_blank');
        const now = dayjs();
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = now.format('DDMMYYYYhmmss');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        timeoutId = window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
      } catch (error) {
        console.error('Failed to open tracking data PDF:', error);
      }
    };

    openPdf();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [trackingData]);
  return (
    <div className="row">
      <div className="mb-2">
        <h5 className="fw-bold mb-1 text-uppercase">Data tracking</h5>
        <p className="text-muted mb-0">Menampilkan data tracking </p>
        <div className="col-5 mb-3">
          <SelectMonth
            title="Pilih data tracking berdasarkan Bulan"
            data={hubnetApi.exportExcel}
            callback={handleDataMonth}
          />
        </div>
        <GridData
          //   ref={hubnetApi.postDataTable}
          columns={columns}
          ajaxEndpoint={hubnetApi.postDataTable()}
          //   filters={activeFilters}
          //   options={tableOptions}
          //   onProcessing={handleProcessing}
        />
      </div>
    </div>
  );
}
