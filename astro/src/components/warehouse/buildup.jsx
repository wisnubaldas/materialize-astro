import { useMemo, useState } from 'react';
import BuildupDatatables from './buildupDatatables';
import BuildupForm from './buildupForm';
export default function Buildup() {
  const tabs = useMemo(
    () => [
      { id: 'search', label: 'Cari Master AWB', content: <BuildupForm /> },
      { id: 'data', label: 'Data Manifest', content: <BuildupDatatables /> },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="card shadow-none border-0">
      <div className="card-body">
        <ul className="nav nav-pills nav-fill mb-3" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} className="nav-item mb-1 mb-sm-0" role="presentation">
                <button
                  type="button"
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="tab-content">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                className={`tab-pane fade ${isActive ? 'show active' : ''}`}
                role="tabpanel"
              >
                {isActive ? tab.content : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
