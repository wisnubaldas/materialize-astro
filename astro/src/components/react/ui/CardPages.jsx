import "./CardPages.css";

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
  variant = "primary",
  type = "gradient",
}) {
  const defaultTitle = "Build Up Checklist & Manifest";
  const defaultDescription =
    "Kelola data build up, cetak manifest, dan lembar checklist secara realtime";
  const defaultIcon = "ri ri-archive-line";

  // Fallback checks for safety
  const validVariants = [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "dark",
    "light",
  ];
  const validTypes = ["gradient", "solid", "label", "outline"];

  const activeVariant = validVariants.includes(variant) ? variant : "primary";
  const activeType = validTypes.includes(type) ? type : "gradient";

  // Class construction based on externalized CSS system
  const headerClass = `card-page-header card-page-type-${activeType} card-page-variant-${activeVariant}`;

  // Text shadow is only needed for light text on dark backgrounds (gradient and solid headers except 'light')
  const hasTextShadow =
    (activeType === "gradient" && activeVariant !== "light") ||
    (activeType === "solid" && activeVariant !== "light");

  const titleClass = `card-page-title ${hasTextShadow ? "card-page-text-shadow" : ""}`;
  const descClass = `card-page-description ${hasTextShadow ? "card-page-text-shadow" : ""}`;

  const isLightTheme =
    activeVariant === "light" ||
    activeType === "outline" ||
    activeType === "label";

  return (
    <div className={headerClass}>
      {/* Background animated boxes */}
      <div
        className={`card-page-bg-animation${isLightTheme ? " light-theme" : ""}`}
      >
        <div className="bg-box bg-box-1"></div>
        <div className="bg-box bg-box-2"></div>
        <div className="bg-box bg-box-3"></div>
        <div className="bg-box bg-box-4"></div>
        <div className="bg-box bg-box-5"></div>
      </div>

      {/* Content wrapper with position-relative and z-index 2 */}
      <div
        className="d-flex align-items-center gap-3 position-relative"
        style={{ zIndex: 2 }}
      >
        <div className="card-page-avatar">
          <i className={`${icon || defaultIcon} icon-24px`}></i>
        </div>
        <div>
          <h4 className={titleClass}>{title || defaultTitle}</h4>
          <p className={descClass}>{description || defaultDescription}</p>
        </div>
      </div>
    </div>
  );
}
