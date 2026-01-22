import React from 'react';

const clearStorageAndCookies = () => {
  localStorage.clear();
  sessionStorage.clear();

  document.cookie.split(';').forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
};

const Nav = ({ username = '' }) => {
  const displayName = typeof username === 'string' ? username.trim() || 'User' : 'User';
  const handleLogout = (event) => {
    event.preventDefault();
    clearStorageAndCookies();
    window.location.href = '/auth/login';
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

      <div className="navbar-nav-right d-flex align-items-center justify-content-end" id="navbar-collapse">
        <div className="navbar-nav align-items-center">
          <div className="nav-item dropdown me-2 me-xl-0">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              id="nav-theme"
              href="javascript:void(0);"
              data-bs-toggle="dropdown"
            >
              <i className="icon-base ri ri-sun-line icon-22px theme-icon-active"></i>
              <span className="d-none ms-2" id="nav-theme-text">
                Toggle theme
              </span>
            </a>
            <ul className="dropdown-menu dropdown-menu-start" aria-labelledby="nav-theme-text">
              <li>
                <button
                  type="button"
                  className="dropdown-item align-items-center active"
                  data-bs-theme-value="light"
                  aria-pressed="false"
                >
                  <span>
                    <i className="icon-base ri ri-sun-line icon-22px me-3" data-icon="sun-line"></i>
                    Light
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item align-items-center"
                  data-bs-theme-value="dark"
                  aria-pressed="true"
                >
                  <span>
                    <i
                      className="icon-base ri ri-moon-clear-line icon-22px me-3"
                      data-icon="moon-clear-line"
                    ></i>
                    Dark
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item align-items-center"
                  data-bs-theme-value="system"
                  aria-pressed="false"
                >
                  <span>
                    <i
                      className="icon-base ri ri-computer-line icon-22px me-3"
                      data-icon="computer-line"
                    ></i>
                    System
                  </span>
                </button>
              </li>
            </ul>
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
