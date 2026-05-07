import GridData from '@components/GridData';
import SelectMonth from '@components/parsial/SelectMonth';
import { Icon } from '@iconify-icon/react';
import { hubnetApi } from '@lib/api/hubnetApi';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { resolveErrorMessage } from './shared';
export default function DataTracking() {
  const getSendingStatus = (value) => {
    const normalizedValue = String(value ?? '').trim();

    if (normalizedValue === '1') {
      return {
        label: 'Terkirim',
        className: 'bg-label-success',
        sortValue: 1,
      };
    }

    if (normalizedValue === '0') {
      return {
        label: 'Gagal',
        className: 'bg-label-danger',
        sortValue: 0,
      };
    }

    return {
      label: '-',
      className: 'bg-label-dark',
      sortValue: -1,
    };
  };

  const tableOptions = {
    order: [[2, 'desc']],
  };
  const columns = [
    { data: 'AWB_NO', title: 'awb' },
    {
      data: 'FLT_NUMBER',
      title: 'Flight Number',
    },
    {
      data: 'FLT_DATE',
      title: 'Flight Date',
      render: (data, type, row) => {
        return dayjs(data).format('DD-MM-YYYY HH:mm');
      },
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
      data: 'KATEGORI_CARGO',
      title: 'Kategori',
      render: {
        display: (data) => {
          const kategori = String(data ?? '').toUpperCase();
          if (kategori === 'EKSPORT')
            return `<span class="badge bg-label-primary">EKSPORT</span>`;
          if (kategori === 'IMPORT')
            return `<span class="badge bg-label-secondary">IMPORT</span>`;
          if (kategori === 'OUTGOING')
            return `<span class="badge bg-label-warning">OUTGOING</span>`;
          if (kategori === 'INCOMING') return `<span class="badge bg-label-info">INCOMING</span>`;
          return `<span class="badge bg-label-dark">${kategori || '-'}</span>`;
        },
        filter: (data) => {
          return String(data ?? '').toUpperCase();
        },
      },
    },
    {
      data: 'IS_SEND',
      title: 'Status Sending',
      render: {
        display: (data) => {
          const status = getSendingStatus(data);
          return `<span class="badge ${status.className}">${status.label}</span>`;
        },
        filter: (data) => {
          return getSendingStatus(data).label.toUpperCase();
        },
        sort: (data) => {
          return getSendingStatus(data).sortValue;
        },
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
        console.error('Failed to open tracking data PDF:', resolveErrorMessage(error, 'Unknown error'));
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
        <div className="col-12 mb-3 card shadow-none bg-label-primary">
          <div className="d-flex align-items-end row">
            <div className="col-md-6 order-2 order-md-1">
              <div className="card-body">
                <h4 className="card-title mb-4">
                  Export Data <Icon icon="vscode-icons:file-type-excel2" width="64" height="64" />
                </h4>
                <SelectMonth
                  title="Pilih data tracking berdasarkan Bulan"
                  data={hubnetApi.exportExcel}
                  callback={handleDataMonth}
                />
              </div>
            </div>
            <div className="col-md-6 text-center text-md-end order-1 order-md-2">
              <div className="card-body pb-0 px-0 pt-2">
                <img
                  src="/assets/img/illustrations/illustration-john-light.png"
                  height="186"
                  className="scaleX-n1-rtl"
                  alt="View Profile"
                  data-app-light-img="illustrations/illustration-john-light.png"
                  data-app-dark-img="illustrations/illustration-john-dark.png"
                  style={{ visibility: 'visible' }}
                />
              </div>
            </div>
          </div>
        </div>
        <GridData
          //   ref={hubnetApi.postDataTable}
          columns={columns}
          ajaxEndpoint={hubnetApi.postDataTable()}
          //   filters={activeFilters}
          options={tableOptions}
          //   onProcessing={handleProcessing}
        />
      </div>
    </div>
  );
}
