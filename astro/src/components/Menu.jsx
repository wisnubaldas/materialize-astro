import React from 'react';

const isExternal = (url) => /^https?:\/\//i.test(url ?? '');
const isVoidLink = (url) => {
  const value = typeof url === 'string' ? url : '';
  return !value || value.trim() === '' || value.trim().toLowerCase() === 'javascript:void(0)';
};

const hasChildren = (item) => Array.isArray(item?.subItems) && item.subItems.length > 0;

const isActiveItem = (item, path) => {
  if (!item) return false;

  if (!isVoidLink(item.url) && !hasChildren(item)) {
    const normalized = item.url?.replace(/\/+$/, '') || '/';
    const normalizedPath = path?.replace(/\/+$/, '') || '/';
    return normalized === normalizedPath;
  }

  if (hasChildren(item)) {
    return item.subItems.some((child) => isActiveItem(child, path));
  }

  return false;
};

const getIconDescriptor = (icon) => {
  if (!icon) return null;

  if (typeof icon === 'string' && icon.includes(':')) {
    return { type: 'iconify', value: icon };
  }

  const iconClasses =
    typeof icon === 'string'
      ? icon.split(' ').filter(Boolean)
      : Array.isArray(icon)
        ? icon.filter(Boolean)
        : [];

  if (!iconClasses.includes('icon-base')) {
    iconClasses.unshift('icon-base');
  }

  return {
    type: 'class',
    className: ['menu-icon', ...iconClasses].join(' '),
  };
};

const Menu = ({ menuData = [], currentPath = '/' }) => {
  // menuData sudah RBAC-filtered dari backend; komponen ini fokus render + active state.
  const renderMenuLevel = (items, depth = 0) => {
    const safeItems = Array.isArray(items) ? items : [];

    return safeItems.map((item) => {
      const children = hasChildren(item);
      const active = isActiveItem(item, currentPath);
      const liClasses = ['menu-item'];
      const key = item.key ?? item.url ?? item.name ?? `${depth}-${item?.name ?? 'menu'}`;

      if (active) {
        liClasses.push('active');
        if (children) {
          liClasses.push('open');
        }
      }

      const linkClasses = ['menu-link'];
      if (children) {
        linkClasses.push('menu-toggle');
      }

      const href = isVoidLink(item.url) ? 'javascript:void(0);' : item.url;
      const target = isExternal(href) ? '_blank' : undefined;
      const rel = target === '_blank' ? 'noopener noreferrer' : undefined;
      const iconDescriptor = depth === 0 ? getIconDescriptor(item.icon) : null;

      return (
        <li key={key} className={liClasses.join(' ')} data-key={key}>
          <a href={href} className={linkClasses.join(' ')} target={target} rel={rel}>
            {iconDescriptor?.type === 'iconify' ? (
              <span className="menu-icon iconify iconify-inline" data-icon={iconDescriptor.value} />
            ) : iconDescriptor?.type === 'class' ? (
              <i className={iconDescriptor.className} />
            ) : null}
            <div data-i18n={item.name}>{item.name}</div>
          </a>
          {children && <ul className="menu-sub">{renderMenuLevel(item.subItems, depth + 1)}</ul>}
        </li>
      );
    });
  };

  return (
    <aside id="layout-menu" className="layout-menu menu-vertical menu">
      <div className="app-brand demo">
        <a href="/" className="app-brand-link">
          <span className="app-brand-logo demo">
            <span className="text-primary">
              <img src="/logo-mau.svg" alt="Logo" width="32" height="32" />
            </span>
          </span>
          <span className="app-brand-text demo menu-text fw-semibold ms-2">MAU APP</span>
        </a>

        <a href="javascript:void(0);" className="layout-menu-toggle menu-link text-large ms-auto">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.47365 11.7183C8.11707 12.0749 8.11707 12.6531 8.47365 13.0097L12.071 16.607C12.4615 16.9975 12.4615 17.6305 12.071 18.021C11.6805 18.4115 11.0475 18.4115 10.657 18.021L5.83009 13.1941C5.37164 12.7356 5.37164 11.9924 5.83009 11.5339L10.657 6.707C11.0475 6.31653 11.6805 6.31653 12.071 6.707C12.4615 7.09747 12.4615 7.73053 12.071 8.121L8.47365 11.7183Z"
              fillOpacity="0.9"
            ></path>
            <path
              d="M14.3584 11.8336C14.0654 12.1266 14.0654 12.6014 14.3584 12.8944L18.071 16.607C18.4615 16.9975 18.4615 17.6305 18.071 18.021C17.6805 18.4115 17.0475 18.4115 16.657 18.021L11.6819 13.0459C11.3053 12.6693 11.3053 12.0587 11.6819 11.6821L16.657 6.707C17.0475 6.31653 17.6805 6.31653 18.071 6.707C18.4615 7.09747 18.4615 7.73053 18.071 8.121L14.3584 11.8336Z"
              fillOpacity="0.4"
            ></path>
          </svg>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">{renderMenuLevel(menuData)}</ul>
    </aside>
  );
};

export default Menu;
