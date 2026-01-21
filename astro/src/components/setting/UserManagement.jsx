import InputField from '@components/parsial/InputField';
import Spinner from '@components/parsial/Spinner';
import settingClient from '@lib/api/setting';
import { showToast } from '@js/utils';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const emptyCreateForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await settingClient.listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message ?? 'Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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
      await loadUsers();
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
      await loadUsers();
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
      await loadUsers();
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'User',
        message: err?.message ?? 'Gagal menghapus user.',
      });
    }
  };

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
            {loading ? (
              <Spinner />
            ) : error ? (
              <div className="alert alert-danger mb-0">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-muted">Belum ada user.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => openEditModal(user)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-info"
                              onClick={() => openPasswordModal(user)}
                            >
                              Password
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(user)}
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
