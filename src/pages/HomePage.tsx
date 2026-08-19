import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, BadgeCheck, Box, CreditCard, Gem, SearchCheck, ShieldCheck, Sparkles, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollSequence from '../components/ScrollSequence';
import ProductCard from '../components/ProductCard';
import { ErrorState, LoadingState } from '../components/StatePanel';
import type { Brand, Category, Product } from '../types';

interface Storefront {
  brands: Brand[];
  categories: Category[];
  featured: Product[];
  deals: Product[];
}

export default function HomePage() {
  const [data, setData] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchStorefront = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/storefront');
      if (!response.ok) throw new Error('The vault could not be opened');
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorefront();
  }, [fetchStorefront]);

  const rotationDeg = Math.round(progress * 360);

  return (
    <>
      <ScrollSequence
        fallbackImage="/images/solevault-hero.webp"
        alt="Premium sneaker 360 interactive rotation"
        onProgress={setProgress}
      >
        {/* Story Overlay Layer — Apple-style floating cards leaving the shoe completely unobstructed */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            padding: 'clamp(1.5rem, 4vw, 4rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Bar: Telemetry & Interactive Chapter Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            {/* Top Left: Active Chapter Brand Badge */}
            <div
              style={{
                background: 'rgba(15, 15, 15, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.75rem 1.25rem',
                color: '#fff',
                maxWidth: '380px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                pointerEvents: 'auto',
                transition: 'all 0.4s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', letterSpacing: '0.15em', fontWeight: 800, color: '#ff4d23', textTransform: 'uppercase', marginBottom: '4px' }}>
                <Sparkles size={13} />
                {progress < 0.28
                  ? '01 · 360° PRECISION REVEAL'
                  : progress < 0.55
                  ? '02 · ANATOMY & CRAFT'
                  : progress < 0.82
                  ? '03 · VALUE REVOLUTION'
                  : '04 · VAULT UNLOCKED'}
              </div>
              <h2 style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>
                {progress < 0.28
                  ? 'DEADSTOCK ICON.'
                  : progress < 0.55
                  ? 'ENGINEERED DETAIL.'
                  : progress < 0.82
                  ? 'UP TO 75% OFF.'
                  : 'YOUR PAIR AWAITS.'}
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#bbb', lineHeight: 1.5 }}>
                {progress < 0.28
                  ? '100% genuine sneakers hand-inspected before entering the vault.'
                  : progress < 0.55
                  ? 'Precision stitch work, responsive cushioning & archival colorways.'
                  : progress < 0.82
                  ? 'Direct-from-source pricing without retail hype taxes.'
                  : 'Instant Cashfree UPI checkout with real-time stock protection.'}
              </p>
            </div>

            {/* Top Right: 360° Rotation Telemetry Gauge */}
            <div
              style={{
                background: 'rgba(15, 15, 15, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              <Compass size={15} style={{ color: '#ff4d23', transform: `rotate(${rotationDeg}deg)`, transition: 'transform 0.1s linear' }} />
              <span>{rotationDeg}° ROTATION</span>
            </div>
          </div>

          {/* Bottom Dock: Dynamic Call To Action and Navigation */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '1rem',
              width: '100%',
              pointerEvents: 'auto',
            }}
          >
            {/* Action Bar */}
            <div
              style={{
                background: 'rgba(12, 12, 12, 0.82)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '1rem 1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.25rem',
                width: '100%',
                maxWidth: '850px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#ff4d23', fontWeight: 800, textTransform: 'uppercase' }}>
                  ORIGINAL FOOTWEAR · UNREAL PRICES
                </span>
                <div style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {progress > 0.75 ? 'READY TO UPGRADE YOUR ROTATION?' : 'SCROLL TO EXPLORE EVERY ANGLE'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link
                  className="button primary"
                  to="/shop"
                  style={{ minHeight: '42px', padding: '0 1.2rem', fontSize: '10px' }}
                >
                  Shop Collection <ArrowRight size={15} />
                </Link>
                <Link
                  className="button ghost-light"
                  to="/shop?discount=50&sort=discount"
                  style={{ minHeight: '42px', padding: '0 1.2rem', fontSize: '10px' }}
                >
                  Steals 50–75% Off
                </Link>
              </div>
            </div>

            {/* Scroll Indicator Cue */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              <ArrowDown size={14} style={{ color: '#ff4d23' }} />
              <span>Scroll down to rotate sneaker · {Math.round(progress * 100)}% viewed</span>
            </div>
          </div>
        </div>
      </ScrollSequence>

      {/* Brand Manifesto */}
      <section className="manifesto section-pad">
        <p className="section-index">01 / The SOLEVAULT difference</p>
        <div>
          <h2>
            THE PAIRS YOU WANT.
            <br />
            <span>THE PRICES YOU DIDN'T EXPECT.</span>
          </h2>
          <p>
            We source 100% brand-new, authenticated footwear directly from verified distribution channels, inspect every sole and stitch, and price it without the retail hype markups.
          </p>
        </div>
      </section>

      {loading && <LoadingState label="Curating the collection" />}
      {error && <ErrorState message={error} retry={fetchStorefront} />}

      {data && (
        <>
          {/* Brand Grid */}
          <section className="brand-section section-pad" id="brands">
            <div className="section-head">
              <div>
                <p className="eyebrow accent">THE NAMES YOU KNOW</p>
                <h2>
                  BIG BRANDS.
                  <br />
                  BETTER NUMBERS.
                </h2>
              </div>
              <Link className="text-link" to="/shop">
                View all brands <ArrowRight />
              </Link>
            </div>
            <div className="brand-grid">
              {data.brands.map((brand, index) => (
                <Link className="brand-card" key={brand.id} to={`/shop?brand=${brand.slug}`}>
                  <img src={brand.hero_image || '/images/solevault-hero.webp'} alt="" loading="lazy" />
                  <div className="brand-overlay">
                    <span>0{index + 1}</span>
                    <h3>{brand.name}</h3>
                    <p>{brand.product_count} pairs in the vault</p>
                    <ArrowRight />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Categories Strip */}
          <section className="category-section section-pad">
            <div className="section-head">
              <div>
                <p className="eyebrow">SHOP BY MOVEMENT</p>
                <h2>
                  MADE FOR
                  <br />
                  YOUR EVERY DAY.
                </h2>
              </div>
            </div>
            <div className="category-strip">
              {data.categories.map((category) => (
                <Link key={category.id} className="category-card" to={`/shop?category=${category.slug}`}>
                  <img src={category.image} alt={`${category.name} footwear`} loading="lazy" />
                  <div>
                    <p>{category.description}</p>
                    <h3>{category.name}</h3>
                    <ArrowRight />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Deal Banner */}
          <section className="deal-banner">
            <div className="deal-image">
              <img src={data.deals[0]?.images[0]} alt="Featured footwear deal" loading="lazy" />
            </div>
            <div className="deal-copy">
              <p className="eyebrow accent">THE PRICE DROP</p>
              <h2>
                BIG BRANDS.
                <br />
                <span>SMALLER PRICES.</span>
              </h2>
              <p>
                Past-season icons and current essentials. Always brand new. Always checked. Never ordinary.
              </p>
              <Link className="button primary" to="/shop?discount=50&sort=discount">
                Shop 50–75% off <ArrowRight size={18} />
              </Link>
            </div>
          </section>

          {/* Trust Value Props */}
          <section className="trust-section section-pad">
            <p className="section-index">02 / Why shop SOLEVAULT</p>
            <div className="trust-grid">
              {[
                [BadgeCheck, '100% ORIGINAL', 'Sourced with care'],
                [Box, 'BRAND NEW', 'Unworn. Box fresh.'],
                [Gem, '50–75% OFF MRP', 'Premium without the premium'],
                [SearchCheck, 'QUALITY CHECKED', 'Every pair inspected'],
                [ShieldCheck, 'SECURE SHOPPING', 'Protected from cart to door'],
              ].map(([Icon, title, copy]) => {
                const TrustIcon = Icon as typeof BadgeCheck;
                return (
                  <div className="trust-item" key={String(title)}>
                    <TrustIcon />
                    <h3>{String(title)}</h3>
                    <p>{String(copy)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Featured Product Grid */}
          <section className="featured-section section-pad">
            <div className="section-head">
              <div>
                <p className="eyebrow accent">CURATED THIS WEEK</p>
                <h2>THE STEALS EDIT.</h2>
              </div>
              <Link className="text-link" to="/shop?sort=popular">
                Shop the edit <ArrowRight />
              </Link>
            </div>
            <div className="product-grid">
              {data.featured.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="final-cta">
            <div>
              <p className="eyebrow">THE NEXT STEP IS YOURS</p>
              <h2>
                YOUR NEXT PAIR
                <br />
                SHOULDN'T COST
                <br />
                <span>A FORTUNE.</span>
              </h2>
              <Link className="button light" to="/shop">
                Enter the vault <ArrowRight />
              </Link>
            </div>
            <CreditCard className="cta-mark" aria-hidden="true" />
          </section>
        </>
      )}
    </>
  );
}
