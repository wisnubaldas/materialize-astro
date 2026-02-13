import GridData from '@components/GridData';
import InputField from '@components/parsial/InputField';
import { showToast } from '@js/utils';
import ediClient, { EDI_FSU_MESSAGE_DATATABLE_ENDPOINT } from '@lib/api/edi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';

const defaultForm = {
  code: '',
  remark: '',
  status: true,
};

const boolBadge = (value, type) => {
  if (type !== 'display') {
    return value;
  }

  const isTrue = value === true || value === 1 || value === '1' || value === 'true';
  const label = isTrue ? 'Aktif' : 'Nonaktif';
  const theme = isTrue ? 'bg-label-success' : 'bg-label-secondary';
  return `<span class="badge rounded-pill ${theme} px-2">${label}</span>`;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default function FsuMessageDatatables() {
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
    if (!payload.remark.trim()) validation.remark = 'Remark wajib diisi';
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
      await ediClient.createFsuMessage({
        code: form.code.trim(),
        remark: form.remark.trim(),
        status: form.status,
      });
      showToast({
        type: 'success',
        title: 'FSU Message',
        message: 'Data berhasil ditambahkan.',
      });
      setForm(defaultForm);
      reloadTable(true);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'FSU Message',
        message: err?.message ?? 'Gagal menambahkan data.',
      });
    } finally {
      setLoading(false);
    }
  }, [form, reloadTable, validateForm]);

  const openEditModal = useCallback(
    async (id) => {
      let record;
      try {
        record = await ediClient.getFsuMessage(id);
      } catch (err) {
        showToast({
          type: 'danger',
          title: 'FSU Message',
          message: err?.message ?? 'Gagal memuat data.',
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Edit FSU Message',
        html: `
          <div class="text-start">
            <div class="form-floating form-floating-outline mb-2">
              <input
                type="text"
                id="swal-code"
                class="form-control"
                placeholder="RCS"
                value="${escapeHtml(record.code)}"
              />
              <label for="swal-code">Kode</label>
            </div>
            <div class="form-floating form-floating-outline mb-2">
              <textarea
                id="swal-remark"
                class="form-control"
                placeholder="Received from Shipper"
                style="min-height: 90px;"
              >${escapeHtml(record.remark ?? '')}</textarea>
              <label for="swal-remark">Remark</label>
            </div>
            <div class="form-check mb-2">
              <input
                class="form-check-input"
                type="checkbox"
                id="swal-status"
                ${record.status ? 'checked' : ''}
              />
              <label class="form-check-label" for="swal-status">Aktif</label>
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
          const remark = popup?.querySelector('#swal-remark')?.value?.trim() ?? '';
          const status = Boolean(popup?.querySelector('#swal-status')?.checked);

          if (!code) {
            Swal.showValidationMessage('Kode wajib diisi');
            return undefined;
          }
          if (!remark) {
            Swal.showValidationMessage('Remark wajib diisi');
            return undefined;
          }

          try {
            await ediClient.updateFsuMessage(record.id, {
              code,
              remark,
              status,
            });
            return true;
          } catch (err) {
            Swal.showValidationMessage(err?.message ?? 'Gagal memperbarui data.');
            return undefined;
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });

      if (result.isConfirmed) {
        showToast({
          type: 'success',
          title: 'FSU Message',
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
        title: 'Hapus FSU Message?',
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
        await ediClient.deleteFsuMessage(id);
        showToast({
          type: 'success',
          title: 'FSU Message',
          message: 'Data berhasil dihapus.',
        });
        reloadTable(false);
      } catch (err) {
        showToast({
          type: 'danger',
          title: 'FSU Message',
          message: err?.message ?? 'Gagal menghapus data.',
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
      { data: 'remark', title: 'Remark', className: 'text-wrap' },
      {
        data: 'status',
        title: 'Status',
        className: 'text-center',
        render: (value, type) => boolBadge(value, type),
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
    return {
      order: [[codeIndex >= 0 ? codeIndex : 0, 'asc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
    };
  }, [columns]);

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Tambah FSU Message</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <InputField
                  label="Kode"
                  name="code"
                  placeholder="RCS"
                  value={form.code}
                  onChange={handleChange}
                  error={errors.code}
                />
              </div>
              <div className="col-md-7">
                <div className="form-floating form-floating-outline mb-3">
                  <textarea
                    id="input-remark"
                    className={`form-control ${errors.remark ? 'is-invalid' : ''}`}
                    name="remark"
                    placeholder="Received from Shipper"
                    style={{ minHeight: '90px' }}
                    value={form.remark}
                    onChange={handleChange}
                  />
                  <label htmlFor="input-remark">Remark</label>
                  {errors.remark && (
                    <div className="form-text text-danger mt-1">{errors.remark}</div>
                  )}
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-center">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="input-status"
                    name="status"
                    checked={form.status}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="input-status">
                    Aktif
                  </label>
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
                <h5 className="card-title text-secondary mb-1">Daftar FSU Message</h5>
                <div className="text-muted small">
                  Endpoint: {EDI_FSU_MESSAGE_DATATABLE_ENDPOINT}
                </div>
              </div>
            </div>
            <GridData
              ref={tableRef}
              columns={columns}
              ajaxEndpoint={EDI_FSU_MESSAGE_DATATABLE_ENDPOINT}
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
