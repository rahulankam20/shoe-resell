import { useCallback, useEffect, useState } from 'react';
import { Check, PackageCheck, ArrowRight, RefreshCcw, Clock3, XCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { authHeaders, money } from '../lib/format';
import { LoadingState } from '../components/StatePanel';
import { useCart } from '../contexts/CartContext';
import type { Order } from '../types';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const { clearCart } = useCart();
  const seeded = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(seeded || null);
  const [loading, setLoading] = useState(!seeded);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, { headers: await authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load order');
      setOrder(data);
      if (data.payment_status === 'PAID') clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order');
    } finally {
      setLoading(false);
    }
  }, [id, clearCart]);

  const reconcile = async () => {
    if (!id) return;
    setChecking(true);
    try {
      await fetch('/api/payments?action=reconcile', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ order_id: Number(id), action: 'reconcile' }),
      });
      await load();
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    load().then(() => {
      // Auto reconcile once on mount if pending
      reconcile();
    });
  }, [id]);

  useEffect(() => {
    if (!order || order.payment_status !== 'PAYMENT_PENDING') return;
    const timer = window.setInterval(reconcile, 3000);
    return () => window.clearInterval(timer);
  }, [order?.payment_status, id]);

  if (loading) return <div className="page-shell"><LoadingState label="Confirming payment with the server" /></div>;

  const paid = order?.payment_status === 'PAID';
  const failed = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(String(order?.payment_status));
  const pending = !paid && !failed;

  return <div className="confirmation-page page-shell">
    <div className={`confirmation-mark ${failed ? 'failed' : pending ? 'pending' : ''}`}>{paid ? <Check /> : failed ? <XCircle /> : <Clock3 />}</div>
    <p className="eyebrow accent">{paid ? 'PAYMENT CONFIRMED' : failed ? 'PAYMENT NOT COMPLETE' : 'WAITING FOR UPI'}</p>
    <h1>{paid ? <>THE PAIR<br />IS YOURS.</> : failed ? <>PAYMENT<br />DID NOT LAND.</> : <>HOLD TIGHT.<br />CONFIRMING.</>}</h1>
    <p>{paid ? 'Cashfree confirmed this UPI payment on the server. Stock has been captured.' : failed ? (order?.failure_reason || 'The UPI attempt was cancelled, failed or expired. Nothing was charged.') : 'Redirect is only UX. We mark the order paid only after a signed webhook or official Cashfree reconciliation.'}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="confirmation-card">
      <PackageCheck />
      <div><span>Order reference</span><strong>{order?.order_number || `Order #${id}`}</strong></div>
      {order && <div><span>Order total</span><strong>{money(order.total)}</strong></div>}
      <div><span>Payment</span><strong>{order?.payment_status || 'UNKNOWN'}</strong></div>
    </div>
    {order?.cf_order_id && <p className="secure-note">Cashfree order {order.cf_order_id}</p>}
    <div className="confirmation-actions">
      {pending && <button className="button dark" onClick={reconcile} disabled={checking}><RefreshCcw /> {checking ? 'Checking Cashfree…' : 'Check payment status'}</button>}
      <Link className="button dark" to="/account?tab=orders">Track your order <ArrowRight /></Link>
      <Link className="button outline" to="/shop">Keep exploring</Link>
    </div>
  </div>;
}
