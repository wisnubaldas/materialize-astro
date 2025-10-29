const prefix = {
  angkasapura: (pat) => `/angkasapura/${pat}`,
  hubnet: (pat) => `/hub-net/${pat}`,
  tpsonline: (pat) => `/tps-online/${pat}`,
};
export const menuData = [
  {
    name: 'Landing Page',
    url: '/',
    icon: 'ri ri-home-smile-line',
  },
  {
    name: 'Angkasapura',
    url: 'javascript:void(0)',
    icon: 'ri ri-flight-takeoff-line',
    subItems: [
      {
        name: 'Data Invoice',
        url: prefix.angkasapura('data-invoice'),
      },
      {
        name: 'Void Invoice',
        url: prefix.angkasapura('void-invoice'),
      },
      {
        name: 'Send Invoice',
        url: 'javascript::void(0)', // prefix.angkasapura('invoice/send-invoice'),
      },

      {
        name: 'Status Response',
        url: 'javascript::void(0)', // prefix.angkasapura('status-response'),
      },
    ],
  },
  {
    name: 'HUB NET',
    url: 'javascript:void(0)',
    icon: 'ri ri-bus-2-fill',
    subItems: [
      {
        name: 'Dashboard',
        url: prefix.hubnet('dashboard'),
      },
      {
        name: 'Data Terkirim',
        url: prefix.hubnet('data-terkirim'),
      },
      {
        name: 'Monitor Sending Data',
        url: prefix.hubnet('data-tracking'),
      },
      {
        name: 'Upload Excel Export',
        url: prefix.hubnet('upload-excel-export'),
      },
      {
        name: 'Kirim Ulang By Date',
        url: prefix.hubnet('kirim-ulang-by-date'),
      },
    ],
  },
  {
    name: 'TPS',
    url: 'javascript:void(0)',
    icon: 'ri ri-community-fill',
    subItems: [
      {
        name: 'Master',
        url: 'javascript:void(0)',
        subItems: [
          {
            name: 'Master Airlines',
            url: 'javascript:void(0)',
          },
          {
            name: 'Master Flight',
            url: 'javascript:void(0)',
          },
        ],
      },
      {
        name: 'TPS Online',
        url: 'javascript:void(0)',
        subItems: [
          {
            name: 'Gate In',
            url: 'javascript:void(0)',
          },
          {
            name: 'Gate Out',
            url: 'javascript:void(0)',
          },
          {
            name: 'Unmanifest',
            url: 'javascript:void(0)',
          },
        ],
      },
      {
        name: 'PLP Online',
        url: 'javascript:void(0)',
      },
      {
        name: 'Document',
        url: 'javascript:void(0)',
      },
      {
        name: 'Report',
        url: 'javascript:void(0)',
      },
    ],
  },
];
