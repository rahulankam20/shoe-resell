import { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Mail, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta } from '../hooks/useSEOMeta';

interface FAQItem {
  id: string;
  category: 'authenticity' | 'shipping' | 'returns' | 'payments' | 'account';
  question: string;
  answer: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'auth-verification',
    category: 'authenticity',
    question: 'How do you verify that every pair is 100% authentic?',
    answer:
      'Every single pair in the SOLEVAULT archive undergoes a comprehensive multi-point physical authentication inspection prior to listing and dispatch. Our sneaker specialists inspect stitch density, material grain, UV-reactive markings, font typography on SKU size tags, and packaging integrity to ensure zero counterfeit pairs enter the vault.',
  },
  {
    id: 'auth-guarantee',
    category: 'authenticity',
    question: 'What happens if a pair turns out to be inauthentic?',
    answer:
      'We stand behind our curation with an unconditional 100% Money-Back Authenticity Guarantee. In the improbable event of an authentication dispute, return the item with its original SOLEVAULT security tag intact for an immediate full refund including all shipping costs.',
  },
  {
    id: 'auth-condition',
    category: 'authenticity',
    question: 'What condition are the shoes in? Are they brand new?',
    answer:
      'All shoes listed on SOLEVAULT are 100% brand-new, unworn, deadstock inventory sourced directly from authorized retail liquidations, distributor overstocks, and authenticated collector vaults. Original manufacturer boxes and retail accessories are included.',
  },
  {
    id: 'ship-timelines',
    category: 'shipping',
    question: 'How long does shipping take across India?',
    answer:
      'Orders are dispatched from our central facility within 1–2 business days of payment confirmation. Delivery typically takes 3–5 business days depending on your delivery PIN code. Real-time courier tracking links are provided via SMS and email immediately upon dispatch.',
  },
  {
    id: 'ship-packaging',
    category: 'shipping',
    question: 'How are the sneakers packaged for transit?',
    answer:
      'Every pair is double-boxed in high-strength corrugated shipping containers with moisture-resistant bubble cushioning. This guarantees the original sneaker box arrives in collector-grade condition without dents or label damage.',
  },
  {
    id: 'ship-charges',
    category: 'shipping',
    question: 'What are the shipping charges?',
    answer:
      'We offer FREE standard shipping on all orders totaling ₹3,000 or above across India. For orders below ₹3,000, a flat nominal delivery fee of ₹149 is calculated at checkout.',
  },
  {
    id: 'return-window',
    category: 'returns',
    question: 'What is your return and exchange policy?',
    answer:
      'We accept returns within 7 calendar days of delivery. Items must be completely unworn, unaltered, and returned with the original shoebox, packaging, and tamper-evident SOLEVAULT security tags intact. Once inspected at our intake center, your refund is credited within 24–48 hours.',
  },
  {
    id: 'pay-methods',
    category: 'payments',
    question: 'What payment methods are supported and is payment secure?',
    answer:
      'We support all major Indian UPI applications (Google Pay, PhonePe, Paytm, CRED, BHIM), Net Banking across 50+ banks, Credit/Debit cards (Visa, Mastercard, RuPay), and wallet payments processed via RBI-licensed Cashfree Payments with end-to-end 256-bit SSL encryption.',
  },
  {
    id: 'account-guest',
    category: 'account',
    question: 'Do I need an account to purchase from SOLEVAULT?',
    answer:
      'No. You can complete checkout seamlessly with your email and phone number. However, creating a free SOLEVAULT account enables faster repeat checkout, order history telemetry, and priority access to limited archival drops.',
  },
  {
    id: 'account-tracking',
    category: 'account',
    question: 'How do I track my order status?',
    answer:
      'You can track your order anytime from the Member Vault under "Your Orders" if you have an account, or by navigating to the Order Confirmation link sent to your registered email and mobile number.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'authenticity', label: 'Authenticity' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'returns', label: 'Returns & Refunds' },
  { id: 'payments', label: 'Payments' },
  { id: 'account', label: 'Account & Orders' },
];

export default function FAQsPage() {
  useSEOMeta({
    title: 'Frequently Asked Questions & Help | SOLEVAULT',
    description: 'Find answers about sneaker authenticity verification, pan-India delivery, return policies, secure UPI payments, and order tracking.',
    url: '/faqs',
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['auth-verification', 'ship-timelines']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFAQs = useMemo(() => {
    return FAQS_DATA.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="faqs-page page-shell">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} /> Back to SOLEVAULT
      </Link>

      <header className="faqs-header">
        <p className="eyebrow accent">SUPPORT ARCHIVE</p>
        <h1>FREQUENTLY ASKED<br /><span>QUESTIONS.</span></h1>
        <p className="faqs-intro">
          Everything you need to know about our verification process, deadstock curation, secure UPI payments, and nationwide delivery.
        </p>

        {/* Search filter input */}
        <div className="faqs-search-bar">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search questions (e.g. authenticity, returns, sizing)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search FAQs"
          />
        </div>

        {/* Category Pills */}
        <div className="faqs-category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`faqs-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Accordion FAQ list */}
      <section className="faqs-list" aria-label="FAQ Accordion List">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => {
            const isOpen = openIds.has(faq.id);
            return (
              <article
                key={faq.id}
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <div className="faq-chevron-icon">
                    <ChevronDown size={18} />
                  </div>
                </button>
                {isOpen && (
                  <div className="faq-answer-body">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="faqs-empty">
            <HelpCircle size={32} />
            <p>No matching questions found for "{searchQuery}".</p>
            <button
              type="button"
              className="button outline small"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Reset search
            </button>
          </div>
        )}
      </section>

      {/* Direct Support CTA Card */}
      <div className="faqs-support-card">
        <div className="faqs-support-icon">
          <ShieldCheck size={24} />
        </div>
        <div className="faqs-support-info">
          <h3>Still have questions?</h3>
          <p>Our dedicated sneaker specialists are available Monday to Saturday, 10:00 AM – 7:00 PM IST.</p>
        </div>
        <a
          href="mailto:support@solevault.in"
          className="button dark"
        >
          <Mail size={16} /> Contact Support
        </a>
      </div>
    </div>
  );
}
