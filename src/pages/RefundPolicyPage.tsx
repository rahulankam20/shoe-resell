import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta } from '../hooks/useSEOMeta';

export default function RefundPolicyPage() {
  useSEOMeta({
    title: 'Refund & Returns Policy | SOLEVAULT',
    description: 'Understand the SOLEVAULT return window, 100% money-back authenticity guarantee, and refund procedures.',
    url: '/refund-policy',
  });
  return (
    <div className="page-shell legal-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to SOLEVAULT</Link>
      <header className="legal-header">
        <p className="eyebrow accent">LEGAL</p>
        <h1>REFUND & RETURNS POLICY</h1>
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <section>
        <h2>1. Returns Window</h2>
        <p>You: You may return unused products within <strong>7 days</strong> of delivery. Products must be in their original condition with all tags attached and original packaging intact.</p>
      </section>

      <section>
        <h2>2. Non-Returnable Items</h2>
        <ul>
          <li>Products that have been worn, washed, or altered</li>
          <li>Products missing original packaging or tags</li>
          <li>Products returned after the 7-day window</li>
        </ul>
      </section>

      <section>
        <h2>3. How to Initiate a Return</h2>
        <ol>
          <li>Go to <strong>My Account → Orders</strong></li>
          <li>Select the order you wish to return</li>
          <li>Contact us at <a href="mailto:support@solevault.in">support@solevault.in</a> with your order number and reason for return</li>
          <li>Our team will review and process your request within 2 business days</li>
        </ol>
      </section>

      <section>
        <h2>4. Refund Process</h2>
        <p>Refunds are processed through <strong>Cashfree Payments</strong>, our payment gateway partner:</p>
        <ul>
          <li><strong>Full refund:</strong> If the return is approved, the entire order amount (including shipping if applicable) is refunded to your original payment method</li>
          <li><strong>Partial refund:</strong> If only some items in an order are returned, a partial refund is processed for the returned items</li>
          <li><strong>Refund timeline:</strong> Refunds are initiated within 2 business days of return approval. Cashfree typically processes UPI refunds within 3–5 business days</li>
        </ul>
      </section>

      <section>
        <h2>5. Failed Payments</h2>
        <p>If a payment fails during checkout:</p>
        <ul>
          <li>No charge is made to your account</li>
          <li>Reserved stock is automatically released</li>
          <li>The order is marked as failed/cancelled</li>
          <li>You can retry checkout immediately</li>
        </ul>
      </section>

      <section>
        <h2>6. Duplicate Payments</h2>
        <p>Our checkout system uses idempotency keys to prevent duplicate charges. If you believe you have been charged twice for the same order, contact us immediately with your order number and bank statement. We will reconcile with Cashfree and refund any duplicate charges.</p>
      </section>

      <section>
        <h2>7. Cancellation by SOLEVAULT</h2>
        <p>We may cancel an order if:</p>
        <ul>
          <li>The product is found to be out of stock after payment (full refund issued immediately)</li>
          <li>Suspected fraudulent activity is detected</li>
          <li>Payment verification fails after reconciliation</li>
        </ul>
      </section>

      <section>
        <h2>8. Refund Status</h2>
        <p>You can check refund status in <strong>My Account → Orders</strong>. Refund statuses:</p>
        <ul>
          <li><strong>Created:</strong> Refund request received</li>
          <li><strong>Pending:</strong> Refund submitted to Cashfree for processing</li>
          <li><strong>Success:</strong> Refund completed — funds should appear in your account</li>
          <li><strong>Failed:</strong> Refund processing failed — contact support</li>
        </ul>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>For return and refund queries, contact <a href="mailto:support@solevault.in">support@solevault.in</a>.</p>
      </section>
    </div>
  );
}
