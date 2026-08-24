import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta } from '../hooks/useSEOMeta';

export default function TermsOfServicePage() {
  useSEOMeta({
    title: 'Terms of Service | SOLEVAULT',
    description: 'Read the terms and conditions governing the purchase of authentic sneakers, payments, delivery, and use of the SOLEVAULT platform.',
    url: '/terms-of-service',
  });
  return (
    <div className="page-shell legal-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to SOLEVAULT</Link>
      <header className="legal-header">
        <p className="eyebrow accent">LEGAL</p>
        <h1>TERMS OF SERVICE</h1>
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>By using SOLEVAULT (the website and service), you agree to these Terms of Service. If you do not agree, please do not use our service.</p>
      </section>

      <section>
        <h2>2. About SOLEVAULT</h2>
        <p>SOLEVAULT is an independent footwear reseller. We sell original, brand-new footwear sourced from authorized channels. We are not affiliated with, endorsed by, or connected to any of the brands whose products we sell. All brand names and trademarks belong to their respective owners.</p>
      </section>

      <section>
        <h2>3. Account Registration</h2>
        <p>You must create an account to place orders. You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information. SOLEVAULT reserves the right to suspend accounts that violate these terms.</p>
      </section>

      <section>
        <h2>4. Products and Pricing</h2>
        <ul>
          <li>All products are original and brand-new</li>
          <li>Prices are displayed in Indian Rupees (INR) inclusive of all applicable taxes</li>
          <li>MRP (Maximum Retail Price) is shown for comparison; our sale price may be lower</li>
          <li>Prices and availability are subject to change without prior notice</li>
          <li>Product images are representative; actual product may vary slightly</li>
        </ul>
      </section>

      <section>
        <h2>5. Ordering and Payment</h2>
        <ul>
          <li>Orders are confirmed only after successful UPI payment via Cashfree Payments</li>
          <li>Stock is reserved during checkout and captured upon payment confirmation</li>
          <li>If payment fails, reserved stock is released and the order is cancelled</li>
          <li>We use server-side price calculation — frontend totals are not trusted</li>
          <li>Each checkout is idempotent — accidental retries will not create duplicate charges</li>
        </ul>
      </section>

      <section>
        <h2>6. Shipping</h2>
        <ul>
          <li>Free shipping on orders above ₹3,000</li>
          <li>Shipping charge of ₹149 for orders below ₹3,000</li>
          <li>Orders are dispatched within 1–2 business days after payment confirmation</li>
          <li>Delivery timelines depend on your location and the courier partner</li>
        </ul>
      </section>

      <section>
        <h2>7. Returns and Refunds</h2>
        <p>Please refer to our <Link to="/refund-policy">Refund & Returns Policy</Link> for complete details.</p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>
        <p>SOLEVAULT's liability is limited to the amount paid for the product in question. We are not liable for indirect, incidental, or consequential damages arising from the use of our service.</p>
      </section>

      <section>
        <h2>9. Intellectual Property</h2>
        <p>The SOLEVAULT name, logo, and website design are our intellectual property. Product images and brand names belong to their respective owners and are used for identification purposes only.</p>
      </section>

      <section>
        <h2>10. Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
      </section>

      <section>
        <h2>11. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>For questions about these terms, contact <a href="mailto:support@solevault.in">support@solevault.in</a>.</p>
      </section>
    </div>
  );
}
