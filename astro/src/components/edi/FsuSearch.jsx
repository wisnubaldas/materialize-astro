import { showToast } from '@js/utils';
import ediClient from '@lib/api/edi';
import { Fragment, useMemo, useState } from 'react';

const dataColumns = [
  { key: 'MasterAWB', label: 'Master AWB' },
  { key: 'HostAWB', label: 'Host AWB' },
  { key: 'AgenCode', label: 'Agen Code' },
  { key: 'shippername', label: 'Shipper Name' },
  { key: 'Consigneename', label: 'Consignee Name' },
];

const statusColumns = ['RCS', 'DEP', 'ARR', 'RCF', 'TFD', 'DIS', 'NFD', 'DLV', 'AWD', 'CCD'];

const PAGE_SIZE = 10;

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
};

const getRowKey = (row, index) =>
  row.noid ?? `${row.MasterAWB ?? 'mawb'}-${row.HostAWB ?? 'hawb'}-${index}`;

const normalizeMawb = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.includes('-')) return text;
  if (text.length >= 4) {
    return `${text.slice(0, 3)}-${text.slice(3)}`;
  }
  return text;
};

const normalizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatWeight = (value) => {
  const num = normalizeNumber(value);
  if (Number.isInteger(num)) return String(num);
  return String(Math.round(num * 10) / 10);
};

const formatFsuDateTime = (dateValue, timeValue) => {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    const fallbackTime = timeValue ? String(timeValue).replace(/\D/g, '').slice(0, 4) : '';
    return `${String(dateValue)}${fallbackTime ? ` ${fallbackTime}` : ''}`.trim();
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  let time = '0000';
  if (timeValue) {
    const digits = String(timeValue).replace(/\D/g, '');
    if (digits.length >= 4) {
      time = digits.slice(0, 4);
    }
  }
  return `${day}${month}${time}`;
};

const buildFsuCargoImpMessage = (row, statuses) => {
  const pieces = normalizeNumber(row?.Quantity);
  const weight = formatWeight(row?.Weight);
  const origin =
    String(row?.Origin ?? 'XXX')
      .trim()
      .toUpperCase() || 'XXX';
  const destination =
    String(row?.Destination ?? 'CGK')
      .trim()
      .toUpperCase() || 'CGK';
  const mawb = normalizeMawb(row?.MasterAWB);
  const flightDate = String(row?.DateOfFlight ?? '').trim();
  const fallbackDate = String(row?.DateEntry ?? '').trim();
  const eventTime = formatFsuDateTime(flightDate || fallbackDate, row?.TimeEntry);
  const party = String(row?.Consigneename ?? row?.shippername ?? '')
    .trim()
    .toUpperCase();

  console.log(row);
  const lines = [];
  lines.push('FSU/15');
  lines.push(`${mawb}${origin}${destination}/T${pieces}K${weight}`);
  if (Array.isArray(statuses) && statuses.length) {
    const statusLines = statuses.map(
      (status) =>
        `${status}/${eventTime}/${destination}/T${pieces}K${weight}${
          party ? `/${party}` : ''
        }`
    );
    lines.push(statusLines.join('\n\n'));
  }
  return lines.join('\n');
};

const buildFsuCargoXml = (row, status) => {
  const lines = [
    '<FSU>',
    `  <Status>${status}</Status>`,
    `  <MasterAWB>${row?.MasterAWB ?? ''}</MasterAWB>`,
    `  <HostAWB>${row?.HostAWB ?? ''}</HostAWB>`,
    `  <AgenCode>${row?.AgenCode ?? ''}</AgenCode>`,
    '</FSU>',
  ];
  return lines.join('\n');
};

export default function FsuSearch() {
  const [mawb, setMawb] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatuses, setSelectedStatuses] = useState({});

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const shouldPaginate = data.length > PAGE_SIZE;

  const pagedData = useMemo(() => data.slice(pageStart, pageEnd), [data, pageStart, pageEnd]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  const handleStatusToggle = (rowKey, status) => {
    setSelectedStatuses((prev) => {
      const rowStatuses = prev[rowKey] ?? {};
      const nextValue = !rowStatuses[status];
      const updatedRow = { ...rowStatuses, [status]: nextValue };
      const hasAny = Object.values(updatedRow).some(Boolean);
      if (!hasAny) {
        const { [rowKey]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [rowKey]: updatedRow,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = mawb.trim();
    if (!trimmed) {
      const message = 'Mohon isi Master AWB terlebih dahulu.';
      showToast({ type: 'warning', title: 'FSU', message });
      setError(message);
      setData([]);
      setHasSearched(false);
      setCurrentPage(1);
      setSelectedStatuses({});
      return;
    }

    setIsLoading(true);
    setError('');
    setData([]);
    setHasSearched(true);
    setCurrentPage(1);
    setSelectedStatuses({});

    try {
      const result = await ediClient.getImportMasterwaybill(encodeURIComponent(trimmed));
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      const message = err?.message ?? 'Gagal mengambil data host AWB.';
      showToast({ type: 'danger', title: 'FSU', message });
      setError(message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">FSU Import</h5>
        <p className="text-muted mb-0">Cari data host AWB import berdasarkan Master AWB.</p>
      </div>
      <div className="col-md-12 col-xl-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masukkan Master AWB"
                  value={mawb}
                  onChange={(event) => setMawb(event.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Mencari...
                    </span>
                  ) : (
                    'Cari'
                  )}
                </button>
              </div>
            </form>

            {isLoading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted">
                <div
                  className="spinner-border text-primary mb-2"
                  role="status"
                  aria-hidden="true"
                ></div>
                <span>Mengambil data host AWB...</span>
              </div>
            ) : error ? (
              <div className="alert alert-warning mb-0" role="alert">
                {error}
              </div>
            ) : data.length ? (
              <>
                <div className="table-responsive">
                  <table className="table table-sm table-striped align-middle">
                    <thead>
                      <tr>
                        {dataColumns.map((column) => (
                          <th key={column.key} className="text-nowrap">
                            {column.label}
                          </th>
                        ))}
                        {statusColumns.map((status) => (
                          <th key={status} className="text-nowrap text-center">
                            {status}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.map((row, index) => {
                        const rowIndex = pageStart + index;
                        const rowKey = getRowKey(row, rowIndex);
                        const selected = selectedStatuses[rowKey] ?? {};
                        const activeStatuses = statusColumns.filter((status) => selected[status]);
                        const hasDetails = activeStatuses.length > 0;
                        const safeRowKey = String(rowKey).replace(/[^a-zA-Z0-9_-]/g, '');
                        const impTabId = `fsu-imp-${safeRowKey}`;
                        const xmlTabId = `fsu-xml-${safeRowKey}`;
                        const cargoImpText = buildFsuCargoImpMessage(row, activeStatuses);
                        const cargoXmlText = activeStatuses
                          .map((status) => buildFsuCargoXml(row, status))
                          .join('\n\n');

                        return (
                          <Fragment key={rowKey}>
                            <tr>
                              {dataColumns.map((column) => (
                                <td key={column.key} className="text-nowrap">
                                  {formatCellValue(row[column.key])}
                                </td>
                              ))}
                              {statusColumns.map((status) => (
                                <td key={status} className="text-center">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name={`${rowKey}-${status}`}
                                    checked={Boolean(selectedStatuses[rowKey]?.[status])}
                                    onChange={() => handleStatusToggle(rowKey, status)}
                                    aria-label={`${status} ${row.HostAWB ?? row.MasterAWB ?? rowIndex}`}
                                  />
                                </td>
                              ))}
                            </tr>
                            {hasDetails ? (
                              <tr>
                                <td colSpan={dataColumns.length + statusColumns.length}>
                                  <div className="nav-align-top">
                                    <ul className="nav nav-tabs" role="tablist">
                                      <li className="nav-item">
                                        <button
                                          type="button"
                                          className="nav-link active"
                                          role="tab"
                                          data-bs-toggle="tab"
                                          data-bs-target={`#${impTabId}`}
                                          aria-controls={impTabId}
                                          aria-selected="true"
                                        >
                                          Cargo-IMP
                                        </button>
                                      </li>
                                      <li className="nav-item">
                                        <button
                                          type="button"
                                          className="nav-link"
                                          role="tab"
                                          data-bs-toggle="tab"
                                          data-bs-target={`#${xmlTabId}`}
                                          aria-controls={xmlTabId}
                                          aria-selected="false"
                                        >
                                          Cargo-XML
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="tab-content border border-top-0 rounded-bottom p-3">
                                    <div
                                      className="tab-pane fade show active"
                                      id={impTabId}
                                      role="tabpanel"
                                    >
                                      <textarea
                                        className="form-control"
                                        rows={6}
                                        value={cargoImpText}
                                        readOnly
                                      />
                                    </div>
                                    <div className="tab-pane fade" id={xmlTabId} role="tabpanel">
                                      <textarea
                                        className="form-control"
                                        rows={6}
                                        value={cargoXmlText}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {shouldPaginate ? (
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mt-3">
                    <div className="text-muted small">
                      Menampilkan {pageStart + 1}-{Math.min(pageEnd, data.length)} dari{' '}
                      {data.length} data
                    </div>
                    <nav aria-label="Pagination FSU">
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                          >
                            Prev
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, idx) => {
                          const page = idx + 1;
                          return (
                            <li
                              key={page}
                              className={`page-item ${page === currentPage ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                type="button"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          );
                        })}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                ) : null}
              </>
            ) : hasSearched ? (
              <div className="text-center py-4 text-muted">Data host AWB tidak ditemukan.</div>
            ) : (
              <div className="text-center py-4 text-muted">
                Masukkan Master AWB lalu tekan tombol cari untuk melihat data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
