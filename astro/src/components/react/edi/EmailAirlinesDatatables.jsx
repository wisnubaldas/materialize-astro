import GridData from '@components/GridData';
import InputField from '@components/parsial/InputField';
import { showToast } from '@utils';
import ediClient, { EDI_EMAIL_AIRLINES_DATATABLE_ENDPOINT } from '@lib/api/edi';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { boolBadge, escapeHtml, resolveErrorMessage } from './shared';

const statusOptions = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Nonaktif' },
];

const defaultForm = {
  airline_name: '',
  awb_prefix: '',
  iata_code: '',
  icao_code: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  status: 'ACTIVE',
};

/**
 * Format timestamp into standard display date format.
 * @param {string} value - The datetime string to format.
 * @param {string} type - Datatable draw type (e.g. 'display').
 * @returns {string} The formatted date or original value.
 */
const dateRenderer = (value, type) => {
  if (type !== 'display' && type !== 'filter') {
    return value ?? '';
  }
  if (!value) {
    return '';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY HH:mm') : value;
};

/**
 * Component for displaying the datatable and handling CRUD operations for Email Airlines.
 * @returns {JSX.Element} The Email Airlines management panel.
 */
export default function EmailAirlinesDatatables() {
  const tableRef = useRef(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Reload the airline data table.
   * @param {boolean} [resetPaging=false] - Whether to reset pagination back to page 1.
   */
  const reloadTable = useCallback((resetPaging = false) => {
    tableRef.current?.reload?.(resetPaging);
  }, []);

  /**
   * Validate the airline form data.
   * @param {Object} payload - The form state payload.
   * @returns {Object} Validation error dictionary.
   */
  const validateForm = useCallback((payload) => {
    const validation = {};
    if (!payload.airline_name.trim()) {
      validation.airline_name = 'Nama airline wajib diisi';
    }
    if (payload.contact_email.trim()) {
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.contact_email.trim())) {
        validation.contact_email = 'Format email tidak valid';
      }
    }
    return validation;
  }, []);

  /**
   * Handle form input changes.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Input change event.
   */
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  /**
   * Submit the Add Form to create a new airline contact.
   */
  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await ediClient.createEmailAirline({
        airline_name: form.airline_name.trim(),
        awb_prefix: form.awb_prefix.trim() || null,
        iata_code: form.iata_code.trim().toUpperCase() || null,
        icao_code: form.icao_code.trim().toUpperCase() || null,
        contact_person: form.contact_person.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        status: form.status,
      });

      showToast({
        type: 'success',
        title: 'Email Airlines',
        message: 'Data maskapai berhasil ditambahkan.',
      });
      setForm(defaultForm);
      reloadTable(true);
    } catch (err) {
      console.error('Failed to create email airline:', err);
      showToast({
        type: 'danger',
        title: 'Email Airlines',
        message: resolveErrorMessage(err, 'Gagal menambahkan data maskapai.'),
      });
    } finally {
      setLoading(false);
    }
  }, [form, reloadTable, validateForm]);

  /**
   * Open the SweetAlert2 modal to edit an airline's details.
   * @param {number} id - The ID of the airline to edit.
   */
  const openEditModal = useCallback(
    async (id) => {
      let record;
      try {
        record = await ediClient.getEmailAirline(id);
      } catch (err) {
        console.error(`Failed to fetch email airline details (ID: ${id}):`, err);
        showToast({
          type: 'danger',
          title: 'Email Airlines',
          message: resolveErrorMessage(err, 'Gagal memuat data maskapai.'),
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Edit Email Airline',
        html: `
          <div class="text-start">
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-airline_name"
                class="form-control"
                placeholder="Garuda Indonesia"
                value="${escapeHtml(record.airline_name)}"
              />
              <label for="swal-airline_name">Nama Airline *</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-awb_prefix"
                class="form-control"
                placeholder="126"
                value="${escapeHtml(record.awb_prefix ?? '')}"
              />
              <label for="swal-awb_prefix">AWB Prefix</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-iata_code"
                class="form-control"
                placeholder="GA"
                value="${escapeHtml(record.iata_code ?? '')}"
              />
              <label for="swal-iata_code">Kode IATA</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-icao_code"
                class="form-control"
                placeholder="GIA"
                value="${escapeHtml(record.icao_code ?? '')}"
              />
              <label for="swal-icao_code">Kode ICAO</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-contact_person"
                class="form-control"
                placeholder="Contact Person"
                value="${escapeHtml(record.contact_person ?? '')}"
              />
              <label for="swal-contact_person">Contact Person</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="email"
                id="swal-contact_email"
                class="form-control"
                placeholder="ops@airlines.com"
                value="${escapeHtml(record.contact_email ?? '')}"
              />
              <label for="swal-contact_email">Contact Email</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-contact_phone"
                class="form-control"
                placeholder="+62 21 1234567"
                value="${escapeHtml(record.contact_phone ?? '')}"
              />
              <label for="swal-contact_phone">Contact Phone</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <select id="swal-status" class="form-select">
                ${statusOptions
                  .map(
                    (item) =>
                      `<option value="${item.value}" ${
                        record.status === item.value ? 'selected' : ''
                      }>${item.label}</option>`
                  )
                  .join('')}
              </select>
              <label for="swal-status">Status</label>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Update',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          const popup = Swal.getPopup();
          const airline_name = popup?.querySelector('#swal-airline_name')?.value?.trim() ?? '';
          const awb_prefix = popup?.querySelector('#swal-awb_prefix')?.value?.trim() ?? '';
          const iata_code = popup?.querySelector('#swal-iata_code')?.value?.trim() ?? '';
          const icao_code = popup?.querySelector('#swal-icao_code')?.value?.trim() ?? '';
          const contact_person = popup?.querySelector('#swal-contact_person')?.value?.trim() ?? '';
          const contact_email = popup?.querySelector('#swal-contact_email')?.value?.trim() ?? '';
          const contact_phone = popup?.querySelector('#swal-contact_phone')?.value?.trim() ?? '';
          const status = popup?.querySelector('#swal-status')?.value ?? 'ACTIVE';

          if (!airline_name) {
            Swal.showValidationMessage('Nama airline wajib diisi');
            return undefined;
          }
          if (contact_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contact_email)) {
              Swal.showValidationMessage('Format email tidak valid');
              return undefined;
            }
          }

          try {
            await ediClient.updateEmailAirline(record.id, {
              airline_name,
              awb_prefix: awb_prefix || null,
              iata_code: iata_code.toUpperCase() || null,
              icao_code: icao_code.toUpperCase() || null,
              contact_person: contact_person || null,
              contact_email: contact_email || null,
              contact_phone: contact_phone || null,
              status,
            });
            return true;
          } catch (err) {
            console.error(`Failed to update email airline (ID: ${record.id}):`, err);
            Swal.showValidationMessage(resolveErrorMessage(err, 'Gagal memperbarui data maskapai.'));
            return undefined;
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });

      if (result.isConfirmed) {
        showToast({
          type: 'success',
          title: 'Email Airlines',
          message: 'Data maskapai berhasil diperbarui.',
        });
        reloadTable(false);
      }
    },
    [reloadTable]
  );

  /**
   * Prompt confirmation and delete an email airline contact.
   * @param {number} id - The ID of the airline to delete.
   */
  const handleDelete = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: 'Hapus Maskapai?',
        text: 'Konfigurasi email maskapai ini akan dihapus permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal',
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        await ediClient.deleteEmailAirline(id);
        showToast({
          type: 'success',
          title: 'Email Airlines',
          message: 'Data maskapai berhasil dihapus.',
        });
        reloadTable(false);
      } catch (err) {
        console.error(`Failed to delete email airline (ID: ${id}):`, err);
        showToast({
          type: 'danger',
          title: 'Email Airlines',
          message: resolveErrorMessage(err, 'Gagal menghapus data maskapai.'),
        });
      }
    },
    [reloadTable]
  );

  // Set up click listeners for the table actions (Edit/Delete buttons)
  useEffect(() => {
    const api = tableRef.current?.dt?.();
    if (!api?.table) {
      return undefined;
    }

    const tableNode = api.table().node();
    if (!tableNode) {
      return undefined;
    }

    const handleClick = (event) => {
      const target = event.target?.closest?.('button[data-action]');
      if (!target) {
        return;
      }
      const action = target.getAttribute('data-action');
      const id = Number(target.getAttribute('data-id'));
      if (!id) {
        return;
      }

      if (action === 'edit') {
        openEditModal(id);
      } else if (action === 'delete') {
        handleDelete(id);
      }
    };

    tableNode.addEventListener('click', handleClick);
    return () => {
      tableNode.removeEventListener('click', handleClick);
    };
  }, [handleDelete, openEditModal]);

  // Define columns for GridData
  const columns = useMemo(
    () => [
      { data: 'airline_name', title: 'Nama Airline', className: 'fw-semibold' },
      { data: 'awb_prefix', title: 'AWB Prefix', className: 'text-center' },
      { data: 'iata_code', title: 'IATA', className: 'text-center text-uppercase' },
      { data: 'icao_code', title: 'ICAO', className: 'text-center text-uppercase' },
      { data: 'contact_person', title: 'Contact Person' },
      { data: 'contact_email', title: 'Email' },
      { data: 'contact_phone', title: 'No. Telepon' },
      {
        data: 'status',
        title: 'Status',
        className: 'text-center',
        render: (value, type) =>
          boolBadge(value === 'ACTIVE', type, { trueLabel: 'Aktif', falseLabel: 'Nonaktif' }),
      },
      {
        data: 'updated_at',
        title: 'Diupdate',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type),
      },
      {
        data: null,
        title: 'Aksi',
        orderable: false,
        searchable: false,
        className: 'text-end text-nowrap',
        render: (_value, type, row) => {
          if (type !== 'display') {
            return row?.id ?? '';
          }
          return `
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-warning" data-action="edit" data-id="${row?.id}">
                Edit
              </button>
              <button class="btn btn-outline-danger" data-action="delete" data-id="${row?.id}">
                Hapus
              </button>
            </div>
          `;
        },
      },
    ],
    []
  );

  // Set up table options
  const tableOptions = useMemo(() => {
    const findIndex = (key) => columns.findIndex((col) => col.data === key);
    const nameIndex = findIndex('airline_name');
    const centerTargets = ['awb_prefix', 'iata_code', 'icao_code', 'status']
      .map(findIndex)
      .filter((idx) => idx >= 0);

    const defs = [];
    if (centerTargets.length) {
      defs.push({ targets: centerTargets, className: 'text-center' });
    }

    return {
      order: [[nameIndex >= 0 ? nameIndex : 0, 'asc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      columnDefs: defs,
    };
  }, [columns]);

  return (
    <div className="row g-4">
      {/* Add Form Section */}
      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary mb-3">Tambah Konfigurasi Email Airline</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <InputField
                  label="Nama Airline *"
                  name="airline_name"
                  placeholder="Garuda Indonesia"
                  value={form.airline_name}
                  onChange={handleChange}
                  error={errors.airline_name}
                />
              </div>
              <div className="col-md-2">
                <InputField
                  label="AWB Prefix"
                  name="awb_prefix"
                  placeholder="126"
                  value={form.awb_prefix}
                  onChange={handleChange}
                  error={errors.awb_prefix}
                />
              </div>
              <div className="col-md-2">
                <InputField
                  label="Kode IATA"
                  name="iata_code"
                  placeholder="GA"
                  value={form.iata_code}
                  onChange={handleChange}
                  error={errors.iata_code}
                />
              </div>
              <div className="col-md-2">
                <InputField
                  label="Kode ICAO"
                  name="icao_code"
                  placeholder="GIA"
                  value={form.icao_code}
                  onChange={handleChange}
                  error={errors.icao_code}
                />
              </div>
              <div className="col-md-2">
                <div className="form-floating form-floating-outline mb-3">
                  <select
                    id="input-status"
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="input-status">Status</label>
                </div>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <InputField
                  label="Contact Person"
                  name="contact_person"
                  placeholder="Budi Gunawan"
                  value={form.contact_person}
                  onChange={handleChange}
                  error={errors.contact_person}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  label="Contact Email"
                  name="contact_email"
                  type="email"
                  placeholder="ops@airlines.com"
                  value={form.contact_email}
                  onChange={handleChange}
                  error={errors.contact_email}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  label="No. Telepon"
                  name="contact_phone"
                  placeholder="+62 21 1234567"
                  value={form.contact_phone}
                  onChange={handleChange}
                  error={errors.contact_phone}
                />
              </div>
            </div>
            <button
              className="btn btn-primary mt-2"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Datatable Section */}
      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h5 className="card-title text-secondary mb-1">Daftar Email Airline</h5>
                <div className="text-muted small">
                  Endpoint: {EDI_EMAIL_AIRLINES_DATATABLE_ENDPOINT}
                </div>
              </div>
            </div>
            <GridData
              ref={tableRef}
              columns={columns}
              ajaxEndpoint={EDI_EMAIL_AIRLINES_DATATABLE_ENDPOINT}
              filters={{}}
              options={tableOptions}
              className="table-bordered table-striped align-middle"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
