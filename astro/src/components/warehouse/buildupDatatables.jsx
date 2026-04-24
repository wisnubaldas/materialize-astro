import GridData from '@components/GridData';
import { showToast } from '@js/utils';
import { API_BASE_URL } from '@lib/api/client';
import warehouseClient, { WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT } from '@lib/api/warehouse';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const loadSwal = async () => {
  const module = await import('sweetalert2/dist/sweetalert2.esm.all.js');
  return module.default ?? module;
};

const SWEET_ALERT_Z_INDEX = 2000;

const numberRenderer = (value, type, fractionDigits = 0) => {
  if (type !== 'display' && type !== 'filter') {
    return value ?? null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  return numeric.toLocaleString('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const dateRenderer = (value, type, format = 'DD MMM YYYY') => {
  if (type !== 'display' && type !== 'filter') {
    return value;
  }

  if (!value) {
    return '';
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(format) : value;
};

const buildPublicUrl = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return value;
  }

  const base = API_BASE_URL?.replace(/\/+$/, '') ?? '';
  const path = String(value).replace(/^\/+/, '');
  return base ? `${base}/${path}` : `/${path}`;
};

const linkRenderer = (value, type, label = 'View') => {
  if (type !== 'display') {
    return value ?? '';
  }

  const url = buildPublicUrl(value);
  if (!url) {
    return '';
  }

  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const createDefaultFilters = () => ({
  number_build_up: '',
  airlines_code: '',
  flight_date: '',
  origin: '',
  dest: '',
});

const renderDetailHtml = (details) => {
  if (!Array.isArray(details) || !details.length) {
    return '<p class="mb-0 text-muted">Detail tidak ditemukan.</p>';
  }

  const rows = details
    .map((item, index) => {
      const pieces = Number.isFinite(Number(item?.pieces)) ? Number(item.pieces).toLocaleString('id-ID') : '-';
      const weight = Number.isFinite(Number(item?.weight))
        ? Number(item.weight).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '-';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item?.mawb || '-')}</td>
          <td>${escapeHtml(item?.uld_type || '-')}</td>
          <td>${escapeHtml(item?.uld_number || '-')}</td>
          <td class="text-end">${pieces}</td>
          <td class="text-end">${weight}</td>
          <td>${escapeHtml(item?.nature_of_goods || '-')}</td>
          <td>${escapeHtml(item?.remark || '-')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="table-responsive">
      <table class="table table-sm table-striped table-bordered align-middle mb-0">
        <thead>
          <tr>
            <th style="width:48px">No</th>
            <th>MAWB</th>
            <th>ULD Type</th>
            <th>ULD Number</th>
            <th class="text-end">Pieces</th>
            <th class="text-end">Weight</th>
            <th>Nature Of Goods</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
};

export default function BuildupDatatables() {
  const tableRef = useRef(null);
  const mountedRef = useRef(false);

  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [activeFilters, setActiveFilters] = useState(createDefaultFilters);

  useEffect(() => {
    const api = tableRef.current;
    if (!api?.reload) {
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    api.reload(true);
  }, [activeFilters]);

  useEffect(() => {
    const handleUploadSuccess = () => {
      tableRef.current?.reload?.(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('manifest-uploaded', handleUploadSuccess);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('manifest-uploaded', handleUploadSuccess);
      }
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = (event) => {
    event?.preventDefault?.();
    setActiveFilters({ ...formFilters });
  };

  const handleReset = () => {
    const reset = createDefaultFilters();
    setFormFilters(reset);
    setActiveFilters(reset);
  };

  const handleViewDetail = useCallback(async (headerId, numberBuildUp) => {
    if (!headerId) {
      return;
    }

    try {
      const details = await warehouseClient.manifestFlightDetail(headerId);
      const Swal = await loadSwal();
      await Swal.fire({
        title: `Detail Build Up ${numberBuildUp || ''}`,
        html: renderDetailHtml(details),
        width: '1100px',
        zIndex: SWEET_ALERT_Z_INDEX,
        confirmButtonText: 'Tutup',
        customClass: {
          htmlContainer: 'text-start',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat detail build up.';
      showToast({
        type: 'danger',
        title: 'Detail Build Up',
        message,
      });
    }
  }, []);

  const handleDeleteManifest = useCallback(async (headerId, numberBuildUp) => {
    if (!headerId) {
      return;
    }

    const titleLabel = numberBuildUp ? ` ${numberBuildUp}` : '';
    try {
      const Swal = await loadSwal();
      const result = await Swal.fire({
        title: `Hapus Build Up${titleLabel}?`,
        text: 'Data build up akan dihapus permanen.',
        icon: 'warning',
        zIndex: SWEET_ALERT_Z_INDEX,
        showCancelButton: true,
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal',
      });

      if (!result.isConfirmed) {
        return;
      }

      await warehouseClient.manifestFlightDelete(headerId);
      showToast({
        type: 'success',
        title: 'Build Up',
        message: 'Data build up berhasil dihapus.',
      });
      tableRef.current?.reload?.(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus data build up.';
      showToast({
        type: 'danger',
        title: 'Build Up',
        message,
      });
    }
  }, []);

  useEffect(() => {
    let containerRef = null;
    let clickHandlerRef = null;
    let intervalId = null;

    const attachHandler = () => {
      const api = tableRef.current?.dt?.();
      if (!api?.table) {
        return false;
      }

      const container = api.table().container();
      if (!container || containerRef === container) {
        return Boolean(containerRef);
      }

      const clickHandler = (event) => {
        const detailButton = event.target?.closest?.('button.js-view-detail');
        if (detailButton) {
          const headerId = Number(detailButton.getAttribute('data-header-id'));
          const numberBuildUp = detailButton.getAttribute('data-number-build-up') || '';
          if (!Number.isFinite(headerId)) {
            return;
          }

          void handleViewDetail(headerId, numberBuildUp);
          return;
        }

        const deleteButton = event.target?.closest?.('button.js-delete-manifest');
        if (deleteButton) {
          const headerId = Number(deleteButton.getAttribute('data-header-id'));
          const numberBuildUp = deleteButton.getAttribute('data-number-build-up') || '';
          if (!Number.isFinite(headerId)) {
            return;
          }

          void handleDeleteManifest(headerId, numberBuildUp);
        }
      };

      container.addEventListener('click', clickHandler);
      containerRef = container;
      clickHandlerRef = clickHandler;
      return true;
    };

    if (!attachHandler()) {
      intervalId = window.setInterval(() => {
        if (attachHandler() && intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 300);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (containerRef && clickHandlerRef) {
        containerRef.removeEventListener('click', clickHandlerRef);
      }
    };
  }, [handleDeleteManifest, handleViewDetail]);

  const columns = useMemo(
    () => [
      {
        data: 'number_build_up',
        title: 'Build Up No',
        className: 'text-uppercase',
        responsivePriority: 1,
      },
      { data: 'airlines_code', title: 'Airline', className: 'text-uppercase' },
      { data: 'origin', title: 'Origin', className: 'text-uppercase' },
      { data: 'dest', title: 'Destination', className: 'text-uppercase' },
      {
        data: 'flight_date',
        title: 'Flight Date',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type),
      },
      {
        data: 'total_pieces',
        title: 'Total Pieces',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type),
      },
      {
        data: 'total_weight',
        title: 'Total Weight',
        className: 'text-end',
        render: (value, type) => numberRenderer(value, type, 2),
      },
      { data: 'for_official_use', title: 'Official Use', className: 'text-uppercase' },
      {
        data: 'pdf_link',
        title: 'PDF',
        className: 'text-nowrap',
        render: (value, type) => linkRenderer(value, type, 'PDF'),
      },
      {
        data: 'create_at',
        title: 'Dibuat',
        className: 'text-nowrap',
        render: (value, type) => dateRenderer(value, type, 'DD MMM YYYY HH:mm'),
      },
      {
        data: null,
        title: 'Aksi',
        className: 'text-nowrap text-center',
        orderable: false,
        searchable: false,
        render: (_value, type, row) => {
          if (type !== 'display') {
            return '';
          }
          const headerId = row?.id ?? '';
          const numberBuildUp = escapeHtml(row?.number_build_up ?? '');
          return `
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-primary js-view-detail" data-header-id="${headerId}" data-number-build-up="${numberBuildUp}">
                Lihat Detail
              </button>
              <button type="button" class="btn btn-outline-danger js-delete-manifest" data-header-id="${headerId}" data-number-build-up="${numberBuildUp}">
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
    const createdAtIndex = findIndex('create_at');
    const numberTargets = ['total_pieces', 'total_weight']
      .map(findIndex)
      .filter((idx) => idx >= 0);

    const defs = [];
    if (numberTargets.length) {
      defs.push({ targets: numberTargets, className: 'text-end' });
    }

    return {
      order: [[createdAtIndex >= 0 ? createdAtIndex : 0, 'desc']],
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      columnDefs: defs,
    };
  }, [columns]);

  return (
    <div className="card shadow-none border-0">
      <div className="card-body pb-0">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h5 className="mb-1 fw-bold text-uppercase">Data Build Up (Master)</h5>
            <p className="mb-0 text-muted">
              Tabel menampilkan data header build up. Klik tombol Lihat Detail untuk melihat item detail.
            </p>
          </div>
          <div className="text-muted small">Menampilkan data build up yang sudah tersimpan di database.</div>
        </div>

        <form onSubmit={handleApply}>
          <div className="row g-2 mb-3">
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Build Up No</label>
              <input
                type="text"
                name="number_build_up"
                className="form-control"
                placeholder="BL12042026..."
                value={formFilters.number_build_up}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Airline</label>
              <input
                type="text"
                name="airlines_code"
                className="form-control"
                placeholder="FX"
                value={formFilters.airlines_code}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-2">
              <label className="form-label mb-1">Flight Date</label>
              <input
                type="date"
                name="flight_date"
                className="form-control"
                value={formFilters.flight_date}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-3">
              <label className="form-label mb-1">Origin</label>
              <input
                type="text"
                name="origin"
                className="form-control"
                placeholder="CGK"
                value={formFilters.origin}
                onChange={handleChange}
              />
            </div>
            <div className="col-sm-6 col-md-3">
              <label className="form-label mb-1">Destination</label>
              <input
                type="text"
                name="dest"
                className="form-control"
                placeholder="MEM"
                value={formFilters.dest}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="d-flex gap-2 mb-3">
            <button type="submit" className="btn btn-primary">
              Terapkan Filter
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="card-body pt-0">
        <GridData
          ref={tableRef}
          columns={columns}
          ajaxEndpoint={WAREHOUSE_MANIFEST_FLIGHT_DATATABLE_ENDPOINT}
          filters={activeFilters}
          options={tableOptions}
          className="table-bordered table-striped align-middle"
        />
      </div>
    </div>
  );
}
