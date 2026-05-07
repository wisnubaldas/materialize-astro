// import jQuery from '/node_modules/jquery/dist/jquery.min.js';
import jQuery from 'jquery';
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    const $ = jQuery;

    // pastikan hanya 1x assign global
    if (!window.jQuery) window.jQuery = jQuery;
    if (!window.$) window.$ = $;
  });
}

export default jQuery;
