import $ from 'jquery/dist/jquery';
import * as bootstrap from 'bootstrap';
import * as Popper from '@popperjs/core';
import Waves from 'node-waves/src/js/waves';
import PerfectScrollbar from 'perfect-scrollbar';
import Hammer from 'hammerjs';
import Pickr from '@simonwep/pickr/dist/pickr.es5.min';
import { autocomplete } from '@algolia/autocomplete-js';

if (typeof window !== 'undefined') {
  window.$ = window.jQuery = $;
  window.bootstrap = bootstrap;
  window.Popper = Popper;
  window.Waves = Waves;
  window.PerfectScrollbar = PerfectScrollbar;
  window.Hammer = Hammer;
  window.Pickr = Pickr;
  window.autocomplete = window.autocomplete ?? autocomplete;
  // window.initSmoothScroll = initSmoothScroll;
}
