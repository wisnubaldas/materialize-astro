import './CardPages.css';

/**
 * A map of premium gradient/solid styles for card page headers.
 * Each configuration contains styling details matching standard Bootstrap/Materialize color variants.
 *
 * @type {Object.<string, {background: string, textClass: string, descClass: string, avatarClass: string}>}
 */
const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #7367f0 0%, #9e95f5 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-primary',
  },
  secondary: {
    background: 'linear-gradient(135deg, #a8aaae 0%, #c4c5c7 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-secondary',
  },
  success: {
    background: 'linear-gradient(135deg, #28c76f 0%, #5edc98 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-success',
  },
  danger: {
    background: 'linear-gradient(135deg, #ea5455 0%, #f28b8c 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-danger',
  },
  warning: {
    background: 'linear-gradient(135deg, #ff9f43 0%, #ffc085 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-warning',
  },
  info: {
    background: 'linear-gradient(135deg, #00bad1 0%, #54def0 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-info',
  },
  dark: {
    background: 'linear-gradient(135deg, #4b4b4b 0%, #7c7c7c 100%)',
    textClass: 'text-white',
    descClass: 'text-white-50',
    avatarClass: 'bg-white text-dark',
  },
  light: {
    background: '#f8f9fa',
    textClass: 'text-dark',
    descClass: 'text-muted',
    avatarClass: 'bg-primary text-white shadow-sm',
  },
};

/**
 * Reusable CardPages component for page headers.
 * Renders headers with various style configurations such as gradient, solid, label, or outline layouts
 * corresponding to standard Bootstrap/Materialize variants.
 *
 * @param {Object} props - The component props.
 * @param {string} [props.title] - The title of the page header.
 * @param {string} [props.description] - Description text under the title.
 * @param {string} [props.icon] - CSS class for the icon (e.g., 'ri-archive-line').
 * @param {('primary'|'secondary'|'success'|'danger'|'warning'|'info'|'dark'|'light')} [props.variant='primary'] - Bootstrap color variant.
 * @param {('gradient'|'solid'|'label'|'outline')} [props.type='gradient'] - Styling type configuration.
 * @returns {React.JSX.Element} The rendered CardPages component.
 */
export default function CardPages({
  title,
  description,
  icon,
  variant = 'primary',
  type = 'gradient',
}) {
  const defaultTitle = 'Build Up Checklist & Manifest';
  const defaultDescription =
    'Kelola data build up, cetak manifest, dan lembar checklist secara realtime';
  const defaultIcon = 'ri ri-archive-line';

  // Fallback checks for safety
  const activeVariant = VARIANTS[variant] ? variant : 'primary';
  const activeType = ['gradient', 'solid', 'label', 'outline'].includes(type) ? type : 'gradient';

  const config = VARIANTS[activeVariant];

  let headerClass = 'card-header p-4 position-relative overflow-hidden';
  let headerStyle = {};
  let titleClass = 'mb-0 fw-bold';
  let descClass = 'mb-0 small';
  let avatarClass =
    'avatar avatar-md rounded-3 d-flex align-items-center justify-content-center shadow-sm';

  // Apply drop shadow only to white/light text on dark background configurations
  const hasLightText =
    (activeType === 'gradient' && activeVariant !== 'light') ||
    (activeType === 'solid' && activeVariant !== 'light');

  const textStyle = hasLightText
    ? {
        textShadow:
          '-1px -1px 1px rgba(255,255,255,.1), 1px 1px 1px rgba(0,0,0,.5), 2px 2px 2px rgba(206,89,55,0)',
      }
    : {};

  if (activeType === 'gradient') {
    headerStyle = { background: config.background };
    headerClass += ` ${config.textClass}`;
    titleClass += ` ${config.textClass}`;
    descClass += ` ${config.descClass}`;
    avatarClass += ` ${config.avatarClass}`;
  } else if (activeType === 'solid') {
    const isLight = activeVariant === 'light';
    headerClass += ` bg-${activeVariant} ${isLight ? 'text-dark' : 'text-white'}`;
    titleClass += ` ${isLight ? 'text-dark' : 'text-white'}`;
    descClass += ` ${isLight ? 'text-muted' : 'text-white-50'}`;
    avatarClass += ` ${isLight ? 'bg-primary text-white' : `bg-white text-${activeVariant}`}`;
  } else if (activeType === 'label') {
    const isLight = activeVariant === 'light';
    headerClass += ` bg-label-${activeVariant}`;
    titleClass += ` text-${isLight ? 'dark' : activeVariant}`;
    descClass += ` text-muted`;
    avatarClass += ` ${isLight ? 'bg-primary text-white' : `bg-${activeVariant} text-white`}`;
  } else if (activeType === 'outline') {
    headerClass += ` bg-white border-start border-4 border-${activeVariant}`;
    titleClass += ` text-dark`;
    descClass += ` text-muted`;
    const isLight = activeVariant === 'light';
    avatarClass += ` ${isLight ? 'bg-light text-dark' : `bg-label-${activeVariant} text-${activeVariant}`}`;
  }

  const isLightTheme = activeVariant === 'light' || activeType === 'outline' || activeType === 'label';

  return (
    <div className={headerClass} style={headerStyle}>
      {/* Background animated boxes */}
      <div className={`card-page-bg-animation${isLightTheme ? ' light-theme' : ''}`}>
        <div className="bg-box bg-box-1"></div>
        <div className="bg-box bg-box-2"></div>
        <div className="bg-box bg-box-3"></div>
        <div className="bg-box bg-box-4"></div>
        <div className="bg-box bg-box-5"></div>
      </div>

      {/* Content wrapper with position-relative and z-index 2 */}
      <div className="d-flex align-items-center gap-3 position-relative" style={{ zIndex: 2 }}>
        <div className={avatarClass} style={{ width: '48px', height: '48px', flexShrink: 0 }}>
          <i className={`${icon || defaultIcon} icon-24px`}></i>
        </div>
        <div>
          <h4 className={titleClass} style={textStyle}>
            {title || defaultTitle}
          </h4>
          <p className={descClass} style={textStyle}>
            {description || defaultDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

