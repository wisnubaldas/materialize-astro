import GridData from '@components/GridData';
import { hubnetApi } from '@lib/api/hubnetApi';

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
  return (
    <div className="row">
      <div className="mb-2">
        <h5 className="fw-bold mb-1 text-uppercase">Data tracking</h5>
        <p className="text-muted mb-0">Menampilkan data tracking </p>
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
