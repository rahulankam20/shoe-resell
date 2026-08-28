import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Box, CreditCard, Gem, SearchCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroScrollExperience from '../components/HeroScrollExperience';
import ProductCard from '../components/ProductCard';
import { ErrorState, LoadingState } from '../components/StatePanel';
import Marquee from '../components/motion/Marquee';
import Reveal from '../components/motion/Reveal';
import HomeScrollScenes from '../components/motion/HomeScrollScenes';
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
      <HeroScrollExperience />

      <Marquee items={TICKER} className="sv-marquee-paper" />

      <div className="js-home-motion">
        <HomeScrollScenes active={Boolean(data)} />

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
            <section className="stats-band">
              {[
                ['50–75%', 'Off MRP, every day'],
                ['100%', 'Original, never replica'],
                ['1–2 days', 'Dispatch window'],
                ['7 days', 'Easy returns'],
              ].map(([value, label], index) => (
                <Reveal key={label} delay={index * 80} from="fold">
                  <article>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </article>
                </Reveal>
              ))}
            </section>

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
                {data.brands.map((brand, index) => {
                  const bHero = brand.hero_image || BRAND_FALLBACKS[brand.slug] || '/images/solevault-hero.webp';
                  return (
                    <Link className="brand-card" key={brand.id || brand.slug} to={`/shop?brand=${brand.slug}`}>
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
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="category-section section-pad" id="categories">
              <div className="section-head">
                <div>
                  <p className="eyebrow">SHOP BY MOVEMENT</p>
                  <h2>
                    MADE FOR
                    <br />
                    YOUR EVERY DAY.
                  </h2>
                </div>
                <p className="section-hint">Scroll to travel the rail</p>
              </div>
              <div className="category-strip">
                {data.categories.map((category) => {
                  const catImg = category.image || `/images/category-${category.slug}.jpg`;
                  return (
                    <Link key={category.id || category.slug} className="category-card" to={`/shop?category=${category.slug}`}>
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
                  );
                })}
              </div>
            </section>

            <section className="deal-banner">
              <div className="deal-image">
                <img
                  src={data.deals[0] ? getProductImage(data.deals[0]) : '/images/products/adidas-ultraboost.jpg'}
                  alt="Featured footwear deal"
                  loading="lazy"
                  onError={(e) => handleImageError(e, '/images/products/adidas-ultraboost.jpg')}
                />
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

            <Marquee items={TICKER} reverse className="sv-marquee-ink" />

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
      </div>
    </>
  );
}
