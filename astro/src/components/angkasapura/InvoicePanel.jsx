import { useEffect, useMemo, useState } from 'react';
import { BlockUI } from 'ns-react-block-ui';
import ReportInvoice from './ReportInvoice.jsx';
import SearchInvoice from './SearchInvoice.jsx';
import DataInvoice from './DataInvoice.jsx';
import BlockingComponent from '../BlockingComponent.jsx';
export default function InvoicePanel() {
  const [view, setView] = useState('data-inv'); // default tampilan pertama
  const [blocking, setBlocking] = useState(false);

  const loader = useMemo(() => <BlockingComponent message="Angkasapura Invoice data" />, []);

  useEffect(() => {
    if (!blocking || typeof window === 'undefined') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setBlocking(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [view, blocking]);

  const handleChangeView = (nextView) => {
    if (nextView === view) {
      return;
    }
    setBlocking(true);
    setView(nextView);
  };

  return (
    <>
      <div className="col-auto">
        <div className="mt-4">
          <div className="btn-group mb-4" role="group" aria-label="Invoice menu">
            <button
              className={`btn btn-label-primary waves-effect ${
                view === 'data-inv' ? 'active' : ''
              }`}
              onClick={() => handleChangeView('data-inv')}
            >
              <span className="menu-icon icon-base ri ri-file-add-line"></span>
              Grid Data Invoice
            </button>

            <button
              className={`btn btn-label-primary waves-effect ${view === 'search' ? 'active' : ''}`}
              onClick={() => handleChangeView('search')}
            >
              <span className="menu-icon icon-base ri ri-file-search-line"></span>
              Search Invoice
            </button>

            <button
              className={`btn btn-label-primary waves-effect ${view === 'report' ? 'active' : ''}`}
              onClick={() => handleChangeView('report')}
            >
              <span className="menu-icon icon-base ri ri-file-close-line"></span>
              Report Invoice
            </button>
          </div>
        </div>
      </div>
      <BlockUI
        blocking={blocking}
        loader={loader}
        overlayStyle={{ backgroundColor: '#051226', opacity: 0.35 }}
        cursor="wait"
        className="h-100 w-100 d-block"
      >
        {/* Komponen tampil tergantung state */}
        {view === 'data-inv' && <DataInvoice />}
        {view === 'report' && <ReportInvoice client:only />}
        {view === 'search' && <SearchInvoice />}
      </BlockUI>
    </>
  );
}
