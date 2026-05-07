import GridData from '@components/GridData';
import InputField from '@components/parsial/InputField';
import Spinner from '@components/parsial/Spinner';
import settingClient from '@lib/api/setting';
import { showToast } from '@js/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';

const emptyCreateForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function UserManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const tableRef = useRef(null);

  const USERS_DATATABLE_ENDPOINT = '/setting/users/datatables';

  const reloadTable = useCallback((resetPaging = false) => {
    tableRef.current?.reload?.(resetPaging);
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await settingClient.listRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setRoles([]);
      setError(err?.message ?? 'Gagal memuat data role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateChange = (e) => {
    setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateCreate = () => {
    const errors = {};
    if (!createForm.username.trim()) errors.username = 'Username wajib diisi';
    if (!createForm.email.trim()) errors.email = 'Email wajib diisi';
    if (!createForm.password) errors.password = 'Password wajib diisi';
    if (createForm.password && createForm.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    if (createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password tidak cocok';
    }
    return errors;
  };

  const handleCreateSubmit = async () => {
    const errors = validateCreate();
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCreateLoading(true);
    try {
      await settingClient.createUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
      });
      showToast({ type: 'success', title: 'User', message: 'User berhasil dibuat.' });
      setCreateForm(emptyCreateForm);
      reloadTable(true);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'User',
        message: err?.message ?? 'Gagal membuat user.',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const openEditModal = async (user) => {
    const result = await Swal.fire({
      title: 'Edit User',
      html: `
        <div class="text-start">
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="text"
              id="swal-username"
              class="form-control"
              placeholder="username"
              value="${escapeHtml(user.username)}"
            />
            <label for="swal-username">Username</label>
          </div>
          <div class="form-floating form-floating-outline mb-2">
            <input
              type="email"
              id="swal-email"
              class="form-control"
              placeholder="user@mail.com"
              value="${escapeHtml(user.email)}"
            />
            <label for="swal-email">Email</label>
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
        const username = popup?.querySelector('#swal-username')?.value?.trim() ?? '';
        const email = popup?.querySelector('#swal-email')?.value?.trim() ?? '';

        if (!username) {
          Swal.showValidationMessage('Username wajib diisi');
          return undefined;
        }
        if (!email) {
          Swal.showValidationMessage('Email wajib diisi');
          return undefined;
        }

        try {
          await settingClient.updateUser(user.id, { username, email });
          return { username, email };
        } catch (err) {
          Swal.showValidationMessage(err?.message ?? 'Gagal memperbarui user.');
          return undefined;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen: () => {
        const input = Swal.getPopup()?.querySelector('#swal-username');
        if (input) {
          input.focus();
        }
      },
    });

    if (result.isConfirmed) {
      showToast({ type: 'success', title: 'User', message: 'User berhasil diperbarui.' });
      reloadTable(false);
    }
  };

  const openPasswordModal = async (user) => {
    const result = await Swal.fire({
      title: `Ubah Password`,
      html: `
        <div class="text-start">
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="password"
              id="swal-current-password"
              class="form-control"
              placeholder="******"
            />
            <label for="swal-current-password">Password Lama (opsional)</label>
          </div>
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="password"
              id="swal-new-password"
              class="form-control"
              placeholder="******"
            />
            <label for="swal-new-password">Password Baru</label>
          </div>
          <div class="form-floating form-floating-outline mb-2">
            <input
              type="password"
              id="swal-confirm-password"
              class="form-control"
              placeholder="******"
            />
            <label for="swal-confirm-password">Konfirmasi Password</label>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update Password',
      cancelButtonText: 'Batal',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const popup = Swal.getPopup();
        const currentPassword =
          popup?.querySelector('#swal-current-password')?.value?.trim() ?? '';
        const newPassword = popup?.querySelector('#swal-new-password')?.value ?? '';
        const confirmPassword = popup?.querySelector('#swal-confirm-password')?.value ?? '';

        if (!newPassword) {
          Swal.showValidationMessage('Password baru wajib diisi');
          return undefined;
        }
        if (newPassword.length < 6) {
          Swal.showValidationMessage('Password minimal 6 karakter');
          return undefined;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Konfirmasi password tidak cocok');
          return undefined;
        }

        try {
          await settingClient.updateUserPassword(user.id, {
            current_password: currentPassword || undefined,
            new_password: newPassword,
          });
          return true;
        } catch (err) {
          Swal.showValidationMessage(err?.message ?? 'Gagal mengubah password.');
          return undefined;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen: () => {
        const input = Swal.getPopup()?.querySelector('#swal-new-password');
        if (input) {
          input.focus();
        }
      },
    });

    if (result.isConfirmed) {
      showToast({ type: 'success', title: 'User', message: 'Password berhasil diubah.' });
    }
  };

  const ensureRolesLoaded = async () => {
    if (roles.length > 0) {
      return roles;
    }
    const data = await settingClient.listRoles();
    const resolved = Array.isArray(data) ? data : [];
    setRoles(resolved);
    return resolved;
  };

  // RBAC: atur relasi user <-> role di backend (tabel user_roles).
  const openRoleModal = async (user) => {
    try {
      const [rolesData, userRoles] = await Promise.all([
        ensureRolesLoaded(),
        settingClient.listUserRoles(user.id),
      ]);

      const selectedIds = new Set(
        Array.isArray(userRoles) ? userRoles.map((role) => role.id) : []
      );

      const rolesHtml =
        rolesData.length > 0
          ? rolesData
              .map(
                (role) => `
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="role-${escapeHtml(role.id)}"
                  name="role_ids"
                  value="${escapeHtml(role.id)}"
                  ${selectedIds.has(role.id) ? 'checked' : ''}
                />
                <label class="form-check-label" for="role-${escapeHtml(role.id)}">
                  ${escapeHtml(role.role_name)}
                </label>
              </div>
            `
              )
              .join('')
          : '<div class="text-muted">Belum ada role. Buat role terlebih dahulu.</div>';

      const result = await Swal.fire({
        title: `Atur Role`,
        html: `<div class="text-start">${rolesHtml}</div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          const popup = Swal.getPopup();
          const checked = Array.from(
            popup?.querySelectorAll('input[name="role_ids"]:checked') ?? []
          ).map((input) => Number(input.value));

          try {
            await settingClient.updateUserRoles(user.id, { role_ids: checked });
            return true;
          } catch (err) {
            Swal.showValidationMessage(err?.message ?? 'Gagal memperbarui role user.');
            return undefined;
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });

      if (result.isConfirmed) {
        showToast({ type: 'success', title: 'User', message: 'Role user diperbarui.' });
      }
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'User',
        message: err?.message ?? 'Gagal memuat data role.',
      });
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: 'Hapus user?',
      text: `User ${user.username} akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    try {
      await settingClient.deleteUser(user.id);
      showToast({ type: 'success', title: 'User', message: 'User berhasil dihapus.' });
      reloadTable(false);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'User',
        message: err?.message ?? 'Gagal menghapus user.',
      });
    }
  };

  const columns = useMemo(
    () => [
      { data: 'id', title: 'ID', className: 'text-nowrap' },
      { data: 'username', title: 'Username' },
      { data: 'email', title: 'Email' },
      {
        data: null,
        title: 'Aksi',
        orderable: false,
        searchable: false,
        className: 'text-end text-nowrap',
        render: (_value, type) => {
          if (type !== 'display') {
            return '';
          }
          return `
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-warning" data-action="edit">
                Edit
              </button>
              <button type="button" class="btn btn-outline-secondary" data-action="role">
                Role
              </button>
              <button type="button" class="btn btn-outline-info" data-action="password">
                Password
              </button>
              <button type="button" class="btn btn-outline-danger" data-action="delete">
                Hapus
              </button>
            </div>
          `;
        },
      },
    ],
    []
  );

  const tableOptions = useMemo(
    () => ({
      order: [[0, 'asc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
    }),
    []
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

    const resolveRowData = (rowElement) => {
      if (!rowElement) {
        return null;
      }
      const isChild = rowElement.classList?.contains('child');
      const parentRow = isChild ? rowElement.previousSibling : rowElement;
      return parentRow ? api.row(parentRow).data() : null;
    };

    const handleClick = (event) => {
      const button = event.target?.closest?.('button[data-action]');
      if (!button) {
        return;
      }

      const action = button.getAttribute('data-action');
      const row = button.closest('tr');
      const rowData = resolveRowData(row);
      if (!rowData) {
        return;
      }

      if (action === 'edit') {
        openEditModal(rowData);
      } else if (action === 'role') {
        openRoleModal(rowData);
      } else if (action === 'password') {
        openPasswordModal(rowData);
      } else if (action === 'delete') {
        handleDelete(rowData);
      }
    };

    tableNode.addEventListener('click', handleClick);
    return () => {
      tableNode.removeEventListener('click', handleClick);
    };
  }, [handleDelete, openEditModal, openPasswordModal, openRoleModal]);

  return (
    <div className="row g-6">
      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Tambah User</h5>
            <div className="row g-4">
              <div className="col-md-6">
                <InputField
                  label="Username"
                  name="username"
                  placeholder="username"
                  value={createForm.username}
                  onChange={handleCreateChange}
                  error={createErrors.username}
                />
              </div>
              <div className="col-md-6">
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="user@mail.com"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  error={createErrors.email}
                />
              </div>
              <div className="col-md-6">
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="******"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  error={createErrors.password}
                />
              </div>
              <div className="col-md-6">
                <InputField
                  label="Konfirmasi Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="******"
                  value={createForm.confirmPassword}
                  onChange={handleCreateChange}
                  error={createErrors.confirmPassword}
                />
              </div>
            </div>
            <button
              className="btn btn-primary mt-2"
              type="button"
              onClick={handleCreateSubmit}
              disabled={createLoading}
            >
              {createLoading ? 'Menyimpan...' : 'Simpan User'}
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Daftar User</h5>
            {loading ? <Spinner /> : null}
            {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
            <GridData
              ref={tableRef}
              columns={columns}
              ajaxEndpoint={USERS_DATATABLE_ENDPOINT}
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


