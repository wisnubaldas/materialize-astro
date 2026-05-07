import InputField from '@components/parsial/InputField';
import Spinner from '@components/parsial/Spinner';
import settingClient from '@lib/api/setting';
import { showToast } from '@utils';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { escapeHtml, normalizeCollection, resolveErrorMessage } from './shared';

const emptyRoleForm = {
  role_name: '',
};

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
    <div className="row g-6">
      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Tambah Role</h5>
            <div className="row g-4">
              <div className="col-md-6">
                <InputField
                  label="Nama Role"
                  name="role_name"
                  placeholder="admin"
                  value={roleForm.role_name}
                  onChange={handleRoleChange}
                  error={roleErrors.role_name}
                />
              </div>
            </div>
            <button
              className="btn btn-primary mt-2"
              type="button"
              onClick={handleRoleSubmit}
              disabled={roleLoading}
            >
              {roleLoading ? 'Menyimpan...' : 'Simpan Role'}
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Daftar Role</h5>
            {loading ? (
              <Spinner />
            ) : error ? (
              <div className="alert alert-danger mb-0">{error}</div>
            ) : roles.length === 0 ? (
              <div className="text-muted">Belum ada role.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Role</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td>{role.id}</td>
                        <td>{role.role_name}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => openEditRoleModal(role)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteRole(role)}
                            >
                              Hapus
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
      </div>
    </div>
  );
}



