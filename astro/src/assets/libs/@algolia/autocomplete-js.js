import { autocomplete } from '@algolia/autocomplete-js';

if (typeof window !== 'undefined') {
  window.autocomplete = window.autocomplete ?? autocomplete;
}

export { autocomplete };
export default autocomplete;
