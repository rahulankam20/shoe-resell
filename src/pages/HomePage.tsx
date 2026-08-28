import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Box, CreditCard, Gem, SearchCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroScrollExperience from '../components/HeroScrollExperience';
import ProductCard from '../components/ProductCard';
import { ErrorState, LoadingState } from '../components/StatePanel';
import Marquee from '../components/motion/Marquee';
import HomeScrollScenes from '../components/motion/HomeScrollScenes';
import AnimatedSection, { AnimatedCounter, ParallaxLayer } from '../components/ui/AnimatedSection';
import ScrollProgress from '../components/ui/ScrollProgress';
import MagneticButton from '../components/ui/MagneticButton';
import { getProductImage, handleImageError, BRAND_FALLBACKS } from '../lib/images';
import { useSEOMeta } from '../hooks/useSEOMeta';
import type { Brand, Category, Product } from '../types';

interface Storefront {
  brands: Brand[];
  categories: Category[];
  featured: Product[];
  deals: Product[];
}

const TICKER = [
  '100% ORIGINAL',
  'BRAND NEW DEADSTOCK',
  '50–75% OFF MRP',
  'HAND-CHECKED',
  'VAULT PRICING',
  'INDIA-WIDE SHIPPING',
];

export default function HomePage() {
  useSEOMeta({
    title: 'Buy & Sell Premium Sneakers | SOLEVAULT',
    description: 'Authentic sneaker marketplace offering curated original footwear at liquidation pricing. 100% verified authentic deadstock sneakers, running shoes, and street classics.',
    url: '/',
  });

  const [data, setData] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <>
      {/* Interactive Dual-Tone Scroll Progress Bar */}
      <ScrollProgress />

      {/* Sacred Hero Canvas Scroll Experience */}
      <HeroScrollExperience />

      {/* Primary Marquee Ticker */}
      <Marquee items={TICKER} className="sv-marquee-paper" />

      <div className="js-home-motion">
        <HomeScrollScenes active={Boolean(data)} />

        {/* ── Brand Manifesto with Floating Thin-Bordered Geometric Shapes & Shimmer ── */}
        <section className="manifesto section-pad kiro-manifesto">
          <div className="floating-decorative-elements" aria-hidden="true">
            <span className="floating-shape shape-1" />
            <span className="floating-shape shape-2" />
            <span className="floating-shape shape-3" />
            <span className="floating-shape shape-4" />
          </div>
          <AnimatedSection animation="slide-left" delay={0}>
            <p className="section-index">01 / The SOLEVAULT difference</p>
          </AnimatedSection>
          <div>
            <AnimatedSection animation="slide-up" delay={0.1}>
              <h2>
                THE PAIRS YOU WANT.
                <br />
                <span className="text-shimmer">THE PRICES YOU DIDN'T EXPECT.</span>
              </h2>
            </AnimatedSection>
            <AnimatedSection animation="slide-right" delay={0.22}>
              <p>
                We source 100% brand-new, authenticated footwear directly from verified distribution channels, inspect every sole and stitch, and price it without the retail hype markups.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {loading && <LoadingState label="Curating the collection" />}
        {error && <ErrorState message={error} retry={fetchStorefront} />}

        {data && (
          <>
            {/* ── Dynamic Stats Band with Animated Counters ── */}
            <section className="stats-band">
              <AnimatedSection animation="slide-up" delay={0}>
                <article>
                  <strong>
                    <AnimatedCounter end={50} prefix="" suffix="–75%" duration={1600} />
                  </strong>
                  <span>Off MRP, every day</span>
                </article>
              </AnimatedSection>
              <AnimatedSection animation="slide-up" delay={0.08}>
                <article>
                  <strong>
                    <AnimatedCounter end={100} suffix="%" duration={1800} />
                  </strong>
                  <span>Original, never replica</span>
                </article>
              </AnimatedSection>
              <AnimatedSection animation="slide-up" delay={0.16}>
                <article>
                  <strong>
                    <AnimatedCounter end={1} suffix="–2 days" duration={1400} />
                  </strong>
                  <span>Dispatch window</span>
                </article>
              </AnimatedSection>
              <AnimatedSection animation="slide-up" delay={0.24}>
                <article>
                  <strong>
                    <AnimatedCounter end={7} suffix=" days" duration={1500} />
                  </strong>
                  <span>Easy returns</span>
                </article>
              </AnimatedSection>
            </section>

            {/* ── Brand Grid with 3D Stagger Entrance ── */}
            <section className="brand-section section-pad" id="brands">
              <AnimatedSection animation="fade" className="section-head">
                <div>
                  <AnimatedSection animation="slide-up" delay={0}>
                    <p className="eyebrow accent">THE NAMES YOU KNOW</p>
                  </AnimatedSection>
                  <AnimatedSection animation="slide-up" delay={0.08}>
                    <h2>
                      BIG BRANDS.
                      <br />
                      BETTER NUMBERS.
                    </h2>
                  </AnimatedSection>
                </div>
                <AnimatedSection animation="slide-right" delay={0.15}>
                  <MagneticButton as={Link} strength={0.3} className="text-link" to="/shop">
                    View all brands <ArrowRight />
                  </MagneticButton>
                </AnimatedSection>
              </AnimatedSection>
              
              <div className="brand-grid">
                {data.brands.map((brand, index) => {
                  const bHero = brand.hero_image || BRAND_FALLBACKS[brand.slug] || '/images/solevault-hero.webp';
                  return (
                    <AnimatedSection
                      key={brand.id || brand.slug}
                      animation="scale"
                      delay={index * 0.09}
                    >
                      <Link className="brand-card" to={`/shop?brand=${brand.slug}`}>
                        <img
                          src={bHero}
                          alt={brand.name}
                          loading="lazy"
                          onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
                        />
                        <div className="brand-overlay">
                          <span>0{index + 1}</span>
                          <h3>{brand.name}</h3>
                          <p>{brand.product_count} pairs in the vault</p>
                          <ArrowRight />
                        </div>
                        <div className="brand-shine" />
                      </Link>
                    </AnimatedSection>
                  );
                })}
              </div>
            </section>

            {/* ── Categories Strip with Horizontal Rail & Stagger Reveal ── */}
            <section className="category-section section-pad" id="categories">
              <AnimatedSection animation="fade" className="section-head">
                <div>
                  <AnimatedSection animation="slide-up" delay={0}>
                    <p className="eyebrow">SHOP BY MOVEMENT</p>
                  </AnimatedSection>
                  <AnimatedSection animation="slide-up" delay={0.08}>
                    <h2>
                      MADE FOR
                      <br />
                      YOUR EVERY DAY.
                    </h2>
                  </AnimatedSection>
                </div>
                <p className="section-hint">Scroll to travel the rail</p>
              </AnimatedSection>
              
              <div className="category-strip">
                {data.categories.map((category, index) => {
                  const catImg = category.image || `/images/category-${category.slug}.jpg`;
                  return (
                    <AnimatedSection
                      key={category.id || category.slug}
                      animation="slide-up"
                      delay={index * 0.08}
                    >
                      <Link className="category-card" to={`/shop?category=${category.slug}`}>
                        <img
                          src={catImg}
                          alt={`${category.name} footwear`}
                          loading="lazy"
                          onError={(e) => handleImageError(e, '/images/category-sneakers.jpg')}
                        />
                        <div>
                          <p>{category.description || 'Verified Footwear'}</p>
                          <h3>{category.name}</h3>
                          <ArrowRight />
                        </div>
                      </Link>
                    </AnimatedSection>
                  );
                })}
              </div>
            </section>

            {/* ── Deal Banner with Parallax Layer & Magnetic Button ── */}
            <section className="deal-banner">
              <ParallaxLayer speed={0.35} className="deal-image-parallax">
                <div className="deal-image">
                  <img
                    src={data.deals[0] ? getProductImage(data.deals[0]) : '/images/products/adidas-ultraboost.jpg'}
                    alt="Featured footwear deal"
                    loading="lazy"
                    onError={(e) => handleImageError(e, '/images/products/adidas-ultraboost.jpg')}
                  />
                </div>
              </ParallaxLayer>
              <div className="deal-copy">
                <AnimatedSection animation="slide-up" delay={0}>
                  <p className="eyebrow accent">THE PRICE DROP</p>
                </AnimatedSection>
                <AnimatedSection animation="slide-up" delay={0.08}>
                  <h2>
                    BIG BRANDS.
                    <br />
                    <span>SMALLER PRICES.</span>
                  </h2>
                </AnimatedSection>
                <AnimatedSection animation="slide-up" delay={0.16}>
                  <p>
                    Past-season icons and current essentials. Always brand new. Always checked. Never ordinary.
                  </p>
                </AnimatedSection>
                <AnimatedSection animation="scale" delay={0.24}>
                  <MagneticButton as={Link} strength={0.25} className="button primary" to="/shop?discount=50&sort=discount">
                    Shop 50–75% off <ArrowRight size={18} />
                  </MagneticButton>
                </AnimatedSection>
              </div>
            </section>

            {/* ── Trust Value Props with Interactive Glow & Hover Scale ── */}
            <section className="trust-section section-pad">
              <AnimatedSection animation="slide-left">
                <p className="section-index">02 / Why shop SOLEVAULT</p>
              </AnimatedSection>
              <div className="trust-grid">
                {[
                  [BadgeCheck, '100% ORIGINAL', 'Sourced with care'],
                  [Box, 'BRAND NEW', 'Unworn. Box fresh.'],
                  [Gem, '50–75% OFF MRP', 'Premium without the premium'],
                  [SearchCheck, 'QUALITY CHECKED', 'Every pair inspected'],
                  [ShieldCheck, 'SECURE SHOPPING', 'Protected from cart to door'],
                ].map(([Icon, title, copy], index) => {
                  const TrustIcon = Icon as typeof BadgeCheck;
                  return (
                    <AnimatedSection
                      key={String(title)}
                      animation="slide-up"
                      delay={index * 0.08}
                    >
                      <div className="trust-item">
                        <TrustIcon />
                        <h3>{String(title)}</h3>
                        <p>{String(copy)}</p>
                      </div>
                    </AnimatedSection>
                  );
                })}
              </div>
            </section>

            {/* ── Featured Steals Edit with Staggered 3D Product Cards ── */}
            <section className="featured-section section-pad">
              <AnimatedSection animation="fade" className="section-head">
                <div>
                  <AnimatedSection animation="slide-up" delay={0}>
                    <p className="eyebrow accent">CURATED THIS WEEK</p>
                  </AnimatedSection>
                  <AnimatedSection animation="slide-up" delay={0.08}>
                    <h2>THE STEALS EDIT.</h2>
                  </AnimatedSection>
                </div>
                <AnimatedSection animation="slide-right" delay={0.15}>
                  <MagneticButton as={Link} strength={0.3} className="text-link" to="/shop?sort=popular">
                    Shop the edit <ArrowRight />
                  </MagneticButton>
                </AnimatedSection>
              </AnimatedSection>
              
              <div className="product-grid">
                {data.featured.slice(0, 4).map((product, index) => (
                  <AnimatedSection
                    key={product.id}
                    animation="slide-up"
                    delay={index * 0.09}
                  >
                    <ProductCard product={product} />
                  </AnimatedSection>
                ))}
              </div>
            </section>

            {/* Secondary Inverted Marquee Ticker */}
            <Marquee items={TICKER} reverse className="sv-marquee-ink" />

            {/* ── Final CTA with Kinetic Diagonal Aura & Magnetic Action ── */}
            <section className="final-cta">
              <AnimatedSection animation="blur" className="final-cta-inner">
                <AnimatedSection animation="slide-up" delay={0}>
                  <p className="eyebrow">THE NEXT STEP IS YOURS</p>
                </AnimatedSection>
                <AnimatedSection animation="slide-up" delay={0.1}>
                  <h2>
                    YOUR NEXT PAIR
                    <br />
                    SHOULDN'T COST
                    <br />
                    <span>A FORTUNE.</span>
                  </h2>
                </AnimatedSection>
                <AnimatedSection animation="scale" delay={0.2}>
                  <MagneticButton as={Link} strength={0.3} className="button light" to="/shop">
                    Enter the vault <ArrowRight />
                  </MagneticButton>
                </AnimatedSection>
              </AnimatedSection>
              <CreditCard className="cta-mark" aria-hidden="true" />
            </section>
          </>
        )}
      </div>
    </>
  );
}
