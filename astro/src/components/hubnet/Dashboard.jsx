import { useState } from 'react';

import DataTerkirim from './DataTerkirim';
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div className="row">
      <div className="mb-4">
        <DataTerkirim />
      </div>
    </div>
  );
}
