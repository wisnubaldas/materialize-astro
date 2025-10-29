import { useEffect } from 'react';

let vendorLoaderPromise;

// Loads the vendor bundle exactly once and reuses the same promise on every call.
const ensureVendorLoader = () => {
  if (!vendorLoaderPromise) {
    vendorLoaderPromise = import('@js/vendor-loader.js');
  }
  return vendorLoaderPromise;
};

// React effect component that bootstraps the vendor assets as soon as it mounts.
export default function VendorLoader() {
  useEffect(() => {
    ensureVendorLoader();
  }, []);

  return null;
}
