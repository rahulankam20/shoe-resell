import { useEffect, useState } from 'react';
import { ArrowLeft, Check, LockKeyhole, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders, money } from '../lib/format';
import type { Address } from '../types';

const emptyAddress: Address = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', is_default: true };

type CashfreeCheckout = {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<{ error?: { message?: string }; paymentDetails?: unknown; redirect?: boolean }>;
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: 'sandbox' | 'production' }) => CashfreeCheckout;
  }
}

function loadCashfreeSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const existing = document.querySelector('script[data-cashfree-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Unable to load Cashfree checkout')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.cashfreeSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Cashfree checkout'));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, mrpTotal, discount, shipping, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [address, setAddress] = useState<Address>({ ...emptyAddress, full_name: profile?.full_name || '', phone: profile?.phone || '' });
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState<Address[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authHeaders()
      .then((headers) => fetch('/api/addresses', { headers }))
      .then((response) => response.ok ? response.json() : [])
      .then((list) => {
        setSaved(list);
        const primary = list.find((item: Address) => item.is_default);
        if (primary) setAddress(primary);
      })
      .catch(() => setSaved([]));
  }, []);

  if (!items.length) return <div className="page-shell empty-page"><h1>Your cart is empty.</h1><Link className="button dark" to="/shop">Return to shop</Link></div>;

  const update = (key: keyof Address, value: string | boolean) => setAddress((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email) || !address.full_name || !/^\d{10}$/.test(address.phone.replace(/\D/g, '')) || !address.line1 || !address.city || !address.state || !/^\d{6}$/.test(address.postal_code)) {
      return setError('Check your email, 10-digit phone, full address and 6-digit PIN code.');
    }
    setBusy(true);
    try {
      const idempotencyKey = (globalThis.crypto?.randomUUID?.() || `chk_${Date.now()}`);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { ...(await authHeaders()), 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.product.id, size: item.size, quantity: item.quantity })),
          customer: { email, full_name: address.full_name, phone: address.phone, address },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setBusy(false);
        return setError(data.error || 'Checkout could not be completed');
      }

      if (data.cashfree_mode === 'MOCK' || !data.payment_session_id) {
        clearCart();
        navigate(`/order-confirmation/${data.id}`, { state: { order: data, pending: true } });
        return;
      }

      await loadCashfreeSdk();
      if (typeof window.Cashfree !== 'function') throw new Error('Cashfree checkout is unavailable');
      const mode = String(data.cashfree_mode).toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox';
      const cashfree = window.Cashfree({ mode });
      const result = await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
      if (result?.error) {
        setError(result.error.message || 'UPI checkout was cancelled. Your order is still pending confirmation.');
        navigate(`/order-confirmation/${data.id}`, { state: { order: data, pending: true } });
        return;
      }
      clearCart();
      navigate(`/order-confirmation/${data.id}`, { state: { order: data, pending: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start UPI checkout');
    } finally {
      setBusy(false);
    }
  };

  return <div className="checkout-page page-shell"><Link className="back-link" to="/cart"><ArrowLeft /> Back to cart</Link><div className="checkout-grid"><form className="checkout-form" onSubmit={submit}><p className="eyebrow accent">SECURE UPI CHECKOUT</p><h1>PAY WITH<br />UPI.</h1><div className="demo-notice"><LockKeyhole /><span><strong>Server-confirmed Cashfree UPI</strong>We never trust the browser for price, stock or payment status. Success is confirmed only after a signed webhook or official reconciliation.</span></div><div className="demo-notice"><Smartphone /><span><strong>UPI only</strong>Complete payment in your UPI app. Closing the sheet does not mark the order paid.</span></div>{saved.length > 0 && <div className="saved-addresses"><p>Saved addresses</p>{saved.map((entry) => <button type="button" key={entry.id} onClick={() => setAddress(entry)} className={address.id === entry.id ? 'selected' : ''}><strong>{entry.label}</strong><span>{entry.line1}, {entry.city}</span>{address.id === entry.id && <Check />}</button>)}</div>}<fieldset><legend>Contact</legend><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><div className="form-row"><label>Full name<input value={address.full_name} onChange={(event) => update('full_name', event.target.value)} required /></label><label>Phone number<input inputMode="numeric" value={address.phone} onChange={(event) => update('phone', event.target.value)} required /></label></div></fieldset><fieldset><legend>Shipping address</legend><label>Address line 1<input value={address.line1} onChange={(event) => update('line1', event.target.value)} required /></label><label>Address line 2 <span>(optional)</span><input value={address.line2} onChange={(event) => update('line2', event.target.value)} /></label><div className="form-row three"><label>City<input value={address.city} onChange={(event) => update('city', event.target.value)} required /></label><label>State<input value={address.state} onChange={(event) => update('state', event.target.value)} required /></label><label>PIN code<input inputMode="numeric" value={address.postal_code} onChange={(event) => update('postal_code', event.target.value)} maxLength={6} required /></label></div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button accent full checkout-submit" disabled={busy}>{busy ? 'Opening UPI checkout…' : `Pay ${money(total)} with UPI`}</button></form><aside className="checkout-summary"><h2>ORDER SUMMARY</h2>{items.map((item) => <div className="checkout-product" key={`${item.product.id}-${item.size}`}><img src={item.product.images[0]} alt="" /><span><strong>{item.product.name}</strong><small>{item.product.brand} · UK {item.size} · Qty {item.quantity}</small></span><b>{money(Number(item.product.sale_price) * item.quantity)}</b></div>)}<div className="summary-lines"><div><span>MRP</span><span>{money(mrpTotal)}</span></div><div className="saving"><span>Discount</span><strong>− {money(discount)}</strong></div><div><span>Shipping</span><span>{shipping ? money(shipping) : 'FREE'}</span></div><div className="summary-total"><strong>Total</strong><strong>{money(total)}</strong></div></div></aside></div></div>;
}
