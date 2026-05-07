import GridData from '@components/GridData';
import InputField from '@components/parsial/InputField';
import { showToast } from '@utils';
import ediClient, { EDI_DISCREPANCY_CODE_DATATABLE_ENDPOINT } from '@lib/api/edi';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { boolBadge, escapeHtml, resolveErrorMessage } from './shared';

const severityOptions = ['INFO', 'MINOR', 'MAJOR', 'CRITICAL'];

const defaultForm = {
  code: '',
  category: '',
  name: '',
  description: '',
  severity: 'MAJOR',
  hold_delivery: false,
  require_photo: false,
  require_remark: true,
  is_active: true,
};

const severityBadge = (value, type) => {
  if (type !== 'display') {
    return value;
  }

  const text = String(value ?? '').toUpperCase();
  const theme =
    text === 'CRITICAL'
      ? 'bg-label-danger'
      : text === 'MAJOR'
      ? 'bg-label-warning'
      : text === 'MINOR'
      ? 'bg-label-info'
      : 'bg-label-secondary';

  return `<span class="badge rounded-pill ${theme} px-2">${text || '-'}</span>`;
};

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

export default function DiscrepancyCodeDatatables() {
  const tableRef = useRef(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const reloadTable = useCallback((resetPaging = false) => {
    tableRef.current?.reload?.(resetPaging);
  }, []);

  const validateForm = useCallback((payload) => {
    const validation = {};
    if (!payload.code.trim()) validation.code = 'Kode wajib diisi';
    if (!payload.category.trim()) validation.category = 'Kategori wajib diisi';
    if (!payload.name.trim()) validation.name = 'Nama wajib diisi';
    if (!payload.severity) validation.severity = 'Severity wajib dipilih';
    return validation;
  }, []);

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await ediClient.createDiscrepancyCode({
        ...form,
        code: form.code.trim(),
        category: form.category.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      showToast({
        type: 'success',
        title: 'Discrepancy Code',
        message: 'Data berhasil ditambahkan.',
      });
      setForm(defaultForm);
      reloadTable(true);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Discrepancy Code',
        message: resolveErrorMessage(err, 'Gagal menambahkan data.'),
      });
    } finally {
      setLoading(false);
    }
  }, [form, reloadTable, validateForm]);

  const openEditModal = useCallback(
    async (id) => {
      let record;
      try {
        record = await ediClient.getDiscrepancyCode(id);
      } catch (err) {
        showToast({
          type: 'danger',
          title: 'Discrepancy Code',
          message: resolveErrorMessage(err, 'Gagal memuat data.'),
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Edit Discrepancy Code',
        html: `
          <div class="text-start">
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-code"
                class="form-control"
                placeholder="DMG"
                value="${escapeHtml(record.code)}"
              />
              <label for="swal-code">Kode</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-category"
                class="form-control"
                placeholder="Damage"
                value="${escapeHtml(record.category)}"
              />
              <label for="swal-category">Kategori</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-name"
                class="form-control"
                placeholder="Damage Cargo"
                value="${escapeHtml(record.name)}"
              />
              <label for="swal-name">Nama</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <textarea
                id="swal-description"
                class="form-control"
                placeholder="Deskripsi"
                style="min-height: 90px;"
              >${escapeHtml(record.description ?? '')}</textarea>
              <label for="swal-description">Deskripsi</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <select id="swal-severity" class="form-select">
                ${severityOptions
                  .map(
                    (item) =>
                      `<option value="${item}" ${
                        String(record.severity).toUpperCase() === item ? 'selected' : ''
                      }>${item}</option>`
                  )
                  .join('')}
              </select>
              <label for="swal-severity">Severity</label>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="swal-hold-delivery"
                    ${record.hold_delivery ? 'checked' : ''}
                  />
                  <label class="form-check-label" for="swal-hold-delivery">Hold Delivery</label>
                </div>
              </div>
              <div class="col-6">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="swal-require-photo"
                    ${record.require_photo ? 'checked' : ''}
                  />
                  <label class="form-check-label" for="swal-require-photo">Require Photo</label>
                </div>
              </div>
              <div class="col-6">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="swal-require-remark"
                    ${record.require_remark ? 'checked' : ''}
                  />
                  <label class="form-check-label" for="swal-require-remark">Require Remark</label>
                </div>
              </div>
              <div class="col-6">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="swal-is-active"
                    ${record.is_active ? 'checked' : ''}
                  />
                  <label class="form-check-label" for="swal-is-active">Aktif</label>
                </div>
              </div>
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
          const code = popup?.querySelector('#swal-code')?.value?.trim() ?? '';
          const category = popup?.querySelector('#swal-category')?.value?.trim() ?? '';
          const name = popup?.querySelector('#swal-name')?.value?.trim() ?? '';
          const description = popup?.querySelector('#swal-description')?.value?.trim() ?? '';
          const severity = popup?.querySelector('#swal-severity')?.value ?? '';
          const hold_delivery = Boolean(popup?.querySelector('#swal-hold-delivery')?.checked);
          const require_photo = Boolean(popup?.querySelector('#swal-require-photo')?.checked);
          const require_remark = Boolean(popup?.querySelector('#swal-require-remark')?.checked);
          const is_active = Boolean(popup?.querySelector('#swal-is-active')?.checked);

          if (!code) {
            Swal.showValidationMessage('Kode wajib diisi');
            return undefined;
          }
          if (!category) {
            Swal.showValidationMessage('Kategori wajib diisi');
            return undefined;
          }
          if (!name) {
            Swal.showValidationMessage('Nama wajib diisi');
            return undefined;
          }
          if (!severity) {
            Swal.showValidationMessage('Severity wajib dipilih');
            return undefined;
          }

          try {
            await ediClient.updateDiscrepancyCode(record.id, {
              code,
              category,
              name,
              description: description || null,
              severity,
              hold_delivery,
              require_photo,
              require_remark,
              is_active,
            });
            return true;
          } catch (err) {
            Swal.showValidationMessage(resolveErrorMessage(err, 'Gagal memperbarui data.'));
            return undefined;
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });

      if (result.isConfirmed) {
        showToast({
          type: 'success',
          title: 'Discrepancy Code',
          message: 'Data berhasil diperbarui.',
        });
        reloadTable(false);
      }
    },
    [reloadTable]
  );

  const handleDelete = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: 'Hapus Discrepancy Code?',
        text: 'Data akan dihapus permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal',
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        await ediClient.deleteDiscrepancyCode(id);
        showToast({
          type: 'success',
          title: 'Discrepancy Code',
          message: 'Data berhasil dihapus.',
        });
        reloadTable(false);
      } catch (err) {
        showToast({
          type: 'danger',
          title: 'Discrepancy Code',
          message: resolveErrorMessage(err, 'Gagal menghapus data.'),
        });
      }
    },
    [reloadTable]
  );

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

  const columns = useMemo(
    () => [
      { data: 'code', title: 'Kode', className: 'text-uppercase fw-semibold' },
      { data: 'category', title: 'Kategori', className: 'text-uppercase' },
      { data: 'name', title: 'Nama' },
      {
        data: 'severity',
        title: 'Severity',
        className: 'text-center',
        render: (value, type) => severityBadge(value, type),
      },
      {
        data: 'hold_delivery',
        title: 'Hold Delivery',
        className: 'text-center',
        render: (value, type) => boolBadge(value, type),
      },
      {
        data: 'require_photo',
        title: 'Require Photo',
        className: 'text-center',
        render: (value, type) => boolBadge(value, type),
      },
      {
        data: 'require_remark',
        title: 'Require Remark',
        className: 'text-center',
        render: (value, type) => boolBadge(value, type),
      },
      {
        data: 'is_active',
        title: 'Aktif',
        className: 'text-center',
        render: (value, type) =>
          boolBadge(value, type, { trueLabel: 'Aktif', falseLabel: 'Nonaktif' }),
      },
      { data: 'description', title: 'Deskripsi', className: 'text-wrap' },
      {
        data: 'created_at',
        title: 'Dibuat',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type),
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

  const tableOptions = useMemo(() => {
    const findIndex = (key) => columns.findIndex((col) => col.data === key);
    const codeIndex = findIndex('code');
    const boolTargets = ['hold_delivery', 'require_photo', 'require_remark', 'is_active']
      .map(findIndex)
      .filter((idx) => idx >= 0);

    const defs = [];
    if (boolTargets.length) {
      defs.push({ targets: boolTargets, className: 'text-center' });
    }

    return {
      order: [[codeIndex >= 0 ? codeIndex : 0, 'asc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      columnDefs: defs,
    };
  }, [columns]);

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Tambah Discrepancy Code</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <InputField
                  label="Kode"
                  name="code"
                  placeholder="DMG"
                  value={form.code}
                  onChange={handleChange}
                  error={errors.code}
                />
              </div>
              <div className="col-md-3">
                <InputField
                  label="Kategori"
                  name="category"
                  placeholder="DAMAGE"
                  value={form.category}
                  onChange={handleChange}
                  error={errors.category}
                />
              </div>
              <div className="col-md-6">
                <InputField
                  label="Nama"
                  name="name"
                  placeholder="Damage Cargo"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                />
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="form-floating form-floating-outline mb-3">
                  <textarea
                    id="input-description"
                    className="form-control"
                    name="description"
                    placeholder="Deskripsi"
                    style={{ minHeight: '90px' }}
                    value={form.description}
                    onChange={handleChange}
                  />
                  <label htmlFor="input-description">Deskripsi</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-floating form-floating-outline mb-3">
                  <select
                    id="input-severity"
                    className={`form-select ${errors.severity ? 'is-invalid' : ''}`}
                    name="severity"
                    value={form.severity}
                    onChange={handleChange}
                  >
                    {severityOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="input-severity">Severity</label>
                  {errors.severity && (
                    <div className="form-text text-danger mt-1">{errors.severity}</div>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <div className="d-flex flex-column gap-2 mt-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="input-hold-delivery"
                      name="hold_delivery"
                      checked={form.hold_delivery}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="input-hold-delivery">
                      Hold Delivery
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="input-require-photo"
                      name="require_photo"
                      checked={form.require_photo}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="input-require-photo">
                      Require Photo
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="input-require-remark"
                      name="require_remark"
                      checked={form.require_remark}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="input-require-remark">
                      Require Remark
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="input-is-active"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="input-is-active">
                      Aktif
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h5 className="card-title text-secondary mb-1">Daftar Discrepancy Code</h5>
                <div className="text-muted small">
                  Endpoint: {EDI_DISCREPANCY_CODE_DATATABLE_ENDPOINT}
                </div>
              </div>
            </div>
            <GridData
              ref={tableRef}
              columns={columns}
              ajaxEndpoint={EDI_DISCREPANCY_CODE_DATATABLE_ENDPOINT}
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



