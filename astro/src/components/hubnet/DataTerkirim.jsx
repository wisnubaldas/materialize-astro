import BackdropLoader from '@components/BackdropLoader';
import { Icon } from '@iconify-icon/react';
import { hubnetApi } from '@lib/api/hubnetApi';
import { flatpickr } from '@libs/flatpickr/flatpickr';
import '@libs/flatpickr/flatpickr.scss';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
export default function DataTerkirim() {
  const now = dayjs().format('DD-MM-YYYY');
  const [dataTable, setDataTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // ini ngeset buat variable yg berubah2 di dom
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(now); // default
  const inputRef = useRef(null);
  const PER_PAGE = 10;

  useEffect(() => {
    if (inputRef.current) {
      flatpickr(inputRef.current, {
        dateFormat: 'd-m-Y',
        defaultDate: selectedDate,
        onChange: (selectedDates, dateStr, instance) => {
          //   console.log('Selected Dates:', selectedDates);
          //   console.log('Formatted Date String:', dateStr);
          setSelectedDate(dateStr);
          setCurrentPage(1);
          // You can perform other actions here, e.g., update another input field
          // document.getElementById("anotherInput").value = dateStr;
        },
      });
    }
  });
  useEffect(() => {
    let cancelled = false;

    const fetchDataTerkirim = async () => {
      setIsLoading(true);
      try {
        const response = await hubnetApi.getDataTerkirim({
          flt_date: selectedDate,
          page: currentPage,
          per_page: PER_PAGE,
        });
        if (!cancelled) {
          setDataTable(response);
          //   console.log(response);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'Gagal memuat data dashboard.';
          setErrorMessage(message);
          console.error('Gagal memuat data dashboard Hubnet:', error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchDataTerkirim();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, currentPage]);

  const pagination = dataTable?.pagination;
  const totalPages = pagination?.last_page ?? 1;

  const handleChangePage = (page) => {
    if (!pagination) return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    if (!pagination) return null;
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    return pages.map((page) => (
      <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
        <button
          type="button"
          className="page-link waves-effect"
          onClick={() => handleChangePage(page)}
        >
          {page}
        </button>
      </li>
    ));
  };

  return (
    <div className="raw">
      <div className="col-12 col-lg-12 mb-3 card shadow-none bg-label-info">
        <div className="d-flex align-items-end row">
          <div className="col-md-6 order-2 order-md-1">
            <div className="card-body">
              <h4 className="card-title mb-4">
                Menampilkan data terkirim dari HUBNET{' '}
                <Icon icon="streamline-ultimate-color:shipment-tracking" width="48" height="48" />
              </h4>
              <label htmlFor="searc-by-date">Pilih Tanggal</label>
              <input
                ref={inputRef}
                id="searc-by-date"
                type="text"
                className="form-control form-control-sm col-12 bg-lighter"
                placeholder="lihat data per tanggal"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div className="col-md-6 text-center text-md-end order-1 order-md-2">
            <div className="card-body pb-0 px-0 pt-2">
              <img
                src="https://static.vecteezy.com/system/resources/previews/024/658/935/non_2x/3d-male-character-holding-and-presenting-to-a-laptop-with-empty-screen-free-png.png"
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

      <div className="col-md-12 col-lg-12">
        <BackdropLoader active={isLoading} message="Loading data dari HUBNET......" />
        {!isLoading && !errorMessage && dataTable?.pagination?.total === 0 ? (
          <div className="alert alert-primary alert-dismissible m-5" role="alert">
            <span className="alert-icon rounded">
              <Icon
                icon="line-md:alert-twotone-loop"
                width="24"
                height="24"
                className="icon-base icon-md"
              />
            </span>
            <h5>Tidak ada data di tanggal berikut: {selectedDate}</h5>
          </div>
        ) : (
          <div>
            {dataTable ? (
              <div className="card shadow-none rounded-0 m-2">
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>AWB_NO</th>
                          <th>FLT_NUMBER</th>
                          <th>FLT_DATE</th>
                          <th>ORI</th>
                          <th>DEST</th>
                          <th>T</th>
                          <th>K</th>
                          <th>CH_WEIGHT</th>
                          <th>REF ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataTable?.data?.map((item, index) => (
                          <tr key={item.AWB_NO ?? index}>
                            <td>{item.AWB_NO}</td>
                            <td>{item.FLT_NUMBER}</td>
                            <td>{item.FLT_DATE}</td>
                            <td>{item.ORI}</td>
                            <td>{item.DEST}</td>
                            <td>{item.T}</td>
                            <td>{item.K}</td>
                            <td>{item.CH_WEIGHT}</td>
                            <td>{item.ref_id ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="m-3">
                    <nav aria-label="Page navigation">
                      <ul className="pagination pagination-sm">
                        <li className={`page-item prev ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link waves-effect"
                            onClick={() => handleChangePage(1)}
                            disabled={currentPage === 1}
                          >
                            <i className="icon-base ri ri-skip-back-mini-line icon-20px"></i>
                          </button>
                        </li>
                        <li className={`page-item prev ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link waves-effect"
                            onClick={() => handleChangePage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="icon-base ri ri-arrow-left-s-line icon-20px"></i>
                          </button>
                        </li>
                        {renderPageNumbers()}
                        <li
                          className={`page-item next ${
                            currentPage === totalPages ? 'disabled' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link waves-effect"
                            onClick={() => handleChangePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <i className="icon-base ri ri-arrow-right-s-line icon-20px"></i>
                          </button>
                        </li>
                        <li
                          className={`page-item next ${
                            currentPage === totalPages ? 'disabled' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link waves-effect"
                            onClick={() => handleChangePage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            <i className="icon-base ri ri-skip-forward-mini-line icon-20px"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        )}
      </div>
    </div>
  );
}
