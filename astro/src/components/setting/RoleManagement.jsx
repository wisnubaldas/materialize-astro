import InputField from '@components/parsial/InputField';
import Spinner from '@components/parsial/Spinner';
import settingClient from '@lib/api/setting';
import { showToast } from '@js/utils';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const emptyRoleForm = {
  role_name: '',
};

const emptyMenuForm = {
  name: '',
  url: '',
  icon: '',
  parent: 0,
  role_id: null,
};

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [roleErrors, setRoleErrors] = useState({});
  const [roleLoading, setRoleLoading] = useState(false);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [menuErrors, setMenuErrors] = useState({});
  const [menuLoading, setMenuLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesData, menusData] = await Promise.all([
        settingClient.listRoles(),
        settingClient.listMenus(),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setMenus(Array.isArray(menusData) ? menusData : []);
    } catch (err) {
      setError(err?.message ?? 'Gagal memuat data role dan menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = (e) => {
    setRoleForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMenuChange = (e) => {
    const { name, value } = e.target;
    if (name === 'parent') {
      const parsed = Number(value);
      setMenuForm((prev) => ({ ...prev, parent: Number.isNaN(parsed) ? 0 : parsed }));
      return;
    }
    if (name === 'role_id') {
      setMenuForm((prev) => ({ ...prev, role_id: value ? Number(value) : null }));
      return;
    }
    setMenuForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateRole = (payload) => {
    const errors = {};
    if (!payload.role_name.trim()) errors.role_name = 'Nama role wajib diisi';
    return errors;
  };

  const validateMenu = (payload) => {
    const errors = {};
    if (!payload.name.trim()) errors.name = 'Nama menu wajib diisi';
    if (!payload.url.trim()) errors.url = 'URL wajib diisi';
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
        message: err?.message ?? 'Gagal membuat role.',
      });
    } finally {
      setRoleLoading(false);
    }
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const handleDeleteRole = async (role) => {
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
        message: err?.message ?? 'Gagal menghapus role.',
      });
    }
  };

  const handleMenuSubmit = async () => {
    const errors = validateMenu(menuForm);
    setMenuErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setMenuLoading(true);
    try {
      await settingClient.createMenu({
        name: menuForm.name.trim(),
        url: menuForm.url.trim(),
        icon: menuForm.icon.trim(),
        parent: menuForm.parent || 0,
        role_id: menuForm.role_id ?? null,
      });
      showToast({ type: 'success', title: 'Menu', message: 'Menu berhasil dibuat.' });
      setMenuForm(emptyMenuForm);
      await loadData();
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Menu',
        message: err?.message ?? 'Gagal membuat menu.',
      });
    } finally {
      setMenuLoading(false);
    }
  };

  const buildRoleOptionsHtml = (selectedRoleId) => {
    const options = ['<option value="">Tanpa Role</option>'];
    roles.forEach((role) => {
      const selected = String(role.id) === String(selectedRoleId);
      options.push(
        `<option value="${escapeHtml(role.id)}"${selected ? ' selected' : ''}>${escapeHtml(
          role.role_name
        )}</option>`
      );
    });
    return options.join('');
  };

  const openEditRoleModal = async (role) => {
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
          Swal.showValidationMessage(err?.message ?? 'Gagal memperbarui role.');
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
  };

  const openEditMenuModal = async (menu) => {
    const result = await Swal.fire({
      title: 'Edit Menu',
      html: `
        <div class="text-start">
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="text"
              id="swal-menu-name"
              class="form-control"
              placeholder="User Management"
              value="${escapeHtml(menu.name)}"
            />
            <label for="swal-menu-name">Nama Menu</label>
          </div>
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="text"
              id="swal-menu-url"
              class="form-control"
              placeholder="/setting/user-management"
              value="${escapeHtml(menu.url)}"
            />
            <label for="swal-menu-url">URL</label>
          </div>
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="text"
              id="swal-menu-icon"
              class="form-control"
              placeholder="ri ri-user-line"
              value="${escapeHtml(menu.icon ?? '')}"
            />
            <label for="swal-menu-icon">Icon</label>
          </div>
          <div class="form-floating form-floating-outline mb-3">
            <input
              type="number"
              id="swal-menu-parent"
              class="form-control"
              placeholder="0"
              value="${escapeHtml(menu.parent ?? 0)}"
              min="0"
            />
            <label for="swal-menu-parent">Parent ID</label>
          </div>
          <div class="form-floating form-floating-outline mb-2">
            <select class="form-select" id="swal-menu-role">
              ${buildRoleOptionsHtml(menu.role_id ?? '')}
            </select>
            <label for="swal-menu-role">Role Akses</label>
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
        const name = popup?.querySelector('#swal-menu-name')?.value?.trim() ?? '';
        const url = popup?.querySelector('#swal-menu-url')?.value?.trim() ?? '';
        const icon = popup?.querySelector('#swal-menu-icon')?.value?.trim() ?? '';
        const parentRaw = popup?.querySelector('#swal-menu-parent')?.value ?? '0';
        const roleValue = popup?.querySelector('#swal-menu-role')?.value ?? '';
        const parent = Number(parentRaw);
        const resolvedParent = Number.isNaN(parent) ? 0 : parent;
        const roleId = roleValue ? Number(roleValue) : null;

        if (!name) {
          Swal.showValidationMessage('Nama menu wajib diisi');
          return undefined;
        }
        if (!url) {
          Swal.showValidationMessage('URL wajib diisi');
          return undefined;
        }
        if (resolvedParent < 0) {
          Swal.showValidationMessage('Parent ID tidak valid');
          return undefined;
        }

        try {
          await settingClient.updateMenu(menu.id, {
            name,
            url,
            icon,
            parent: resolvedParent,
            role_id: roleId,
          });
          return true;
        } catch (err) {
          Swal.showValidationMessage(err?.message ?? 'Gagal memperbarui menu.');
          return undefined;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      didOpen: () => {
        const input = Swal.getPopup()?.querySelector('#swal-menu-name');
        if (input) {
          input.focus();
        }
      },
    });

    if (result.isConfirmed) {
      showToast({ type: 'success', title: 'Menu', message: 'Menu berhasil diperbarui.' });
      await loadData();
    }
  };

  const handleDeleteMenu = async (menu) => {
    const result = await Swal.fire({
      title: 'Hapus menu?',
      text: `Menu ${menu.name} akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    try {
      await settingClient.deleteMenu(menu.id);
      showToast({ type: 'success', title: 'Menu', message: 'Menu berhasil dihapus.' });
      await loadData();
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Menu',
        message: err?.message ?? 'Gagal menghapus menu.',
      });
    }
  };

  const handleAssignRole = async (menu, roleId) => {
    try {
      await settingClient.updateMenu(menu.id, { role_id: roleId });
      setMenus((prev) =>
        prev.map((item) => (item.id === menu.id ? { ...item, role_id: roleId } : item))
      );
      showToast({ type: 'success', title: 'Menu', message: 'Role menu diperbarui.' });
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Menu',
        message: err?.message ?? 'Gagal mengubah role menu.',
      });
    }
  };

  const renderRoleOptions = () => (
    <>
      <option value="">Tanpa Role</option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.role_name}
        </option>
      ))}
    </>
  );

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

      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Tambah Menu</h5>
            <div className="row g-4">
              <div className="col-md-6">
                <InputField
                  label="Nama Menu"
                  name="name"
                  placeholder="User Management"
                  value={menuForm.name}
                  onChange={handleMenuChange}
                  error={menuErrors.name}
                />
              </div>
              <div className="col-md-6">
                <InputField
                  label="URL"
                  name="url"
                  placeholder="/setting/user-management"
                  value={menuForm.url}
                  onChange={handleMenuChange}
                  error={menuErrors.url}
                />
              </div>
              <div className="col-md-4">
                <InputField
                  label="Icon"
                  name="icon"
                  placeholder="ri ri-user-line"
                  value={menuForm.icon}
                  onChange={handleMenuChange}
                  error={menuErrors.icon}
                />
              </div>
              <div className="col-md-4">
                <div className="form-floating form-floating-outline mb-3">
                  <input
                    type="number"
                    className="form-control"
                    id="input-parent"
                    name="parent"
                    value={menuForm.parent}
                    onChange={handleMenuChange}
                    placeholder="0"
                  />
                  <label htmlFor="input-parent">Parent ID</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-floating form-floating-outline mb-3">
                  <select
                    className="form-select"
                    id="input-role"
                    name="role_id"
                    value={menuForm.role_id ?? ''}
                    onChange={handleMenuChange}
                  >
                    {renderRoleOptions()}
                  </select>
                  <label htmlFor="input-role">Role Akses</label>
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary mt-2"
              type="button"
              onClick={handleMenuSubmit}
              disabled={menuLoading}
            >
              {menuLoading ? 'Menyimpan...' : 'Simpan Menu'}
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card shadow-none border border-secondary">
          <div className="card-body">
            <h5 className="card-title text-secondary">Daftar Menu</h5>
            {loading ? (
              <Spinner />
            ) : error ? (
              <div className="alert alert-danger mb-0">{error}</div>
            ) : menus.length === 0 ? (
              <div className="text-muted">Belum ada menu.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Menu</th>
                      <th>URL</th>
                      <th>Parent</th>
                      <th>Role</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map((menu) => (
                      <tr key={menu.id}>
                        <td>{menu.id}</td>
                        <td>{menu.name}</td>
                        <td>{menu.url}</td>
                        <td>{menu.parent}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={menu.role_id ?? ''}
                            onChange={(e) =>
                              handleAssignRole(menu, e.target.value ? Number(e.target.value) : null)
                            }
                          >
                            {renderRoleOptions()}
                          </select>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => openEditMenuModal(menu)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteMenu(menu)}
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
