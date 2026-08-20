import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="page-shell legal-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to SOLEVAULT</Link>
      <header className="legal-header">
        <p className="eyebrow accent">LEGAL</p>
        <h1>PRIVACY POLICY</h1>
        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <section>
        <h2>1. Who We Are</h2>
        <p>SOLEVAULT is an independent footwear reseller operating in India. We source and sell original, brand-new footwear at discounted prices. We are not affiliated with any of the brands whose products we sell.</p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account information:</strong> Your name, email address, and phone number when you create an account or place an order.</li>
          <li><strong>Shipping address:</strong> Full name, address line 1 & 2, city, state, PIN code, and phone number for delivery.</li>
          <li><strong>Payment information:</strong> We do <em>not</em> store your UPI ID, bank account details, or card numbers. Payment processing is handled entirely by <strong>Cashfree Payments</strong> (RBI-licensed payment aggregator). We receive only a payment status confirmation and a bank reference number.</li>
          <li><strong>Wishlist and cart data:</strong> Products you save or add to cart are stored to personalize your experience.</li>
        </ul>
        <h3>2.2 Information Collected Automatically</h3>
        <ul>
          <li><strong>Device and browser information:</strong> IP address, browser type, screen resolution, and operating system for security and analytics.</li>
          <li><strong>Cookies and local storage:</strong> Session tokens for authentication, cart contents in browser local storage, and analytics cookies.</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>Process and fulfill your orders, including shipping and delivery</li>
          <li>Send order confirmation and status updates via email</li>
          <li>Verify payment status with Cashfree Payments</li>
          <li>Provide customer support and respond to inquiries</li>
          <li>Prevent fraud, abuse, and unauthorized access</li>
          <li>Improve our website performance and user experience</li>
        </ul>
      </section>

      <section>
        <h2>4. Payment Data Processing</h2>
        <p>SOLEVAULT uses <strong>Cashfree Payments</strong> as its payment service provider. When you make a UPI payment:</p>
        <ul>
          <li>You are redirected to Cashfree's secure checkout environment</li>
          <li>Cashfree processes your UPI payment directly — SOLEVAULT never sees or stores your UPI credentials</li>
          <li>We receive only the payment result (success/failure), amount, and a bank reference number</li>
          <li>All payment data is transmitted over HTTPS with HMAC-signed webhook verification</li>
        </ul>
        <p>Cashfree Payments is compliant with RBI guidelines and PCI DSS standards. For their privacy practices, visit <a href="https://www.cashfree.com/privacy" target="_blank" rel="noopener noreferrer">cashfree.com/privacy</a>.</p>
      </section>

      <section>
        <h2>5. Data Storage and Security</h2>
        <p>Your data is stored on <strong>Supabase</strong> (hosted on AWS infrastructure in India). Security measures include:</p>
        <ul>
          <li>Row-Level Security (RLS) policies ensuring you can only access your own data</li>
          <li>Service-role keys restricted to server-side API routes only</li>
          <li>HTTPS encryption for all data in transit</li>
          <li>HMAC-signed webhook verification for payment confirmations</li>
          <li>Optimistic concurrency control on inventory and order state</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Sharing</h2>
        <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. We share data only with:</p>
        <ul>
          <li><strong>Cashfree Payments:</strong> To process your payments (name, email, phone, order amount)</li>
          <li><strong>Delivery partners:</strong> Your shipping address and phone number for order delivery</li>
          <li><strong>Law enforcement:</strong> If required by law or to protect against fraud</li>
        </ul>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <ul>
          <li>Access and view your personal data through your account page</li>
          <li>Update your profile information (name, phone) at any time</li>
          <li>Request deletion of your account and associated data by contacting us</li>
          <li>Opt out of non-essential communications</li>
        </ul>
      </section>

      <section>
        <h2>8. Data Retention</h2>
        <p>Order and payment records are retained for 7 years as required by Indian tax and consumer protection laws. Account data is retained while your account is active and for 30 days after deletion request.</p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>For privacy-related queries, contact us at <a href="mailto:support@solevault.in">support@solevault.in</a>.</p>
      </section>
    </div>
  );
}
