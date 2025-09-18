export default [
  {
    text: "Dashboards",
    href: "#",
    icon: "mdi mdi-folder-home-outline",
    children: [
      {
        text: "Angkasapura",
        href: "/dashboard-angkasapura/",
        icon: "mdi mdi-space-station",
      },
      {
        text: "HUBNET",
        href: "/dashboard-hubnet/",
        icon: "mdi mdi-train-car",
      },

    ],
  },
  {
    text: "Angkasapura II",
    href: "#",
    icon: "mdi mdi-folder-home-outline",
    children: [
      {
        text: "Data Invoice",
        href: "/angkasapura/data-invoice/",
        icon: "mdi-invoice-text-clock",
      },
      {
        text: "Invoice Gagal Terkirim",
        href: "/angkasapura/status-invoice/",
        icon: "mdi mdi-invoice-remove-outline",
      },
      {
        text: "Invoice Tidak Lengkap",
        href: "/angkasapura/invoice-tidak-lengkap/",
        icon: "mdi mdi-invoice-text-edit",
      },
      {
        text: "Void Data Invoice",
        href: "/angkasapura/void-invoice/",
        icon: "mdi mdi-application-edit",
      },
    ],
  },
  {
    text: "HUBNET",
    href: "#",
    icon: "mdi mdi-folder-home-outline",
    children: [
      {
        text: "Kirim Data",
        href: "/hubnet/data-sending",
        icon: "mdi-cart-outline",
      },
      {
        text: "Status Terkirim",
        href: "/hubnet/status-terkirim",
        icon: "mdi-chart-timeline-variant",
      },
      {
        text: "Hapus Data HUBNET",
        href: "/hubnet/hapus-data/",
        icon: "mdi-chart-timeline-variant",
      },
      {
        text: "Kirim Ulang",
        href: "/hubnet/kirim-ulang/",
        icon: "mdi-chart-timeline-variant",
      },
    ],
  },
];
