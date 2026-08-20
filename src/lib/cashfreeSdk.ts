export type CashfreeCheckout = {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<{ error?: { message?: string }; paymentDetails?: unknown; redirect?: boolean }>;
};

let sdkPromise: Promise<void> | null = null;

export function loadCashfreeSdk(): Promise<void> {
  if (typeof window !== 'undefined' && window.Cashfree) {
    return Promise.resolve();
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-cashfree-sdk]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Unable to load Cashfree checkout')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.setAttribute('data-cashfree-sdk', 'true');
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error('Failed to load Cashfree SDK script'));
      };
      document.head.appendChild(script);
    });
  }

  return sdkPromise;
}
