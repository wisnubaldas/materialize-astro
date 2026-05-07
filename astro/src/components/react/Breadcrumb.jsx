import { Fragment } from 'react';

const isVoidLink = (url) => {
  const value = typeof url === 'string' ? url : '';
  const normalized = value.trim().toLowerCase();
  return (
    normalized === '' || normalized === 'javascript:void(0)' || normalized === 'javascript:void(0);'
  );
};

const normalizePath = (path) => {
  if (typeof path !== 'string' || path.trim() === '') return '/';
  const [cleanPath] = path.split('?');
  const noTrailing = cleanPath.replace(/\/+$/, '');
  return noTrailing === '' ? '/' : noTrailing;
};

const findTrail = (items, currentPath) => {
  const safeItems = Array.isArray(items) ? items : [];
  const normalizedCurrentPath = normalizePath(currentPath);

  for (const item of safeItems) {
    const hasChildren = Array.isArray(item?.subItems) && item.subItems.length > 0;
    const itemPath = normalizePath(item?.url);
    const itemMatch = !isVoidLink(item?.url) && itemPath === normalizedCurrentPath;

    if (hasChildren) {
      const childTrail = findTrail(item.subItems, normalizedCurrentPath);
      if (childTrail.length > 0) {
        return item?.name ? [item, ...childTrail] : childTrail;
      }
    }

    if (itemMatch) {
      return item?.name ? [item] : [];
    }
  }

  return [];
};

const Breadcrumb = ({ menuData = [], currentPath = '/' }) => {
  const trail = findTrail(menuData, currentPath);

  if (trail.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb breadcrumb-custom-icon mb-0">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          const href = isVoidLink(item?.url) ? null : item.url;
          const key = item?.key ?? item?.url ?? `${item?.name ?? 'breadcrumb'}-${index}`;

          return (
            <Fragment key={key}>
              <li
                className={`breadcrumb-item${isLast ? ' active bg-label-dark' : ' bg-label-primary'} badge`}
              >
                {!isLast && href ? <a href={href}>{item?.name}</a> : item?.name}
              </li>
              {!isLast && (
                <li className="d-flex align-items-center" aria-hidden="true">
                  <i className="breadcrumb-icon icon-base ri ri-arrow-right-circle-line align-middle"></i>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
