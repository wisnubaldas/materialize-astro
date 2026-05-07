import Breadcrumb from '@components/Breadcrumb.jsx';
import { logout } from '@js/auth.js';

const clearStorageAndCookies = () => {
  localStorage.clear();
  sessionStorage.clear();

  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  const hostname = window.location.hostname;
  const isIpHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  const canUseDomain = hostname !== 'localhost' && !isIpHost;
  const domainCandidates = new Set();

  if (canUseDomain) {
    const parts = hostname.split('.');
    for (let i = 0; i <= parts.length - 2; i += 1) {
      const candidate = parts.slice(i).join('.');
      if (candidate.includes('.')) {
        domainCandidates.add(candidate);
      }
    }
  }

  const expireCookie = (name, domain) => {
    const domainFlag = domain ? `; Domain=${domain}` : '';
    document.cookie = `${name}=; Path=/; Max-Age=0${domainFlag}${secureFlag}`;
  };

  const cookies = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean);

  const names = new Set(cookies.map((cookie) => cookie.split('=')[0]));

  names.forEach((name) => {
    expireCookie(name);
    domainCandidates.forEach((domain) => expireCookie(name, domain));
  });
};

const Nav = ({ username = '', menuData = [], currentPath = '/' }) => {
  const displayName = typeof username === 'string' ? username.trim() || 'User' : 'User';
  const handleLogout = async (event) => {
    event.preventDefault();
    clearStorageAndCookies();
    await logout();
    window.location.replace('/auth/login');
  };

  return (
    <nav
      className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-6" href="javascript:void(0)">
          <i className="icon-base ri ri-menu-line icon-22px"></i>
        </a>
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center justify-content-end"
        id="navbar-collapse"
      >
        <div className="navbar-nav align-items-center me-auto">
          <div className="nav-item">
            <Breadcrumb menuData={menuData} currentPath={currentPath} />
          </div>
        </div>

        <ul className="navbar-nav flex-row align-items-center ms-md-auto">
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              className="nav-link dropdown-toggle hide-arrow p-0"
              href="javascript:void(0);"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img src="../../assets/img/avatars/1.png" alt="avatar" className="rounded-circle" />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a className="dropdown-item" href="#">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img
                          src="../../assets/img/avatars/1.png"
                          alt="avatar"
                          className="w-px-40 h-auto rounded-circle"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">{displayName}</h6>
                      <small className="text-body-secondary">Admin</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider my-1"></div>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="icon-base ri ri-user-line icon-22px me-3"></i>
                  <span>My Profile</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="icon-base ri ri-settings-4-line icon-22px me-3"></i>
                  <span>Settings</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <span className="d-flex align-items-center align-middle">
                    <i className="flex-shrink-0 icon-base ri ri-bank-card-line icon-22px me-3"></i>
                    <span className="flex-grow-1 align-middle ms-1">Billing Plan</span>
                    <span className="flex-shrink-0 badge rounded-pill bg-danger">4</span>
                  </span>
                </a>
              </li>
              <li>
                <div className="dropdown-divider my-1"></div>
              </li>
              <li>
                <div className="d-grid px-4 pt-2 pb-1">
                  <a className="btn btn-danger d-flex" href="#logout" onClick={handleLogout}>
                    <small className="align-middle">Logout</small>
                    <i className="icon-base ri ri-logout-box-r-line ms-2 icon-16px"></i>
                  </a>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Nav;
