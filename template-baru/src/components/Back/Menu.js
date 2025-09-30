const prefix = {
  angkasapura: pat => `/angkasapura/${pat}`,
  hubnet: pat => `/hub-net/${pat}`
};
export const menuData = [
  {
    name: 'Home',
    url: '/',
    icon: 'line-md:home-twotone'
  },
  {
    name: 'Angkasapura',
    url: 'javascript:void(0)',
    icon: 'line-md:clipboard-check-twotone',
    subItems: [
      {
        name: 'Invoice',
        url: 'javascript:void(0)',
        subItems: [
          {
            name: 'Send Invoice',
            url: prefix.angkasapura('invoice/send-invoice')
          },
          {
            name: 'Data Invoice',
            url: prefix.angkasapura('invoice/data-invoice')
          }
        ]
      },
      {
        name: 'Void Invoice',
        url: prefix.angkasapura('void-invoice')
      },
      {
        name: 'Status Response',
        url: prefix.angkasapura('status-response')
      },
      {
        name: 'Invoice Tidak Lengkap',
        url: prefix.angkasapura('failed-invoice')
      }
    ]
  },
  {
    name: 'HUB NET',
    url: 'javascript:void(0)',
    icon: 'line-md:alert-twotone-loop',
    subItems: [
      {
        name: 'Status Response',
        url: prefix.hubnet('status-response')
      },
      {
        name: 'Upload Excel Export',
        url: prefix.hubnet('upload-excel-export')
      },
      {
        name: 'Kirim Ulang By Date',
        url: prefix.hubnet('kirim-ulang-by-date')
      },
      {
        name: 'Data Tracking',
        url: prefix.hubnet('data-tracking')
      }
    ]
  }
];
