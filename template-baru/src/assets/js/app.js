import { Helpers } from './helpers';

// import { TemplateCustomizer } from '@components/TemplateCustomer';

/**
 * Config
 * -------------------------------------------------------------------------------------
 * ! IMPORTANT: Make sure you clear the browser local storage In order to see the config changes in the template.
 * ! To clear local storage: (https://www.leadshook.com/help/how-to-clear-local-storage-in-google-chrome-browser/).
 */

('use strict');
/* JS global variables
 !Please use the hex color code (#000) here. Don't use rgba(), hsl(), etc
*/
window.config = {
  // global color variables for charts except chartjs
  colors: {
    primary: Helpers.getCssVar('primary'),
    secondary: Helpers.getCssVar('secondary'),
    success: Helpers.getCssVar('success'),
    info: Helpers.getCssVar('info'),
    warning: Helpers.getCssVar('warning'),
    danger: Helpers.getCssVar('danger'),
    dark: Helpers.getCssVar('dark'),
    black: Helpers.getCssVar('pure-black'),
    white: Helpers.getCssVar('white'),
    cardColor: Helpers.getCssVar('paper-bg'),
    bodyBg: Helpers.getCssVar('body-bg'),
    bodyColor: Helpers.getCssVar('body-color'),
    headingColor: Helpers.getCssVar('heading-color'),
    textMuted: Helpers.getCssVar('secondary-color'),
    borderColor: Helpers.getCssVar('border-color')
  },
  colors_label: {
    primary: Helpers.getCssVar('primary-bg-subtle'),
    secondary: Helpers.getCssVar('secondary-bg-subtle'),
    success: Helpers.getCssVar('success-bg-subtle'),
    info: Helpers.getCssVar('info-bg-subtle'),
    warning: Helpers.getCssVar('warning-bg-subtle'),
    danger: Helpers.getCssVar('danger-bg-subtle'),
    dark: Helpers.getCssVar('dark-bg-subtle')
  },
  fontFamily: Helpers.getCssVar('font-family-base'),
  enableMenuLocalStorage: true // Enable menu state with local storage support
};

window.assetsPath = document.documentElement.getAttribute('data-assets-path');
window.templateName = document.documentElement.getAttribute('data-template');

/**
 * TemplateCustomizer
 * ! You must use(include) template-customizer.js to use TemplateCustomizer settings
 * -----------------------------------------------------------------------------------------------
 */

/**
 * TemplateCustomizer settings
 * -------------------------------------------------------------------------------------
 * displayCustomizer: true(Show customizer), false(Hide customizer)
 * lang: To set default language, Add more languages and set default. Fallback language is 'en'
 * defaultPrimaryColor: '#7367F0' | Set default primary color
 * defaultSkin: 0(Default), 1(Bordered)
 * defaultTheme: 'light', 'dark', 'system'
 * defaultSemiDark: true, false (For dark menu only)
 * defaultContentLayout: 'compact', 'wide' (compact=container-xxl, wide=container-fluid)
 * defaultHeaderType: 'static', 'fixed' (for horizontal layout only)
 * defaultMenuCollapsed: true, false (For vertical layout only)
 * defaultNavbarType: 'sticky', 'static', 'hidden' (For vertical layout only)
 * defaultTextDir: 'ltr', 'rtl' (Direction)
 * defaultFooterFixed: true, false (For vertical layout only)
 * defaultShowDropdownOnHover : true, false (for horizontal layout only)
 * controls: [ 'color', 'theme', 'skins', 'semiDark', 'layoutCollapsed', 'layoutNavbarOptions', 'headerType', 'contentLayout', 'rtl' ] | Show/Hide customizer controls
 */
// console.log(window.config);
if (typeof TemplateCustomizer !== 'undefined') {
  window.templateCustomizer = new TemplateCustomizer({
    displayCustomizer: false,
    lang: localStorage.getItem('templateCustomizer-' + templateName + '--Lang') || 'en', // Set default language here
    defaultPrimaryColor: '#D11BB4',
    // defaultSkin: 1,
    // defaultTheme: 'system',
    // defaultSemiDark: true,
    // defaultContentLayout: 'wide',
    // defaultHeaderType: 'static',
    // defaultMenuCollapsed: true,
    // defaultNavbarType: 'static',
    // defaultTextDir: 'ltr',
    // defaultFooterFixed: false,
    // defaultShowDropdownOnHover: false,
    controls: [
      'color',
      'theme',
      'skins',
      'semiDark',
      'layoutCollapsed',
      'layoutNavbarOptions',
      'headerType',
      'contentLayout',
      'rtl'
    ]
  });
}
