let scriptPromise = null;

/** Loads Razorpay's checkout.js once and caches the promise — safe to call from multiple places. */
export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Opens the Razorpay Checkout modal. Resolves with { razorpayPaymentId, razorpayOrderId,
 * razorpaySignature } on success, rejects if the customer dismisses the modal or Razorpay
 * reports a failure. Never receives or touches the key secret — only the public keyId.
 */
export async function openRazorpayCheckout({ keyId, amount, currency, razorpayOrderId, name, description, prefill }) {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount: Math.round(amount * 100),
      currency,
      order_id: razorpayOrderId,
      name,
      description,
      prefill,
      theme: { color: '#000000' },
      handler: (response) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}
