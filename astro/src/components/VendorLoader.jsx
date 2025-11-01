import { useEffect } from 'react';

let vendorLoaderPromise;

// Loads the vendor bundle exactly once and reuses the same promise on every call.
const ensureVendorLoader = () => {
  if (!vendorLoaderPromise) {
    if (typeof window !== 'undefined') {
      vendorLoaderPromise = import('@js/vendor-loader.js');
    }
  }
  return vendorLoaderPromise;
};

// React effect component that bootstraps the vendor assets as soon as it mounts.
export default function VendorLoader({ loadLoginScripts = false }) {
  useEffect(() => {
    const promise = ensureVendorLoader();
    promise
      ?.then(async () => {
        if (loadLoginScripts) {
          await import('@js/pages/login-page.js');
        }
      })
      .catch((error) => {
        console.error('[VendorLoader] Failed to load vendor bundle', error);
      });
  }, [loadLoginScripts]);
  return null;
}
