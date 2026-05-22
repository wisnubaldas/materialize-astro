const ADMIN_SECTIONS = [
  {
    title: 'User & Role',
    description: 'Kelola user, role, dan permission akses aplikasi.',
    href: '/setting/user-management',
    cta: 'Buka User Management',
  },
  {
    title: 'EDI Monitoring',
    description: 'Pantau proses pengiriman pesan EDI dan status validasi payload.',
    href: '/edi/fsu-message',
    cta: 'Buka FSU Message',
  },
];

export default function AdminDashboard() {
  return (
    <section className="container-fluid px-0">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h4 className="mb-1">Admin Dashboard</h4>
          <p className="text-muted mb-0">
            Pusat kendali untuk konfigurasi dan monitoring modul utama MAU APP.
          </p>
        </div>
      </div>

      <div className="row g-3">
        {ADMIN_SECTIONS.map((item) => (
          <div className="col-12 col-lg-4" key={item.href}>
            <div className="card border h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h6 className="mb-2">{item.title}</h6>
                <p className="text-muted mb-4">{item.description}</p>
                <a className="btn btn-outline-primary btn-sm mt-auto" href={item.href}>
                  {item.cta}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
