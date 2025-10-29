import { useMemo, useState } from 'react';
import '@vendor/css/pages/page-faq.css';
import { menuData } from '@components/MenuData.js';
import { apiClient } from '@lib/api/client';

const VOID_URL = 'javascript:void(0)';
// const dataCard = await apiClient.get('/hubnet/dashboard-card');
// console.log('dataCard', dataCard);
// Builds a flat option list from the nested menu structure.
const buildSelectOptions = (items, trail = []) =>
  items.reduce((acc, item) => {
    const currentTrail = [...trail, item.name];
    const hasChildren = Array.isArray(item.subItems) && item.subItems.length > 0;

    if (item.url && item.url !== VOID_URL) {
      acc.push({
        value: item.url,
        label: currentTrail.join(' 👉 '),
        icon: item.icon ?? null,
      });
    }

    if (hasChildren) {
      acc.push(...buildSelectOptions(item.subItems, currentTrail));
    }

    return acc;
  }, []);

// Simple interactive banner to verify React rendering inside Astro.
export default function WelcomeBanner({ name = 'Astro' }) {
  const options = useMemo(() => buildSelectOptions(menuData), []);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const headerClasses = [
    'faq-header',
    'd-flex',
    'flex-column',
    'justify-content-center',
    'align-items-center',
    'h-px-300',
    'position-relative',
    'rounded-4',
    showResults ? null : 'overflow-hidden',
  ]
    .filter(Boolean)
    .join(' ');

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options.slice(0, 8);
    }
    const lower = query.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lower)).slice(0, 8);
  }, [options, query]);

  const handleSelect = (option) => {
    setQuery('');
    setShowResults(false);
    if (typeof window !== 'undefined' && option.value) {
      window.location.href = option.value;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (filteredOptions.length > 0) {
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className="container-xxl grow container-p-y">
      <div className={headerClasses}>
        <img
          src="/assets/img/pages/header-light.png"
          className="scaleX-n1-rtl faq-banner-img h-px-300 z-n1"
          alt="background image"
          data-app-light-img="/assets/img/pages/header-light.png"
          data-app-dark-img="/assets/img/pages/header-dark.png"
          style={{ visibility: 'visible' }}
        />
        <h4 className="text-center text-primary mb-2">Hello, how can we help?</h4>
        <p className="text-body text-center mb-0 px-4">
          MAU APP akan membantu Anda mengelola inventaris gudang logistik lini 1 bandara Soekarno
          Hatta dengan mudah dan efisien.
        </p>
        <form
          className="input-wrapper mb-6 mt-7 position-relative w-100"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="input-group input-group-merge">
            <span className="input-group-text" id="menu-search-addon">
              <i className="icon-base ri ri-search-line"></i>
            </span>
            <input
              type="search"
              className="form-control"
              placeholder="Cari menu..."
              aria-label="Cari menu"
              aria-describedby="menu-search-addon"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
            />
          </div>
          {showResults && filteredOptions.length > 0 && (
            <div
              className="dropdown-menu show w-100 mt-2 shadow border-0 rounded-4 py-0"
              style={{ zIndex: 1050 }}
            >
              {filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className="dropdown-item d-flex align-items-center gap-2 py-2"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(option);
                  }}
                >
                  {option.icon ? <i className={`icon-base ${option.icon}`}></i> : null}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
          {showResults && filteredOptions.length === 0 && (
            <div
              className="dropdown-menu show w-100 mt-2 shadow-sm border-0 rounded-4 py-3 px-4 text-muted"
              style={{ zIndex: 1050 }}
            >
              Tidak ada menu yang cocok.
            </div>
          )}
        </form>
      </div>
      <div className="row my-6">
        <div className="col-12 text-center my-6">
          <div className="badge bg-label-primary rounded-pill">Question?</div>
          <h4 className="my-2">You still have a question?</h4>
          <p className="mb-0">
            If you can't find question in our FAQ, you can contact us. We'll answer you shortly!
          </p>
        </div>
      </div>
      <div className="row justify-content-center gap-sm-0 gap-6">
        <div className="col-sm-6">
          <div className="p-6 rounded-4 bg-faq-section d-flex align-items-center flex-column">
            <div className="avatar avatar-md">
              <span className="avatar-initial bg-label-primary rounded-3">
                <i className="icon-base ri ri-phone-line icon-30px"></i>
              </span>
            </div>
            <h5 className="mt-4 mb-1">
              <a className="text-heading" href="tel:+(810)25482568">
                + (810) 2548 2568
              </a>
            </h5>
            <p className="mb-0">We are always happy to help</p>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="p-6 rounded-4 bg-faq-section d-flex align-items-center flex-column">
            <div className="avatar avatar-md">
              <span className="avatar-initial bg-label-primary rounded-3">
                <i className="icon-base ri ri-mail-line icon-30px"></i>
              </span>
            </div>
            <h5 className="mt-4 mb-1">
              <a className="text-heading" href="mailto:help@help.com">
                help@help.com
              </a>
            </h5>
            <p className="mb-0">Best way to get a quick answer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// const styles = {
//   wrapper: {
//     margin: '0 auto',
//     maxWidth: '32rem',
//     padding: '3rem 1.5rem',
//     textAlign: 'center',
//   },
//   heading: {
//     fontSize: '2.5rem',
//     marginBottom: '1rem',
//   },
//   text: {
//     marginBottom: '1.5rem',
//     lineHeight: 1.6,
//   },
//   button: {
//     backgroundColor: '#6b5cff',
//     border: 'none',
//     borderRadius: '0.5rem',
//     color: '#fff',
//     cursor: 'pointer',
//     fontSize: '1rem',
//     fontWeight: 600,
//     padding: '0.75rem 1.5rem',
//   },
// };
