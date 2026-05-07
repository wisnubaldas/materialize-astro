import { useEffect, useMemo, useState } from 'react';
import { showToast } from '@js/utils';
import BuildupDatatables from './buildupDatatables';
import BuildupDrafts from './buildupDrafts';
import BuildupForm from './buildupForm';

const DRAFT_STORAGE_KEY = 'warehouse_manifest_drafts_v1';

const createDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const loadStoredDrafts = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export default function Buildup() {
  const [activeTab, setActiveTab] = useState('search');
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    setDrafts(loadStoredDrafts());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const handleSaveDraft = async (draftPayload) => {
    const nextDraft = {
      id: createDraftId(),
      createdAt: new Date().toISOString(),
      rows: draftPayload?.rows ?? [],
      payload: draftPayload?.payload ?? null,
      ignored: draftPayload?.ignored ?? { masters: 0, details: 0 },
      masterAwbs: draftPayload?.masterAwbs ?? [],
    };

    setDrafts((prevDrafts) => [nextDraft, ...prevDrafts]);
    setActiveTab('draft');
  };

  const handleRemoveDraft = (draftId) => {
    setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft.id !== draftId));
  };

  const handleSubmittedAllDrafts = () => {
    setDrafts([]);
    setActiveTab('data');
    showToast({
      type: 'success',
      title: 'Draft Manifest',
      message: 'Semua draft berhasil disubmit dan membentuk satu manifest buildup.',
    });
  };

  const tabs = useMemo(
    () => [
      {
        id: 'search',
        label: 'Cari Master AWB',
        content: <BuildupForm onSaveDraft={handleSaveDraft} />,
      },
      {
        id: 'draft',
        label: `Draft Manifest (${drafts.length})`,
        content: (
          <BuildupDrafts
            drafts={drafts}
            onRemoveDraft={handleRemoveDraft}
            onSubmittedAllDrafts={handleSubmittedAllDrafts}
          />
        ),
      },
      { id: 'data', label: 'Data Manifest', content: <BuildupDatatables /> },
    ],
    [drafts]
  );

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
