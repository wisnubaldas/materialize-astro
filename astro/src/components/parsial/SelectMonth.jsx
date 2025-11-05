import '@libs/flatpickr/flatpickr-month.css';
import '@libs/flatpickr/flatpickr.scss';
import flatpickr from 'flatpickr';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import { useEffect, useRef } from 'react';
export default function SelectMonth({ title = 'Pilih Bulan', data, callback }) {
  // flatficker bisa dipakai di sini buat report export
  const inputRef = useRef(null);
  useEffect(() => {
    if (!flatpickr || !monthSelectPlugin || !inputRef.current) {
      return undefined;
    }

    const instance = flatpickr(inputRef.current, {
      dateFormat: 'Y-m',
      defaultDate: new Date(),
      allowInput: false,
      plugins: [
        new monthSelectPlugin({
          shorthand: true, //defaults to false
          dateFormat: 'Y-m', //defaults to "F Y"
          altFormat: 'F Y', //defaults to "F Y"
          theme: 'light', // defaults to "light"
        }),
      ],
      // enableTime: true,
      onChange: async (selectedDates, dateStr, fp) => {
        try {
          const res = await data(dateStr);
          //   console.log(res);
          callback(res);
        } catch (error) {
          if (error.status === 404) {
            showToast({
              type: 'danger',
              message: 'Data invoice tidak ditemukan untuk bulan tersebut.',
              title: 'Search Invoice',
            });
            console.error(error);
          }
        } finally {
          fp.close();
        }
      },
    });
    return () => {
      instance.destroy();
    };
  }, [flatpickr]);

  return (
    <div className="row mt-3">
      <div className="col-6">
        <label htmlFor="floatingInput" className="form-label">
          {title}
        </label>
        <input
          id="floatingInput"
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
        />
      </div>
    </div>
  );
}
