import { useMemo } from 'react';

// Daftar field yang ingin ditampilkan pada form filter.
const fieldsConfig = [
  {
    name: 'NO_INVOICE',
    placeholder: 'NO_INVOICE',
    type: 'text',
  },
  {
    name: 'TANGGAL',
    placeholder: 'TANGGAL',
    type: 'date',
  },
  {
    name: 'FLIGHT_NUMBER',
    placeholder: 'FLIGHT_NUMBER',
    type: 'text',
  },
  {
    name: 'KDAIRLINE',
    placeholder: 'KDAIRLINE',
    type: 'text',
  },
  {
    name: 'SMU',
    placeholder: 'SMU',
    type: 'text',
  },
];

export default function InvoiceFilters({ values, onChange, onSubmit, onReset, isSubmitting }) {
  // Pastikan komponen selalu bekerja dengan objek filter (bukan undefined/null).
  const filters = useMemo(() => values ?? {}, [values]);

  // Sinkronkan perubahan input ke komponen induk.
  const handleChange = (event) => {
    const { name, value } = event.target;
    if (onChange) {
      onChange(name, value);
    }
  };

  // Blokir submit default lalu delegasikan ke handler parent.
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    // Gunakan card agar tampilan filter konsisten dengan mockup.
    <form
      className="card border-0 shadow-sm mb-4"
      onSubmit={handleSubmit}
      aria-label="Filter data invoice"
    >
      <div className="row h-100">
        <div className="col-2">
          <div className="d-flex align-items-end h-100 justify-content-center">
            <img
              src="../../assets/img/illustrations/add-new-role-illustration.png"
              className="img-fluid "
              alt="Image"
              width="90"
            />
          </div>
        </div>
        <div className="col-10 p-5">
          <div className="row">
            {/* Render input secara dinamis sesuai konfigurasi field */}
            {fieldsConfig.map(({ name, placeholder, type }) => (
              <div key={name} className="col-12 col-md-4 col-lg-3">
                <label htmlFor={name} className="form-label text-uppercase small fw-semibold">
                  {placeholder.replace(/_/g, ' ')}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={filters[name] ?? ''}
                  placeholder={placeholder}
                  className="form-control form-control-sm rounded-4"
                  onChange={handleChange}
                />
              </div>
            ))}
            <div className="col-12 mt-3 btn-group" role="group" aria-label="Form actions">
              <button
                type="button"
                className="btn btn-label-primary waves-effect text-uppercase"
                onClick={onReset}
              >
                Reset Form
              </button>
              {/* Tombol Apply berada di kanan agar mudah diakses */}
              <button
                type="submit"
                className="btn btn-info waves-effect text-uppercase"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Loading…' : 'Apply Filter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
