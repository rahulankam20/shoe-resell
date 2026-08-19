export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim());
}

export function isValidPhone(value) {
  return /^[6-9]\d{9}$/.test(normalizePhone(value));
}

export function isValidPin(value) {
  return /^\d{6}$/.test(String(value || '').trim());
}

export function sanitizeCustomer(input) {
  const customer = input || {};
  const address = customer.address || {};
  return {
    email: String(customer.email || '').trim().toLowerCase(),
    full_name: String(customer.full_name || '').trim(),
    phone: normalizePhone(customer.phone),
    address: {
      label: String(address.label || 'Home').trim().slice(0, 40),
      full_name: String(address.full_name || customer.full_name || '').trim(),
      phone: normalizePhone(address.phone || customer.phone),
      line1: String(address.line1 || '').trim(),
      line2: String(address.line2 || '').trim(),
      city: String(address.city || '').trim(),
      state: String(address.state || '').trim(),
      postal_code: String(address.postal_code || '').trim(),
    },
  };
}

export function validateCustomer(customer) {
  if (!isValidEmail(customer.email)) return 'Enter a valid email address';
  if (customer.full_name.length < 2) return 'Enter your full name';
  if (!isValidPhone(customer.phone)) return 'Enter a valid 10-digit Indian mobile number';
  if (!customer.address.line1 || !customer.address.city || !customer.address.state) return 'Complete your shipping address';
  if (!isValidPin(customer.address.postal_code)) return 'Enter a valid 6-digit PIN code';
  return null;
}

export function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    productId: Number(item.productId || item.product_id),
    size: String(item.size || '').trim(),
    quantity: Math.max(1, Math.min(5, Number(item.quantity || 1))),
  })).filter((item) => item.productId && item.size);
}

export function itemHash(items) {
  return items
    .map((item) => `${item.productId}:${item.size}:${item.quantity}`)
    .sort()
    .join('|');
}

export function makeOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SV${stamp}${rand}`.slice(0, 20);
}

export function makeRefundId() {
  return `RF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
