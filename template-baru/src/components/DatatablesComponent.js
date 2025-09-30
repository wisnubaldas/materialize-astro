import '@assets/libs/flatpickr/flatpickr';
import '@assets/libs/flatpickr/flatpickr.scss';
import '@assets/libs/moment/moment';
import '@components/DatatablesComponent.css';
const apiPath = import.meta.env.PUBLIC_BACKEND_PATH;

const myFunc = {
  makeColumn: (col) => {
    return $.map(col, function (elementOrValue, indexOrKey) {
      return { data: elementOrValue, name: elementOrValue };
    });
  },
  resetFilters: function () {
    // 1. Reset custom filter object
    tbl.filters = {};

    // 2. Reset pencarian global
    tbl.search('');

    // 3. Reset pencarian per kolom
    tbl.columns().every(function () {
      this.search('');
    });

    // 4. Redraw table
    tbl.draw();
  }
}
let tbl

$(document).ready(function () {
  const uri = $('#props').data('uri');
  const columns = $('#props').data('columns');
  const is_responsive = $('#props').data('responsive');
  tbl = $('#my-table').DataTable({
    processing: true,
    serverSide: true,
    searching: true,
    lengthChange: false,
    pageLength: 10,
    order: [[1, 'asc']],
    ajax: {
      url: apiPath + uri,
      type: 'POST',
      contentType: 'application/json',
      data: function (d) {
        let filters = {};
        d.columns.map(function (col, i) {
          // console.log(col.name);
          if (col.search.value !== '') {
            filters[col.name] = col.search.value;
          }
        })
        d.filters = filters;
        // inject custom object filters
        console.log("Data yang dikirim ke server:", d);
        return JSON.stringify(d);  // kirim body JSON
      },

      beforeSend: function (xhr) {
        // Ambil token dari localStorage
        let token = localStorage.getItem("access_token");
        if (token) {
          xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
      }
    },
    columns: myFunc.makeColumn(columns),
    columnDefs: [
      {
        targets: 0,
        // searchable: false,
        orderable: false,
        render: function (data, type, full, meta) {
          if (is_responsive) {
            return `<button class="btn btn-xs btn-outline-primary waves-effect waves-light">${data}</button>`;
          }
          return data; // tampilkan default saja
        }
      }
    ],
    responsive: is_responsive ? {
      details: {
        display: function (row, update, render) {
          if (!update) { // ⬅️ pastikan hanya ketika user klik, bukan saat init
            let data = render();
            $('#customModal .modal-body').html(data);
            $('#customModal').modal('show');
          }
        },
        type: 'column',
        renderer: function (api, rowIdx, columns) {
          let hiddenCols = columns.filter(function (col) {
            return col.hidden;
          });

          if (!hiddenCols.length) return false;

          let headerRow = "";
          let dataRow = "";
          let tables = "";

          tables += `<table class="table table-striped border-secondary table_component">`;
          hiddenCols.forEach(function (col, i) {
            headerRow += `<th>${col.title}</th>`;
            dataRow += `<td>${col.data}</td>`;
            // setiap 5 kolom, tutup table dan reset
            if ((i + 1) % 5 === 0 || i === hiddenCols.length - 1) {
              tables += `
                  <tr>${headerRow}</tr>
                  <tr>${dataRow}</tr>`;
              headerRow = "";
              dataRow = "";
            }
          });
          tables += `</table>`;

          return tables;
        }
      }
    } : false,
    language: {
      paginate: {
        first: '<iconify-icon icon="line-md:arrow-close-left" width="24" height="24"></iconify-icon>',   // First
        last: '<iconify-icon icon="line-md:arrow-close-right" width="24" height="24"></iconify-icon>',   // Last
        next: '<iconify-icon icon="line-md:arrow-right" width="24" height="24"></iconify-icon>',          // Next
        previous: '<iconify-icon icon="line-md:arrow-left" width="24" height="24"></iconify-icon>'        // Previous
      }
    }
  });



  // Advanced Search Functions Starts
  // --------------------------------------------------------------------
  // Datepicker for advanced filter
  var rangePickr = $('.flatpickr-range')

  if (rangePickr.length) {
    rangePickr.flatpickr({
      mode: 'single',
      dateFormat: 'Y-m-d',
      locale: {
        format: 'id'
      },
      onClose: function (selectedDates, dateStr, instance) {
        if (selectedDates.length > 0) {
          const colIndex = $('.flatpickr-range').data('column-index');
          tbl.column(colIndex).search(dateStr).draw();
        }
      }
    });
  }

  // Advanced Search Functions Ends
  $('input.dt-input').on('keyup change', function () {
    // filterColumn($(this).attr('data-column'), $(this).val());
    let colName = $(this).data('column'); // misalnya 0 = Name
    let val = $(this).val();
    // console.log("Search column:", colName, "=>", val);

    if (colName !== undefined) {
      // Simpan ke object custom
      tbl
        .column($(this).data('column-index'))
        .search(val ? val : "", false, false) // regex=false, smart=false
        .draw();
    }
  });

  // Event listener untuk tombol refresh
  $("#refresh-table").on("click", function () {
    tbl.draw();
  });
  // reset form
  $("#reset-form").on("click", function () {
    $(".dt_adv_search")[0].reset();
    myFunc.resetFilters();
  });
})



