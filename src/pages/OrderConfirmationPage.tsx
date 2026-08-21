import { useCallback, useEffect, useState } from 'react';
import { Check, PackageCheck, ArrowRight, RefreshCcw, Clock3, XCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { authHeaders, money } from '../lib/format';
import { LoadingState } from '../components/StatePanel';
import { useCart } from '../contexts/CartContext';
import ReceiptPrinterAnimation from '../components/ReceiptPrinterAnimation';
import type { Order } from '../types';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetId = id || searchParams.get('order_id') || searchParams.get('order_number') || searchParams.get('orderNumber');

  const { clearCart } = useCart();
  const seeded = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(seeded || null);
  const [loading, setLoading] = useState(!seeded);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showPrinter, setShowPrinter] = useState(false);

  const load = useCallback(async () => {
    if (!targetId) return;
    setError('');
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(targetId)}`, { headers: await authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load order');
      setOrder(data);
      if (data.payment_status === 'PAID') clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order');
    } finally {
      setLoading(false);
    }
  }, [targetId, clearCart]);

  const reconcile = async () => {
    if (!targetId && !order?.id) return;
    setChecking(true);
    try {
      await fetch('/api/payments?action=reconcile', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ order_id: order?.id || targetId, action: 'reconcile' }),
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
  }, [targetId]);

  useEffect(() => {
    if (!order || order.payment_status !== 'PAYMENT_PENDING') return;
    const timer = window.setInterval(reconcile, 3000);
    return () => window.clearInterval(timer);
  }, [order?.payment_status, targetId]);

  if (loading) return <div className="page-shell"><LoadingState label="Confirming payment with the server" /></div>;

  const paid = order?.payment_status === 'PAID';
  const failed = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(String(order?.payment_status));
  const pending = !paid && !failed;

  return (
    <div className="confirmation-page page-shell">
      <div className={`confirmation-mark ${failed ? 'failed' : pending ? 'pending' : ''}`}>
        {paid ? <Check /> : failed ? <XCircle /> : <Clock3 />}
      </div>
      <p className="eyebrow accent">
        {paid ? 'PAYMENT CONFIRMED' : failed ? 'PAYMENT NOT COMPLETE' : 'WAITING FOR UPI'}
      </p>

      {/* Print receipt button positioned directly below PAYMENT CONFIRMED text with exact zip styling */}
      {paid && (
        <div style={{ margin: '0.85rem 0 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="print-action-btn"
            onClick={() => setShowPrinter(true)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print receipt</span>
          </button>
        </div>
      )}

      <h1>
        {paid ? <>THE PAIR<br />IS YOURS.</> : failed ? <>PAYMENT<br />DID NOT LAND.</> : <>HOLD TIGHT.<br />CONFIRMING.</>}
      </h1>
      <p>
        {paid
          ? 'Cashfree confirmed this UPI payment on the server. Stock has been captured.'
          : failed
          ? (order?.failure_reason || 'The UPI attempt was cancelled, failed or expired. Nothing was charged.')
          : 'Redirect is only UX. We mark the order paid only after a signed webhook or official Cashfree reconciliation.'}
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="confirmation-card">
        <PackageCheck />
        <div><span>Order reference</span><strong>{order?.order_number || `Order #${targetId}`}</strong></div>
        {order && <div><span>Order total</span><strong>{money(order.total)}</strong></div>}
        <div><span>Payment</span><strong>{order?.payment_status || 'UNKNOWN'}</strong></div>
      </div>
      {order?.cf_order_id && <p className="secure-note">Cashfree order {order.cf_order_id}</p>}
      <div className="confirmation-actions">
        {pending && (
          <button className="button dark" onClick={reconcile} disabled={checking}>
            <RefreshCcw /> {checking ? 'Checking Cashfree…' : 'Check payment status'}
          </button>
        )}
        <Link className="button dark" to="/account?tab=orders">
          Track your order <ArrowRight />
        </Link>
        <Link className="button outline" to="/shop">
          Keep exploring
        </Link>
      </div>

      {/* On-Demand Thermal Receipt Printer Modal */}
      {showPrinter && order && (
        <ReceiptPrinterAnimation
          order={order}
          onClose={() => setShowPrinter(false)}
        />
      )}
    </div>
  );
}
