import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, BadgeCheck, Box, CreditCard, Gem, SearchCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollSequence from '../components/ScrollSequence';
import ProductCard from '../components/ProductCard';
import { ErrorState, LoadingState } from '../components/StatePanel';
import type { Brand, Category, Product } from '../types';

interface Storefront { brands: Brand[]; categories: Category[]; featured: Product[]; deals: Product[]; }

export default function HomePage() {
  const [data, setData] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fetchStorefront = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/storefront');
      if (!response.ok) throw new Error('The vault could not be opened');
      setData(await response.json());
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchStorefront(); }, [fetchStorefront]);

  const storyLabel = progress < .22 ? '01 · THE REVEAL' : progress < .48 ? '02 · ENGINEERED DETAIL' : progress < .75 ? '03 · THE COLLECTION' : '04 · THE PRICE DROP';
  return <>
    <ScrollSequence fallbackImage="/images/solevault-hero.webp" alt="Premium sneaker floating in a dark studio" onProgress={setProgress}>
      <div className="hero-copy">
        <p className="hero-kicker">{storyLabel}</p>
        <h1 className={progress > .78 ? 'compact' : ''}>{progress > .78 ? <>50–75%<br /><em>OFF MRP.</em></> : <>TOP BRANDS.<br /><em>UNREAL PRICES.</em></>}</h1>
        <p className="hero-sub">100% Original. Brand New. Up to 75% OFF MRP.</p>
        <div className="hero-actions"><Link className="button primary" to="/shop">Shop the collection <ArrowRight size={18} /></Link><Link className="button ghost-light" to="/shop?discount=50&sort=discount">Explore deals</Link></div>
      </div>
      <div className="scroll-cue"><ArrowDown size={16} /><span>Scroll to reveal</span></div>
    </ScrollSequence>

    <section className="manifesto section-pad"><p className="section-index">01 / The SOLEVAULT difference</p><div><h2>THE PAIRS YOU WANT.<br /><span>THE PRICES YOU DIDN'T EXPECT.</span></h2><p>We source brand-new footwear from trusted channels, inspect every pair, and price it without the usual noise.</p></div></section>

    {loading && <LoadingState label="Curating the collection" />}
    {error && <ErrorState message={error} retry={fetchStorefront} />}
    {data && <>
      <section className="brand-section section-pad" id="brands"><div className="section-head"><div><p className="eyebrow accent">THE NAMES YOU KNOW</p><h2>BIG BRANDS.<br />BETTER NUMBERS.</h2></div><Link className="text-link" to="/shop">View all brands <ArrowRight /></Link></div>
        <div className="brand-grid">{data.brands.map((brand, index) => <Link className="brand-card" key={brand.id} to={`/shop?brand=${brand.slug}`}><img src={brand.hero_image || '/images/solevault-hero.webp'} alt="" loading="lazy" /><div className="brand-overlay"><span>0{index + 1}</span><h3>{brand.name}</h3><p>{brand.product_count} pairs in the vault</p><ArrowRight /></div></Link>)}</div>
      </section>

      <section className="category-section section-pad"><div className="section-head"><div><p className="eyebrow">SHOP BY MOVEMENT</p><h2>MADE FOR<br />YOUR EVERY DAY.</h2></div></div><div className="category-strip">{data.categories.map((category) => <Link key={category.id} className="category-card" to={`/shop?category=${category.slug}`}><img src={category.image} alt={`${category.name} footwear`} loading="lazy" /><div><p>{category.description}</p><h3>{category.name}</h3><ArrowRight /></div></Link>)}</div></section>

      <section className="deal-banner"><div className="deal-image"><img src={data.deals[0]?.images[0]} alt="Featured footwear deal" loading="lazy" /></div><div className="deal-copy"><p className="eyebrow accent">THE PRICE DROP</p><h2>BIG BRANDS.<br /><span>SMALLER PRICES.</span></h2><p>Past-season icons and current essentials. Always brand new. Always checked. Never ordinary.</p><Link className="button primary" to="/shop?discount=50&sort=discount">Shop 50–75% off <ArrowRight size={18} /></Link></div></section>

      <section className="trust-section section-pad"><p className="section-index">02 / Why shop SOLEVAULT</p><div className="trust-grid">{[
        [BadgeCheck, '100% ORIGINAL', 'Sourced with care'], [Box, 'BRAND NEW', 'Unworn. Box fresh.'], [Gem, '50–75% OFF MRP', 'Premium without the premium'], [SearchCheck, 'QUALITY CHECKED', 'Every pair inspected'], [ShieldCheck, 'SECURE SHOPPING', 'Protected from cart to door']
      ].map(([Icon, title, copy]) => { const TrustIcon = Icon as typeof BadgeCheck; return <div className="trust-item" key={String(title)}><TrustIcon /><h3>{String(title)}</h3><p>{String(copy)}</p></div>; })}</div></section>

      <section className="featured-section section-pad"><div className="section-head"><div><p className="eyebrow accent">CURATED THIS WEEK</p><h2>THE STEALS EDIT.</h2></div><Link className="text-link" to="/shop?sort=popular">Shop the edit <ArrowRight /></Link></div><div className="product-grid">{data.featured.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

      <section className="final-cta"><div><p className="eyebrow">THE NEXT STEP IS YOURS</p><h2>YOUR NEXT PAIR<br />SHOULDN'T COST<br /><span>A FORTUNE.</span></h2><Link className="button light" to="/shop">Enter the vault <ArrowRight /></Link></div><CreditCard className="cta-mark" aria-hidden="true" /></section>
    </>}
  </>;
}
