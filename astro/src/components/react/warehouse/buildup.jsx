import { useEffect, useMemo, useState } from 'react';
import { showToast } from '@utils';
import warehouseClient from '@lib/api/warehouse';
import BuildupDatatables from './buildupDatatables';
import BuildupDrafts from './buildupDrafts';
import BuildupForm from './buildupForm';
import { clearStoredDrafts, readStoredDrafts, resolveErrorMessage } from './shared';

const toDraftPayload = (draftPayload) => ({
  rows: draftPayload?.rows ?? [],
  payload: draftPayload?.payload ?? null,
  ignored: draftPayload?.ignored ?? { masters: 0, details: 0 },
  master_awbs: draftPayload?.masterAwbs ?? draftPayload?.master_awbs ?? [],
});

const normalizeDraft = (draft) => ({
  id: draft?.id,
  createdAt: draft?.create_at ?? draft?.createdAt ?? null,
  updatedAt: draft?.update_at ?? draft?.updatedAt ?? null,
  rows: draft?.rows ?? [],
  payload: draft?.payload ?? null,
  ignored: draft?.ignored ?? { masters: 0, details: 0 },
  masterAwbs: draft?.master_awbs ?? draft?.masterAwbs ?? [],
});

export default function Buildup() {
  const [activeTab, setActiveTab] = useState('search');
  const [drafts, setDrafts] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDrafts = async () => {
      setIsLoadingDrafts(true);
      try {
        const [storedDrafts, remoteDrafts] = [
          readStoredDrafts(),
          await warehouseClient.listBuildUpDrafts(),
        ];
        const validStoredDrafts = storedDrafts.filter(
          (storedDraft) => Array.isArray(storedDraft?.rows) && storedDraft.rows.length > 0
        );
        const migratedDrafts = [];

        if (validStoredDrafts.length) {
          for (const storedDraft of validStoredDrafts) {
            const createdDraft = await warehouseClient.createBuildUpDraft(toDraftPayload(storedDraft));
            migratedDrafts.push(createdDraft);
          }
          clearStoredDrafts();
          showToast({
            type: 'success',
            title: 'Draft Manifest',
            message: `${validStoredDrafts.length} draft lokal berhasil dipindahkan ke database.`,
          });
        } else if (storedDrafts.length) {
          clearStoredDrafts();
          showToast({
            type: 'warning',
            title: 'Draft Manifest',
            message: 'Draft lokal lama dilewati karena data tidak lengkap.',
          });
        }

        if (isMounted) {
          const nextDrafts = [
            ...migratedDrafts,
            ...(Array.isArray(remoteDrafts) ? remoteDrafts : []),
          ];
          setDrafts(nextDrafts.map(normalizeDraft));
        }
      } catch (error) {
        if (isMounted) {
          const message = resolveErrorMessage(error, 'Gagal memuat draft manifest.');
          showToast({
            type: 'danger',
            title: 'Draft Manifest',
            message,
          });
          setDrafts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDrafts(false);
        }
      }
    };

    void loadDrafts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveDraft = async (draftPayload) => {
    const nextDraft = await warehouseClient.createBuildUpDraft(toDraftPayload(draftPayload));

    setDrafts((prevDrafts) => [normalizeDraft(nextDraft), ...prevDrafts]);
    setActiveTab('draft');
  };

  const handleRemoveDraft = async (draftId) => {
    await warehouseClient.deleteBuildUpDraft(draftId);
    setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft.id !== draftId));
  };

  const handleUpdateDraft = async (draftId, draftPayload) => {
    const updatedDraft = await warehouseClient.updateBuildUpDraft(draftId, toDraftPayload(draftPayload));
    setDrafts((prevDrafts) =>
      prevDrafts.map((draft) =>
        draft.id === draftId
          ? normalizeDraft(updatedDraft)
          : draft
      )
    );
  };

  const handleSubmittedDraft = async (draftId) => {
    await warehouseClient.deleteBuildUpDraft(draftId);
    setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft.id !== draftId));
    showToast({
      type: 'success',
      title: 'Draft Manifest',
      message: 'Draft berhasil disubmit dan dihapus dari daftar draft.',
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
            isLoading={isLoadingDrafts}
            onRemoveDraft={handleRemoveDraft}
            onUpdateDraft={handleUpdateDraft}
            onSubmittedDraft={handleSubmittedDraft}
          />
        ),
      },
      { id: 'data', label: 'Data Manifest', content: <BuildupDatatables /> },
    ],
    [drafts, isLoadingDrafts]
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

