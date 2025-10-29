import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import DataTable from 'datatables.net-react';
import DataTablesCore from 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css';
import { apiClient } from '@lib/api/client';

// Registrasi adaptor DataTables agar komponen React tahu harus pakai skin Bootstrap 5.
DataTable.use(DataTablesCore);

const TABLE_COMPONENT_STYLES = `
.table_component {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background-color: #ffffff;
}

.table_component caption {
  caption-side: top;
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
}

.table_component th,
.table_component td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #68686dab;
  vertical-align: top;
  text-align: left;
}

.table_component th {
  color: #0a0a0a;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
`;

const GridData = forwardRef(
  ({ columns = [], data, ajaxEndpoint, filters, options, className = '', ...rest }, ref) => {
    // Simpan objek DataTable agar dapat diakses komponen induk.
    const tableRef = useRef(null);
    // Ref untuk payload filter/ data agar tidak memicu re-render DataTable.
    const filtersRef = useRef(filters ?? {});
    const clientDataRef = useRef(Array.isArray(data) ? data : []);
    const [responsiveModalDisplay, setResponsiveModalDisplay] = useState(null);

    // Sinkronkan perubahan filter dari luar ke ref.
    useEffect(() => {
      filtersRef.current = filters ?? {};
    }, [filters]);

    // Sinkronkan perubahan data client-side (non serverSide).
    useEffect(() => {
      clientDataRef.current = Array.isArray(data) ? data : [];
    }, [data]);

    useEffect(() => {
      if (typeof document === 'undefined') {
        return;
      }

      const styleId = 'grid-data-responsive-table-component';
      if (document.getElementById(styleId)) {
        return;
      }

      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = TABLE_COMPONENT_STYLES;
      document.head.appendChild(styleTag);
    }, []);

    // Ekspos helper dt() dan reload() melalui ref ke parent.
    useImperativeHandle(
      ref,
      () => ({
        dt: () => tableRef.current?.dt(),
        reload: (resetPaging = false) => {
          const api = tableRef.current?.dt();
          if (api?.ajax?.reload) {
            api.ajax.reload(null, resetPaging);
          }
        },
      }),
      []
    );

    useEffect(() => {
      let isActive = true;

      const ensureResponsiveModalDisplay = async () => {
        if (typeof window === 'undefined') {
          return;
        }

        const modalFactory = DataTablesCore?.Responsive?.display?.modal;

        if (typeof modalFactory !== 'function') {
          return;
        }

        const applyBootstrap = (bootstrapLib) => {
          if (!bootstrapLib?.Modal) {
            return null;
          }

          try {
            if (typeof DataTablesCore?.use === 'function') {
              DataTablesCore.use('bootstrap', bootstrapLib);
            }
          } catch {
            // no-op: `.use` may throw if unavailable, fallback to global
          }

          if (typeof DataTablesCore?.Responsive?.bootstrap === 'function') {
            DataTablesCore.Responsive.bootstrap(bootstrapLib);
          }

          if (!window.bootstrap) {
            window.bootstrap = bootstrapLib;
          }

          return bootstrapLib;
        };

        let bootstrapLib = applyBootstrap(DataTablesCore?.use?.('bootstrap'));

        if (!bootstrapLib) {
          bootstrapLib = applyBootstrap(window.bootstrap);
        }

        if (!bootstrapLib) {
          try {
            const module = await import('bootstrap');
            const candidate = module?.Modal
              ? module
              : module?.default && module.default.Modal
              ? module.default
              : null;

            bootstrapLib = applyBootstrap(candidate);
          } catch (error) {
            console.error('Failed to load Bootstrap for DataTables responsive modal:', error);
            return;
          }
        }

        if (!bootstrapLib || !isActive) {
          return;
        }

        const displayFactory = modalFactory({
          header: function (row) {
            const data = row.data();
            return 'Details of ' + (data?.full_name ?? '');
          },
        });

        if (isActive) {
          setResponsiveModalDisplay(() => displayFactory);
        }
      };

      ensureResponsiveModalDisplay();

      return () => {
        isActive = false;
      };
    }, []);
    const normalizedColumns = useMemo(
      () =>
        columns.map((column) => {
          // Pastikan setiap kolom memiliki judul fallback supaya header tidak kosong.
          const { title, data: columnData, ...rest } = column;
          return {
            data: columnData,
            title: title ?? columnData ?? '',
            ...rest,
          };
        }),
      [columns]
    );

    const ajaxHandler = useCallback(
      async (request, callback) => {
        // Mode client-side: cukup kembalikan data dari prop.
        if (!ajaxEndpoint) {
          callback({
            draw: request?.draw ?? 0,
            recordsTotal: clientDataRef.current.length,
            recordsFiltered: clientDataRef.current.length,
            data: clientDataRef.current,
          });
          return;
        }

        try {
          // Kompos payload sesuai struktur DataTables + filter tambahan.
          const payload = {
            ...request,
            filters: filtersRef.current ?? request?.filters ?? {},
          };
          const response = await apiClient.post(ajaxEndpoint, payload);

          callback({
            draw: response.draw ?? request?.draw ?? 0,
            recordsTotal: response.recordsTotal ?? 0,
            recordsFiltered: response.recordsFiltered ?? 0,
            data: response.data ?? [],
          });
        } catch (error) {
          const message = error?.message?.toLowerCase?.() ?? '';
          const isAbortError =
            error?.name === 'AbortError' ||
            (typeof DOMException !== 'undefined' &&
              error instanceof DOMException &&
              error.name === 'AbortError') ||
            message.includes('aborted') ||
            message.includes('abort') ||
            message.includes('networkerror when attempting to fetch resource') ||
            message.includes('failed to fetch');

          if (!isAbortError) {
            console.error('Failed to load table data:', error);
          }

          callback({
            draw: request?.draw ?? 0,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });
        }
      },
      [ajaxEndpoint]
    );

    const tableOptions = useMemo(() => {
      // Mulai dari opsi default lalu merge opsi tambahan dari prop.
      const overrides = options ?? {};

      const responsiveDetails = {
        type: 'column',
        renderer: function (api, rowIdx, columns) {
          const hiddenColumns = columns.filter((col) => col.hidden && col.title !== '');

          if (hiddenColumns.length === 0) {
            return false;
          }

          let headerRow = '';
          let dataRow = '';
          let rowsHtml = '';
          let groupCount = 0;

          hiddenColumns.forEach((col, index) => {
            headerRow += `<th class="bg-label-primary">${col.title}</th>`;
            dataRow += `<td class="bg-transparent">${col.data ?? ''}</td>`;
            groupCount += 1;

            const isGroupEnd = groupCount === 5 || index === hiddenColumns.length - 1;

            if (isGroupEnd) {
              rowsHtml += `<tr>${headerRow}</tr><tr>${dataRow}</tr>`;
              headerRow = '';
              dataRow = '';
              groupCount = 0;
            }
          });

          if (!rowsHtml) {
            return false;
          }

          return `
            <div class="table-responsive">
              <table class="table table-striped border-secondary table_component">
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          `.trim();
        },
      };

      if (responsiveModalDisplay) {
        responsiveDetails.display = responsiveModalDisplay;
      }

      const baseOptions = {
        // responsive: true,
        responsive: {
          details: responsiveDetails,
        },
        ...overrides,
        columns: normalizedColumns,
      };

      if (!ajaxEndpoint) {
        return baseOptions;
      }

      return {
        ...baseOptions,
        serverSide: true,
        processing: true,
        language: {
          paginate: {
            next: '<i class="icon-base ri ri-arrow-right-s-line scaleX-n1-rtl icon-22px"></i>',
            previous: '<i class="icon-base ri ri-arrow-left-s-line scaleX-n1-rtl icon-22px"></i>',
            first: '<i class="icon-base ri ri-skip-back-mini-line scaleX-n1-rtl icon-22px"></i>',
            last: '<i class="icon-base ri ri-skip-forward-mini-line scaleX-n1-rtl icon-22px"></i>',
          },
        },
      };
    }, [ajaxEndpoint, normalizedColumns, options, responsiveModalDisplay]);

    useEffect(() => {
      const api = tableRef.current?.dt?.();

      if (!api?.on) {
        return;
      }

      const handleResponsiveDisplay = (event, datatable, row, showHide) => {
        if (!showHide) {
          return;
        }

        datatable.rows({ page: 'current' }).every(function () {
          if (this.index() === row.index()) {
            return;
          }

          if (this.child && this.child.isShown && this.child.isShown()) {
            this.child(false);
            const node = this.node();
            if (node && node.classList) {
              node.classList.remove('parent');
            }
          }
        });
      };

      api.on('responsive-display', handleResponsiveDisplay);

      return () => {
        api.off('responsive-display', handleResponsiveDisplay);
      };
    }, [tableOptions]);

    // Simpan instance DataTable ketika komponen di-mount.
    const setInstanceRef = useCallback((instance) => {
      tableRef.current = instance;
    }, []);

    return (
      <DataTable
        ref={setInstanceRef}
        data={ajaxEndpoint ? undefined : clientDataRef.current}
        ajax={ajaxEndpoint ? ajaxHandler : undefined}
        columns={ajaxEndpoint ? normalizedColumns : undefined}
        className={`display table table-sm table-hover  ${className}`}
        style={{ width: '100%' }}
        options={tableOptions}
        {...rest}
      >
        <thead className="text-nowrap">
          <tr className="text-nowrap">
            {columns.map((item, index) => (
              <th key={index}>{item.title ?? item.data}</th>
            ))}
          </tr>
        </thead>
      </DataTable>
    );
  }
);

GridData.displayName = 'GridData';

export default GridData;
