import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ShippingPolicyPage() {
  return (
    <div className="page-shell legal-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to SOLEVAULT</Link>
      <header className="legal-header">
        <p className="eyebrow accent">LEGAL</p>
        <h1>SHIPPING POLICY</h1>
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <section>
        <h2>1. Shipping Rates</h2>
        <ul>
          <li><strong>Free shipping</strong> on all orders above ₹3,000</li>
          <li><strong>₹149</strong> shipping charge on orders below ₹3,000</li>
        </ul>
        <p>Shipping charges are calculated at checkout and included in the order total before payment.</p>
      </section>

      <section>
        <h2>2. Dispatch Timeline</h2>
        <p>Orders are dispatched within <strong>1–2 business days</strong> after payment confirmation. You will receive a notification when your order is shipped.</p>
      </section>

      <section>
        <h2>3. Delivery Timeline</h2>
        <p>Estimated delivery times after dispatch:</p>
        <ul>
          <li><strong>Metro cities:</strong> 2–4 business days</li>
          <li><strong>Tier 2 & 3 cities:</strong> 4–7 business days</li>
          <li><strong>Remote areas:</strong> 7–10 business days</li>
        </ul>
        <p>These are estimates and may vary due to factors beyond our control (weather, strikes, festivals, etc.).</p>
      </section>

      <section>
        <h2>4. Shipping Coverage</h2>
        <p>We currently ship to all serviceable PIN codes in India. If your PIN code is not serviceable, you will be notified at checkout.</p>
      </section>

      <section>
        <h2>5. Order Tracking</h2>
        <p>Once shipped, you can track your order status in <strong>My Account → Orders</strong>. Order statuses:</p>
        <ul>
          <li><strong>Pending:</strong> Order created, awaiting payment</li>
          <li><strong>Placed:</strong> Payment confirmed, order being prepared</li>
          <li><strong>Confirmed:</strong> Order verified and queued for dispatch</li>
          <li><strong>Shipped:</strong> Order dispatched with courier partner</li>
          <li><strong>Delivered:</strong> Order delivered to your shipping address</li>
        </ul>
      </section>

      <section>
        <h2>6. Delivery Address</h2>
        <p>Please ensure your shipping address is complete and accurate. SOLEVAULT is not responsible for delays or non-delivery due to incorrect addresses. Address changes after dispatch may not be possible.</p>
      </section>

      <section>
        <h2>7. Damaged in Transit</h2>
        <p>If your order arrives damaged, contact us within 48 hours of delivery with photos of the damage. We will arrange a replacement or full refund.</p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>For shipping queries, contact <a href="mailto:support@solevault.in">support@solevault.in</a>.</p>
      </section>
    </div>
  );
}
