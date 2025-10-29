import pkg from "@algolia/autocomplete-js";

// Support both CommonJS default export and named export shapes
const autocomplete = pkg?.autocomplete ?? pkg;

try {
  window.autocomplete = autocomplete;
} catch (e) {}

export { autocomplete };
export default autocomplete;
