import GridData from '@components/GridData';
import InputField from '@components/parsial/InputField';
import Spinner from '@components/parsial/Spinner';
import settingClient from '@lib/api/setting';
import { showToast } from '@utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import CardPages from '../ui/CardPages.jsx';
import { escapeHtml, normalizeCollection, resolveErrorMessage } from './shared';

const emptyMenuForm = {
  name: '',
  url: '',
  icon: '',
  parent: 0,
  role_id: null,
};

export default function MenuManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [menuErrors, setMenuErrors] = useState({});
  const [menuLoading, setMenuLoading] = useState(false);
  const tableRef = useRef(null);
  const rolesRef = useRef([]);

  const MENUS_DATATABLE_ENDPOINT = '/setting/menus/datatables';

  const reloadTable = useCallback((resetPaging = false) => {
    tableRef.current?.reload?.(resetPaging);
  }, []);

  const loadRoles = useCallback(async () => {
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
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    rolesRef.current = roles;
    const api = tableRef.current?.dt?.();
    if (api) {
      api.rows().invalidate().draw(false);
    }
  }, [roles]);

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

  const validateMenu = (payload) => {
    const errors = {};
    if (!payload.name.trim()) errors.name = 'Nama menu wajib diisi';
    if (!payload.url.trim()) errors.url = 'URL wajib diisi';
    return errors;
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
      reloadTable(true);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Menu',
        message: resolveErrorMessage(err, 'Gagal membuat menu.'),
      });
    } finally {
      setMenuLoading(false);
    }
  };

  // RBAC: role_id kosong berarti menu public (muncul untuk semua role).
  const buildRoleOptionsHtml = useCallback((selectedRoleId) => {
    const options = ['<option value="">Tanpa Role</option>'];
    (rolesRef.current ?? []).forEach((role) => {
      const selected = String(role.id) === String(selectedRoleId);
      options.push(
        `<option value="${escapeHtml(role.id)}"${selected ? ' selected' : ''}>${escapeHtml(
          role.role_name
        )}</option>`
      );
    });
    return options.join('');
  }, []);

  const openEditMenuModal = useCallback(async (menu) => {
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
          Swal.showValidationMessage(resolveErrorMessage(err, 'Gagal memperbarui menu.'));
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
      reloadTable(false);
    }
  }, [buildRoleOptionsHtml, reloadTable]);

  const handleDeleteMenu = useCallback(async (menu) => {
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
      reloadTable(false);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Menu',
        message: resolveErrorMessage(err, 'Gagal menghapus menu.'),
      });
    }
  }, [reloadTable]);

  const handleAssignRole = useCallback(async (menu, roleId) => {
    try {
      await settingClient.updateMenu(menu.id, { role_id: roleId });
      showToast({ type: 'success', title: 'Menu', message: 'Role menu diperbarui.' });
      reloadTable(false);
    } catch (err) {
      showToast({
        type: 'danger',
        title: 'Menu',
        message: resolveErrorMessage(err, 'Gagal mengubah role menu.'),
      });
    }
  }, [reloadTable]);

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

  const columns = useMemo(
    () => [
      { data: 'id', title: 'ID', className: 'text-nowrap' },
      { data: 'name', title: 'Menu', className: 'text-nowrap' },
      { data: 'url', title: 'URL' },
      { data: 'parent', title: 'Parent', className: 'text-nowrap' },
      {
        data: 'role_id',
        title: 'Role',
        orderable: false,
        searchable: false,
        render: (value, type) => {
          if (type !== 'display') {
            return value ?? '';
          }
          return `
            <select class="form-select form-select-sm" data-action="role">
              ${buildRoleOptionsHtml(value ?? '')}
            </select>
          `;
        },
      },
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
              <button type="button" class="btn btn-outline-danger" data-action="delete">
                Hapus
              </button>
            </div>
          `;
        },
      },
    ],
    [buildRoleOptionsHtml]
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
        openEditMenuModal(rowData);
      } else if (action === 'delete') {
        handleDeleteMenu(rowData);
      }
    };

    const handleChange = (event) => {
      const select = event.target?.closest?.('select[data-action="role"]');
      if (!select) {
        return;
      }
      const row = select.closest('tr');
      const rowData = resolveRowData(row);
      if (!rowData) {
        return;
      }
      const value = select.value;
      handleAssignRole(rowData, value ? Number(value) : null);
    };

    tableNode.addEventListener('click', handleClick);
    tableNode.addEventListener('change', handleChange);
    return () => {
      tableNode.removeEventListener('click', handleClick);
      tableNode.removeEventListener('change', handleChange);
    };
  }, [handleAssignRole, handleDeleteMenu, openEditMenuModal]);

  return (
    <div className="card shadow-sm border-0 overflow-hidden">
      <CardPages
        title="Menu Management"
        description="Kelola data menu dan hak akses menu secara realtime"
        icon="ri ri-menu-line"
      />

      <div className="card-body bg-light-50 border-bottom p-4">
        <h5 className="fw-semibold text-secondary mb-3 d-flex align-items-center gap-2">
          <i className="ri ri-add-box-line"></i> Tambah Menu Baru
        </h5>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMenuSubmit();
          }}
        >
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <InputField
                label="Nama Menu"
                name="name"
                placeholder="User Management"
                value={menuForm.name}
                onChange={handleMenuChange}
                error={menuErrors.name}
              />
            </div>
            <div className="col-12 col-md-3">
              <InputField
                label="URL"
                name="url"
                placeholder="/setting/user-management"
                value={menuForm.url}
                onChange={handleMenuChange}
                error={menuErrors.url}
              />
            </div>
            <div className="col-12 col-sm-4 col-md-2">
              <InputField
                label="Icon"
                name="icon"
                placeholder="ri ri-user-line"
                value={menuForm.icon}
                onChange={handleMenuChange}
                error={menuErrors.icon}
              />
            </div>
            <div className="col-12 col-sm-4 col-md-2">
              <InputField
                label="Parent ID"
                name="parent"
                type="number"
                placeholder="0"
                value={menuForm.parent}
                onChange={handleMenuChange}
                error={menuErrors.parent}
              />
            </div>
            <div className="col-12 col-sm-4 col-md-2">
              <div className="form-floating form-floating-outline mb-3">
                <select
                  className={`form-select ${menuErrors.role_id ? 'is-invalid' : ''}`}
                  id="input-role"
                  name="role_id"
                  value={menuForm.role_id ?? ''}
                  onChange={handleMenuChange}
                >
                  {renderRoleOptions()}
                </select>
                <label htmlFor="input-role">Role Akses</label>
                {menuErrors.role_id && <div className="form-text text-danger mt-1">{menuErrors.role_id}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => {
                setMenuForm(emptyMenuForm);
                setMenuErrors({});
              }}
            >
              <i className="ri ri-refresh-line"></i> Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-1 shadow-sm"
              disabled={menuLoading}
            >
              <i className="ri ri-save-line"></i> {menuLoading ? 'Menyimpan...' : 'Simpan Menu'}
            </button>
          </div>
        </form>
      </div>

      <div className="card-body p-4">
        <h5 className="fw-semibold text-secondary mb-3 d-flex align-items-center gap-2">
          <i className="ri ri-menu-line"></i> Daftar Menu
        </h5>
        {loading ? <Spinner /> : null}
        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
        <div className="table-responsive">
          <GridData
            ref={tableRef}
            columns={columns}
            ajaxEndpoint={MENUS_DATATABLE_ENDPOINT}
            filters={{}}
            options={tableOptions}
            className="table-bordered table-striped align-middle"
          />
        </div>
      </div>
    </div>
  );
}



