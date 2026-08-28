import { useCallback, useEffect, useState, useRef } from 'react';
import { ArrowRight, BadgeCheck, Box, CreditCard, Gem, SearchCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroScrollExperience from '../components/HeroScrollExperience';
import ProductCardEnhanced from '../components/ui/ProductCardEnhanced';
import { ErrorState, LoadingState } from '../components/StatePanel';
import { getProductImage, handleImageError, BRAND_FALLBACKS } from '../lib/images';
import { useSEOMeta } from '../hooks/useSEOMeta';
import type { Brand, Category, Product } from '../types';
import AnimatedSection, { 
  StaggerContainer, 
  ParallaxLayer, 
  FloatingElement,
  AnimatedCounter 
} from '../components/ui/AnimatedSection';

interface Storefront {
  brands: Brand[];
  categories: Category[];
  featured: Product[];
  deals: Product[];
}

export default function HomePageEnhanced() {
  useSEOMeta({
    title: 'Buy & Sell Premium Sneakers | SOLEVAULT',
    description: 'Authentic sneaker marketplace offering curated original footwear at liquidation pricing. 100% verified authentic deadstock sneakers, running shoes, and street classics.',
    url: '/',
  });

  const [data, setData] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const brandGridRef = useRef<HTMLDivElement>(null);
  const categoryStripRef = useRef<HTMLDivElement>(null);

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
      <HeroScrollExperience />

      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Brand Manifesto */}
      <AnimatedSection animation="fade" className="manifesto section-pad">
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
          <AnimatedSection animation="slide-right" delay={0.3}>
            <p>
              We source 100% brand-new, authenticated footwear directly from verified distribution channels, inspect every sole and stitch, and price it without the retail hype markups.
            </p>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Decorative floating elements */}
      <div className="floating-decorative-elements" aria-hidden="true">
        <FloatingElement duration={8} distance={20} delay={0}>
          <div className="floating-shape shape-1" />
        </FloatingElement>
        <FloatingElement duration={10} distance={15} delay={2}>
          <div className="floating-shape shape-2" />
        </FloatingElement>
        <FloatingElement duration={6} distance={25} delay={4}>
          <div className="floating-shape shape-3" />
        </FloatingElement>
      </div>

      {loading && <LoadingState label="Curating the collection" />}
      {error && <ErrorState message={error} retry={fetchStorefront} />}

      {data && (
        <>
          {/* Brand Grid */}
          <section className="brand-section section-pad" id="brands">
            <AnimatedSection animation="fade" className="section-head">
              <div>
                <AnimatedSection animation="slide-up" delay={0}>
                  <p className="eyebrow accent">THE NAMES YOU KNOW</p>
                </AnimatedSection>
                <AnimatedSection animation="slide-up" delay={0.1}>
                  <h2>
                    BIG BRANDS.
                    <br />
                    BETTER NUMBERS.
                  </h2>
                </AnimatedSection>
              </div>
              <AnimatedSection animation="slide-right" delay={0.2}>
                <Link className="text-link magnetic" to="/shop">
                  View all brands <ArrowRight />
                </Link>
              </AnimatedSection>
            </AnimatedSection>
            
            <div className="brand-grid" ref={brandGridRef}>
              {data.brands.map((brand, index) => {
                const bHero = brand.hero_image || BRAND_FALLBACKS[brand.slug] || '/images/solevault-hero.webp';
                return (
                  <AnimatedSection
                    key={brand.id || brand.slug}
                    animation="scale"
                    delay={index * 0.1}
                    className="brand-card-wrapper"
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

          {/* Categories Strip with horizontal scroll reveal */}
          <section className="category-section section-pad" id="categories">
            <AnimatedSection animation="fade" className="section-head">
              <div>
                <AnimatedSection animation="slide-up" delay={0}>
                  <p className="eyebrow">SHOP BY MOVEMENT</p>
                </AnimatedSection>
                <AnimatedSection animation="slide-up" delay={0.1}>
                  <h2>
                    MADE FOR
                    <br />
                    YOUR EVERY DAY.
                  </h2>
                </AnimatedSection>
              </div>
            </AnimatedSection>
            
            <div className="category-strip" ref={categoryStripRef}>
              {data.categories.map((category, index) => {
                const catImg = category.image || `/images/category-${category.slug}.jpg`;
                return (
                  <AnimatedSection
                    key={category.id || category.slug}
                    animation="slide-up"
                    delay={index * 0.15}
                    className="category-card-wrapper"
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
                      <div className="category-border" />
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          </section>

          {/* Deal Banner with parallax */}
          <section className="deal-banner">
            <ParallaxLayer speed={0.3} className="deal-image-wrapper">
              <div className="deal-image">
                <img
                  src={data.deals[0] ? getProductImage(data.deals[0]) : '/images/products/adidas-ultraboost.jpg'}
                  alt="Featured footwear deal"
                  loading="lazy"
                  onError={(e) => handleImageError(e, '/images/products/adidas-ultraboost.jpg')}
                />
                <div className="deal-overlay" />
              </div>
            </ParallaxLayer>
            <div className="deal-copy">
              <AnimatedSection animation="slide-up" delay={0}>
                <p className="eyebrow accent">THE PRICE DROP</p>
              </AnimatedSection>
              <AnimatedSection animation="slide-up" delay={0.1}>
                <h2>
                  BIG BRANDS.
                  <br />
                  <span>SMALLER PRICES.</span>
                </h2>
              </AnimatedSection>
              <AnimatedSection animation="slide-up" delay={0.2}>
                <p>
                  Past-season icons and current essentials. Always brand new. Always checked. Never ordinary.
                </p>
              </AnimatedSection>
              <AnimatedSection animation="scale" delay={0.3}>
                <Link className="button primary magnetic" to="/shop?discount=50&sort=discount">
                  Shop 50–75% off <ArrowRight size={18} />
                </Link>
              </AnimatedSection>
            </div>
          </section>

          {/* Trust Value Props with animated icons */}
          <section className="trust-section section-pad">
            <AnimatedSection animation="slide-left">
              <p className="section-index">02 / Why shop SOLEVAULT</p>
            </AnimatedSection>
            
            <div className="trust-grid">
              {[
                [BadgeCheck, '100% ORIGINAL', 'Sourced with care', '∞'],
                [Box, 'BRAND NEW', 'Unworn. Box fresh.', '✓'],
                [Gem, '50–75% OFF MRP', 'Premium without the premium', '%'],
                [SearchCheck, 'QUALITY CHECKED', 'Every pair inspected', '✓'],
                [ShieldCheck, 'SECURE SHOPPING', 'Protected from cart to door', '🔒'],
              ].map(([Icon, title, copy, stat], index) => {
                const TrustIcon = Icon as typeof BadgeCheck;
                return (
                  <AnimatedSection
                    key={String(title)}
                    animation="slide-up"
                    delay={index * 0.1}
                    className="trust-item-wrapper"
                  >
                    <div className="trust-item">
                      <TrustIcon />
                      <h3>{String(title)}</h3>
                      <p>{String(copy)}</p>
                      <div className="trust-hover-bar" />
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </section>

          {/* Featured Product Grid with stagger */}
          <section className="featured-section section-pad">
            <AnimatedSection animation="fade" className="section-head">
              <div>
                <AnimatedSection animation="slide-up" delay={0}>
                  <p className="eyebrow accent">CURATED THIS WEEK</p>
                </AnimatedSection>
                <AnimatedSection animation="slide-up" delay={0.1}>
                  <h2>THE STEALS EDIT.</h2>
                </AnimatedSection>
              </div>
              <AnimatedSection animation="slide-right" delay={0.2}>
                <Link className="text-link" to="/shop?sort=popular">
                  Shop the edit <ArrowRight />
                </Link>
              </AnimatedSection>
            </AnimatedSection>
            
            <div className="product-grid">
              {data.featured.slice(0, 4).map((product, index) => (
                <ProductCardEnhanced key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>

          {/* Final CTA with animated background */}
          <section className="final-cta">
            <div className="final-cta-bg" aria-hidden="true">
              <div className="cta-pattern" />
              <FloatingElement duration={12} distance={30}>
                <Sparkles className="cta-sparkle sparkle-1" />
              </FloatingElement>
              <FloatingElement duration={8} distance={20} delay={2}>
                <Sparkles className="cta-sparkle sparkle-2" />
              </FloatingElement>
            </div>
            
            <AnimatedSection animation="blur" className="final-cta-content">
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
              <AnimatedSection animation="scale" delay={0.3}>
                <Link className="button light magnetic" to="/shop">
                  Enter the vault <ArrowRight />
                </Link>
              </AnimatedSection>
            </AnimatedSection>
            <CreditCard className="cta-mark" aria-hidden="true" />
          </section>
        </>
      )}

      <style>{`
        .text-shimmer {
          background: linear-gradient(90deg, var(--ink) 0%, var(--accent) 50%, var(--ink) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: text-shimmer 3s linear infinite;
        }

        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .magnetic {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand-card-wrapper,
        .category-card-wrapper,
        .trust-item-wrapper {
          min-width: 0;
        }

        .brand-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255, 77, 35, 0.15) 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
          pointer-events: none;
        }

        .brand-card:hover .brand-shine {
          opacity: 1;
        }

        .category-border {
          position: absolute;
          inset: 0;
          border: 2px solid transparent;
          transition: border-color 0.3s ease;
          pointer-events: none;
        }

        .category-card:hover .category-border {
          border-color: var(--accent);
        }

        .deal-image-wrapper {
          width: 100%;
          height: 100%;
        }

        .deal-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(217, 213, 207, 0.3) 100%);
        }

        .trust-hover-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--accent);
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trust-item:hover .trust-hover-bar {
          width: 100%;
        }

        .final-cta-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .cta-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 30% 70%, rgba(0, 0, 0, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 70% 30%, rgba(0, 0, 0, 0.03) 0%, transparent 50%);
        }

        .cta-sparkle {
          position: absolute;
          color: rgba(0, 0, 0, 0.15);
          animation: sparkle-glow 2s ease-in-out infinite;
        }

        .sparkle-1 {
          top: 20%;
          left: 10%;
          width: 40px;
          height: 40px;
        }

        .sparkle-2 {
          bottom: 30%;
          right: 15%;
          width: 30px;
          height: 30px;
        }

        @keyframes sparkle-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }

        .final-cta-content {
          position: relative;
          z-index: 1;
        }

        .floating-decorative-elements {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -1;
        }

        .floating-shape {
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), transparent);
          opacity: 0.03;
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          position: absolute;
          top: 20%;
          right: -100px;
        }

        .shape-2 {
          width: 300px;
          height: 300px;
          position: absolute;
          top: 60%;
          left: -50px;
        }

        .shape-3 {
          width: 200px;
          height: 200px;
          position: absolute;
          bottom: 20%;
          right: 10%;
        }

        /* Scroll progress bar */
        .scroll-progress-bar {
          position: fixed;
          top: 101px;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent), var(--ink));
          z-index: 100;
          transition: width 0.1s linear;
        }
      `}</style>
    </>
  );
}

// Scroll progress component
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setProgress((scrolled / windowHeight) * 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="scroll-progress-bar"
      style={{ width: `${progress}%` }}
    />
  );
}
