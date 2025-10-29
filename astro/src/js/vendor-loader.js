import "./vendor-bundle.js";
import { Helpers } from "./helpers.js";
import "./template-customizer.js";
import "./config.js";
import { Menu } from "./menu.js";
Waves.init();

const initMenu = () => {
  const menuElement = document.getElementById("layout-menu");
  if (!menuElement || typeof window === "undefined") {
    return;
  }

  const currentMenu = window.Helpers?.mainMenu;
  if (currentMenu && typeof currentMenu.destroy === "function") {
    currentMenu.destroy();
  }

  const showDropdownOnHover =
    window.templateCustomizer?.settings?.showDropdownOnHover ?? false;
  const perfectScrollbarLib = window.PerfectScrollbar ?? null;

  window.Helpers.mainMenu = new Menu(
    menuElement,
    {
      orientation: "vertical",
      closeChildren: true,
      showDropdownOnHover,
    },
    perfectScrollbarLib
  );

  if (!Helpers.isSmallScreen()) {
    Helpers._scrollToActive();
  }

  bindMenuToggles();
};

const bindMenuToggles = () => {
  const toggles = document.querySelectorAll(".layout-menu-toggle");

  toggles.forEach((toggle) => {
    if (toggle.dataset.menuToggleBound === "true") return;

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      Helpers.toggleCollapsed();
    });

    toggle.dataset.menuToggleBound = "true";
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMenu, { once: true });
} else {
  initMenu();
}
