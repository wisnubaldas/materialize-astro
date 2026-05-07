const getWindow = () => (typeof window !== 'undefined' ? window : null);

const getLoaderOptions = (win) => ({
  loadLayoutScripts: true,
  ...(win?.__MAU_VENDOR_LOADER_OPTIONS__ ?? {}),
});

const loadDependencies = async (loadLayoutScripts = true) => {
  await import('./vendor-bundle.js');
  // helpers must be available before config/menu/customizer run
  await import('./helpers.js');
  if (loadLayoutScripts) {
    await import('./config.js');
    await Promise.all([import('./template-customizer.js'), import('./menu.js')]);
  }
};

const bindMenuToggles = (win, helpers) => {
  const toggles = win.document.querySelectorAll('.layout-menu-toggle');

  toggles.forEach((toggle) => {
    if (toggle.dataset.menuToggleBound === 'true') return;

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      helpers?.toggleCollapsed?.();
    });

    toggle.dataset.menuToggleBound = 'true';
  });
};

const initMenu = (win) => {
  const menuElement = win.document.getElementById('layout-menu');
  if (!menuElement) {
    return;
  }

  const helpers = win.Helpers;
  const MenuCtor = win.Menu;

  if (!helpers || typeof MenuCtor !== 'function') {
    return;
  }

  const currentMenu = helpers.mainMenu;
  if (currentMenu && typeof currentMenu.destroy === 'function') {
    currentMenu.destroy();
  }

  const showDropdownOnHover = win.templateCustomizer?.settings?.showDropdownOnHover ?? false;
  const perfectScrollbarLib = win.PerfectScrollbar ?? null;

  helpers.mainMenu = new MenuCtor(
    menuElement,
    {
      orientation: 'vertical',
      closeChildren: true,
      showDropdownOnHover,
    },
    perfectScrollbarLib
  );

  if (typeof helpers.isSmallScreen !== 'function' || !helpers.isSmallScreen()) {
    helpers._scrollToActive?.();
  }

  bindMenuToggles(win, helpers);
};

const bootstrap = async () => {
  const win = getWindow();
  if (!win) {
    return;
  }

  const { loadLayoutScripts } = getLoaderOptions(win);
  await loadDependencies(loadLayoutScripts);

  const waves = win.Waves;
  if (waves && typeof waves.init === 'function') {
    waves.init();
  }

  const start = () => {
    try {
      if (loadLayoutScripts) {
        initMenu(win);
      }
    } catch (error) {
      console.error('[vendor-loader] initMenu failed', error);
    }
  };

  if (win.document.readyState === 'loading') {
    win.document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
};

bootstrap().catch((error) => {
  console.error('[vendor-loader] bootstrap failed', error);
  throw error;
});
