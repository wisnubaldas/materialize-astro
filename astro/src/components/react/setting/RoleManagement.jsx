import InputField from '@components/parsial/InputField';
import Spinner from '@components/parsial/Spinner';
import settingClient from '@lib/api/setting';
import { showToast } from '@utils';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { escapeHtml, normalizeCollection, resolveErrorMessage } from './shared';
import CardPages from '../ui/CardPages.jsx';

const emptyRoleForm = {
  role_name: '',
};

/**
 * RoleManagement component.
 * Provides UI for managing user roles, creating new roles, editing role names, and deleting roles.
 *
 * @returns {React.JSX.Element} The rendered RoleManagement component.
 */
export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [roleErrors, setRoleErrors] = useState({});
  const [roleLoading, setRoleLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rolesData = await settingClient.listRoles();
      setRoles(normalizeCollection(rolesData));
    } catch (err) {
      setError(resolveErrorMessage(err, 'Gagal memuat data role.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = (e) => {
    setRoleForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateRole = (payload) => {
    const errors = {};
    if (!payload.role_name.trim()) errors.role_name = 'Nama role wajib diisi';
    return errors;
  };

  const handleRoleSubmit = async () => {
    const errors = validateRole(roleForm);
    setRoleErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRoleLoading(true);
    try {
      await settingClient.createRole({ role_name: roleForm.role_name.trim() });
      showToast({ type: 'success', title: 'Role', message: 'Role berhasil dibuat.' });
      setRoleForm(emptyRoleForm);
      await loadData();
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Role',
        message: resolveErrorMessage(err, 'Gagal membuat role.'),
      });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteRole = useCallback(async (role) => {
    const result = await Swal.fire({
      title: 'Hapus role?',
      text: `Role ${role.role_name} akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    try {
      await settingClient.deleteRole(role.id);
      showToast({ type: 'success', title: 'Role', message: 'Role berhasil dihapus.' });
      await loadData();
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Role',
        message: resolveErrorMessage(err, 'Gagal menghapus role.'),
      });
    }
  }, [loadData]);

  const openEditRoleModal = useCallback(async (role) => {
    const result = await Swal.fire({
      title: 'Edit Role',
      html: `
        <div class="text-start">
          <div class="form-floating form-floating-outline mb-2">
            <input
              type="text"
              id="swal-role-name"
              class="form-control"
              placeholder="admin"
              value="${escapeHtml(role.role_name)}"
            />
            <label for="swal-role-name">Nama Role</label>
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
        const roleName = popup?.querySelector('#swal-role-name')?.value?.trim() ?? '';

        if (!roleName) {
          Swal.showValidationMessage('Nama role wajib diisi');
          return undefined;
        }

        try {
          await settingClient.updateRole(role.id, { role_name: roleName });
          return roleName;
        } catch (err) {
          Swal.showValidationMessage(resolveErrorMessage(err, 'Gagal memperbarui role.'));
          return undefined;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen: () => {
        const input = Swal.getPopup()?.querySelector('#swal-role-name');
        if (input) {
          input.focus();
        }
      },
    });

    if (result.isConfirmed) {
      showToast({ type: 'success', title: 'Role', message: 'Role berhasil diperbarui.' });
      await loadData();
    }
  }, [loadData]);

  return (
    <div className="card shadow-sm border-0 overflow-hidden">
      <CardPages
        title="Role Management"
        description="Kelola data role user operasional secara realtime"
        icon="ri ri-shield-user-line"
      />

      <div className="card-body bg-light-50 border-bottom p-4">
        <h5 className="fw-semibold text-secondary mb-3 d-flex align-items-center gap-2">
          <i className="ri ri-shield-keyhole-line"></i> Tambah Role Baru
        </h5>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRoleSubmit();
          }}
        >
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4 col-lg-3">
              <InputField
                label="Nama Role"
                name="role_name"
                placeholder="admin"
                value={roleForm.role_name}
                onChange={handleRoleChange}
                error={roleErrors.role_name}
              />
            </div>
            <div className="col-12 col-md-8 col-lg-9 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => {
                  setRoleForm(emptyRoleForm);
                  setRoleErrors({});
                }}
              >
                <i className="ri ri-refresh-line"></i> Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-1 shadow-sm"
                disabled={roleLoading}
              >
                <i className="ri ri-save-line"></i> {roleLoading ? 'Menyimpan...' : 'Simpan Role'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card-body p-4">
        <h5 className="fw-semibold text-secondary mb-3 d-flex align-items-center gap-2">
          <i className="ri ri-shield-user-line"></i> Daftar Role
        </h5>
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : roles.length === 0 ? (
          <div className="text-muted">Belum ada role.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Nama Role</th>
                  <th className="text-end" style={{ width: '180px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.id}</td>
                    <td>
                      <span className="badge bg-label-primary px-3 py-2 rounded-2 fw-semibold">
                        {role.role_name}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-warning d-flex align-items-center gap-1"
                          onClick={() => openEditRoleModal(role)}
                        >
                          <i className="ri ri-edit-box-line"></i> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger d-flex align-items-center gap-1"
                          onClick={() => handleDeleteRole(role)}
                        >
                          <i className="ri ri-delete-bin-line"></i> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
