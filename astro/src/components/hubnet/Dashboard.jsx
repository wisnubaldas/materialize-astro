import { useEffect, useState } from 'react';

import { apiClient } from '@lib/api/client';

export default function Dashboard() {
  const [dataCard, setDataCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardCard = async () => {
      try {
        const response = await apiClient.get('/hubnet/dashboard-card');
        if (!cancelled) {
          setDataCard(response);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error && error.message ? error.message : 'Gagal memuat data dashboard.';
          setErrorMessage(message);
          console.error('Gagal memuat data dashboard Hubnet:', error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardCard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="col-auto">
      <div className="mb-4">
        <h5 className="fw-bold mb-1 text-uppercase">Data racking yang terrkirim</h5>
        <p className="text-muted mb-0">Menampilkan data tracking yang terkirim ke Hubnet</p>
        {isLoading && <p className="text-muted small mb-0">Memuat data...</p>}
        {!isLoading && errorMessage && <p className="text-danger small mb-0">{errorMessage}</p>}
        {!isLoading && !errorMessage && (
          <pre className="small bg-light rounded p-2 mt-2">
            {JSON.stringify(dataCard, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
