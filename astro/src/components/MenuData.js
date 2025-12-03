const prefix = {
  angkasapura: (pat) => `/angkasapura/${pat}`,
  hubnet: (pat) => `/hub-net/${pat}`,
  tpsonline: (pat) => `/tps-online/${pat}`,
};

const menuAdmin = [
  {
    name: 'Landing Page',
    url: '/',
    icon: 'ri ri-home-smile-line',
  },
  {
    name: 'Setting',
    url: '/setting',
    icon: 'ri ri-settings-3-line',
    subItems: [
      {
        name: 'User Management',
        url: '/setting/user-management',
      },
      {
        name: 'Role Management',
        url: '/setting/role-management',
      },
      {
        name: 'Airlines Management',
        url: '/setting/airlines-management',
      },
    ],
  },
];
const menuAp2 = [
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
        url: 'javascript:void(0)', // prefix.angkasapura('invoice/send-invoice'),
      },

      {
        name: 'Status Response',
        url: 'javascript:void(0)', // prefix.angkasapura('status-response'),
      },
    ],
  },
];
const menuHubnet = [
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
        name: 'Data Tracking',
        url: prefix.hubnet('data-tracking'),
      },
      {
        name: 'Upload Excel Export',
        url: prefix.hubnet('upload-excel-sending-export'),
      },
      {
        name: 'Upload Excel Outgoing',
        url: prefix.hubnet('upload-excel-outgoing'),
      },
      {
        name: 'Logging',
        url: prefix.hubnet('logging'),
      },
      {
        name: 'Report Data Sending',
        url: prefix.hubnet('report'),
      },
    ],
  },
];
const menuTpsOnline = [
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
const menuEdi = [
  {
    name: 'EDI',
    url: 'javascript:void(0)',
    icon: 'ri ri-barcode-line',
    subItems: [
      {
        name: 'FHL',
        url: '/edi/fhl',
      },
      {
        name: 'FWB',
        url: '/edi/fwb',
      },
      {
        name: 'FFM',
        url: '/edi/ffm',
      },
    ],
  },
];

export { menuAdmin, menuAp2, menuEdi, menuHubnet, menuTpsOnline };
