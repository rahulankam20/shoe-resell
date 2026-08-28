import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Truck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta } from '../hooks/useSEOMeta';
import Reveal from '../components/motion/Reveal';

export default function AboutPage() {
  useSEOMeta({
    title: 'About Us & Authenticity Standard | SOLEVAULT',
    description: 'Learn about the SOLEVAULT mission: bridging luxury streetwear and liquidation pricing with 100% verified original footwear.',
    url: '/about',
  });

  return (
    <div className="about-page page-shell">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} /> Back to SOLEVAULT
      </Link>

      <header className="about-hero">
        <p className="eyebrow accent">ARCHIVE · HERITAGE · VERIFICATION</p>
        <h1>ABOUT<br /><span>SOLEVAULT.</span></h1>
        <p className="about-tagline">
          Original footwear at liquidation pricing. Curated hard. Authenticated with zero compromise.
        </p>
      </header>

      <section className="about-pillars-grid">
        <Reveal from="fold">
          <article className="about-pillar-card">
            <div className="about-pillar-icon">
              <Sparkles size={22} />
            </div>
            <h3>The Mission</h3>
            <p>
              SOLEVAULT was founded to solve a broken resale market. We bypass secondary inflation by sourcing authentic deadstock pairs directly from authorized liquidations, distributor overstocks, and authenticated vaults, passing 50–75% savings directly to collectors.
            </p>
          </article>
        </Reveal>

        <Reveal from="fold" delay={90}>
          <article className="about-pillar-card">
            <div className="about-pillar-icon">
              <ShieldCheck size={22} />
            </div>
            <h3>Physical Verification</h3>
            <p>
              Every single silhouette undergoes a rigorous multi-point physical authentication inspection. Our specialists examine stitch tension, material grain, UV-reactive markings, font kerning on factory SKU tags, and packaging integrity before any pair leaves our facility.
            </p>
          </article>
        </Reveal>

        <Reveal from="fold" delay={180}>
          <article className="about-pillar-card">
            <div className="about-pillar-icon">
              <Truck size={22} />
            </div>
            <h3>Collector-Grade Shipping</h3>
            <p>
              We treat every order as a grail piece. All shoes are double-boxed in high-impact corrugated outer containers with moisture-sealed packaging, ensuring pristine shoeboxes and tamper-evident delivery across India.
            </p>
          </article>
        </Reveal>
      </section>

      {/* Brand Narrative Section */}
      <section className="about-story-section">
        <div className="about-story-text">
          <p className="eyebrow">OUR ETHOS</p>
          <h2>AUTHENTICITY IS NON-NEGOTIABLE.</h2>
          <p>
            In an era of counterfeit saturation, confidence in what you wear is paramount. We do not participate in bidding wars, hidden service charges, or dubious consignment drops. Every shoe shown in our catalog is physically in-stock, inspected, and backed by an unconditional 100% money-back guarantee.
          </p>
          <ul className="about-checklist">
            <li><CheckCircle2 size={16} /> 100% Brand-New & Unworn Deadstock</li>
            <li><CheckCircle2 size={16} /> Multi-Point Physical In-Hand Authentication</li>
            <li><CheckCircle2 size={16} /> Real-Time UPI & Cashfree RBI-Licensed Security</li>
            <li><CheckCircle2 size={16} /> 7-Day Hassle-Free Return Policy</li>
          </ul>
        </div>
      </section>

      {/* Explore Collection CTA */}
      <div className="about-cta-banner">
        <div>
          <h2>READY TO ENTER THE VAULT?</h2>
          <p>Discover our daily-updated archive of authentic icons and running classics.</p>
        </div>
        <div className="about-cta-buttons">
          <Link className="button dark" to="/shop">
            Explore The Vault <ArrowRight size={16} />
          </Link>
          <Link className="button outline" to="/gallery">
            View Aero Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
