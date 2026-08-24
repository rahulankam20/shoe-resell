import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Box, Heart, Layers3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import { money } from '../lib/format';
import { getAeroAvailableSizes, getAeroHeroProduct, getAeroInitialSize } from '../lib/aeroGallery';
import { getProductImage, handleImageError, BRAND_FALLBACKS } from '../lib/images';
import { ErrorState, LoadingState } from '../components/StatePanel';
import type { Brand, Category, Product } from '../types';

interface Storefront {
  brands: Brand[];
  categories: Category[];
  featured: Product[];
  deals: Product[];
}

function AeroProductRail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const availableSizes = useMemo(() => getAeroAvailableSizes(product), [product]);
  const [selectedSize, setSelectedSize] = useState(() => getAeroInitialSize(product));

  useEffect(() => {
    setSelectedSize(getAeroInitialSize(product));
  }, [product]);

  const canAddToCart = Boolean(selectedSize && availableSizes.includes(selectedSize));

  return (
    <aside className="aero-product-rail" aria-label={`${product.brand} ${product.name} purchase options`}>
      <div className="aero-rail-topline">
        <span className="aero-verified-inline"><BadgeCheck size={15} /> Studio verified</span>
        <Link to={`/wishlist`} aria-label="View wishlist"><Heart size={17} /></Link>
      </div>
      <p className="aero-product-brand">{product.brand}</p>
      <Link to={`/product/${product.slug}`} className="aero-product-name">
        {product.name}
      </Link>
      <p className="aero-product-meta">{product.category} · {product.gender}</p>
      <div className="aero-rail-divider" />
      <div className="aero-size-heading">
        <span>Size</span>
        <Link to={`/product/${product.slug}`}>Size guide</Link>
      </div>
      <div className="aero-size-grid" role="group" aria-label="Select a size">
        {product.sizes.map((size) => {
          const isAvailable = availableSizes.includes(size);
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              className={isSelected ? 'selected' : ''}
              disabled={!isAvailable}
              aria-pressed={isSelected}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          );
        })}
      </div>
      <div className="aero-rail-price">
        <span>Price</span>
        <strong>{money(product.sale_price)}</strong>
      </div>
      <div className="aero-auth-line"><BadgeCheck size={15} /> Authenticated · Original box · Accessories</div>
      <button
        className="aero-add-button"
        type="button"
        disabled={!canAddToCart}
        onClick={() => canAddToCart && addItem(product, selectedSize, 1)}
      >
        Add to archive <ArrowRight size={17} />
      </button>
    </aside>
  );
}

export default function HomePage() {
  const [data, setData] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStorefront = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/storefront');
      if (!response.ok) throw new Error('The gallery could not be opened');
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

  const heroProduct = getAeroHeroProduct(data?.featured, data?.deals);
  const studyProducts = data?.featured.slice(0, 3) ?? [];

  return (
    <div className="aero-gallery-home">
      {loading && <LoadingState label="Curating the gallery" />}
      {error && <ErrorState message={error} retry={fetchStorefront} />}

      {data && !heroProduct && (
        <section className="aero-empty-state" aria-labelledby="aero-empty-title">
          <p className="aero-eyebrow">Aero Gallery</p>
          <h1 id="aero-empty-title">A new collection is being prepared.</h1>
          <p>The gallery is live, but no featured object is available to display yet. Browse the complete archive instead.</p>
          <Link className="aero-hero-cta" to="/shop">
            Explore the collection <ArrowRight size={18} />
          </Link>
        </section>
      )}

      {data && heroProduct && (
        <>
          <section className="aero-hero" aria-labelledby="aero-title">
            <div className="aero-hero-copy aero-reveal">
              <p className="aero-eyebrow">Aero Gallery</p>
              <h1 id="aero-title">The art of<br />the everyday</h1>
              <p className="aero-intro">
                Curated icons. Timeless design. Verified authenticity. Elevating the everyday into something worth collecting.
              </p>
              <Link className="aero-hero-cta" to="/shop">
                Explore the collection <ArrowRight size={18} />
              </Link>
            </div>

            <div className="aero-object-stage" aria-label={`${heroProduct.brand} ${heroProduct.name} in the Aero Gallery`}>
              <div className="aero-disc" />
              <div className="aero-window-light" />
              <div className="aero-plinth" />
              <img
                className="aero-hero-shoe"
                src={getProductImage(heroProduct)}
                alt={`${heroProduct.brand} ${heroProduct.name}`}
                onError={(event) => handleImageError(event, '/images/solevault-hero.webp')}
              />
            </div>

            <AeroProductRail product={heroProduct} />
          </section>

          <section className="aero-studies" aria-labelledby="aero-studies-title">
            <div className="aero-studies-copy">
              <p className="aero-eyebrow">Curated studies</p>
              <h2 id="aero-studies-title">Objects with<br />a point of view.</h2>
              <Link to="/shop" className="aero-text-link">View all <ArrowRight size={17} /></Link>
            </div>
            <div className="aero-study-grid">
              {studyProducts.map((product, index) => (
                <div className="aero-study-card" key={product.id}>
                  <span className="aero-study-index">0{index + 1}</span>
                  {index === 0 && <span className="aero-featured-tag">Featured</span>}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>

          <section className="aero-collection-strip" aria-label="Gallery repertoire">
            {data.brands.slice(0, 4).map((brand) => {
              const image = brand.hero_image || BRAND_FALLBACKS[brand.slug] || '/images/solevault-hero.webp';
              return (
                <Link className="aero-brand-study" key={brand.id || brand.slug} to={`/shop?brand=${brand.slug}`}>
                  <img src={image} alt={`${brand.name} collection`} onError={(event) => handleImageError(event, '/images/solevault-hero.webp')} />
                  <div><span>Archive</span><strong>{brand.name}</strong><ArrowRight size={17} /></div>
                </Link>
              );
            })}
          </section>

          <section className="aero-assurance" aria-label="SoleVault gallery assurance">
            <div><BadgeCheck size={22} /><span><strong>Studio verified</strong>Every pair is inspected before it enters the archive.</span></div>
            <div><Box size={22} /><span><strong>Preserved condition</strong>Original packaging details are displayed with each object.</span></div>
            <div><Sparkles size={22} /><span><strong>Curated selection</strong>Current inventory, connected to the same live storefront data.</span></div>
          </section>

          <section className="aero-motion-band" aria-label="Aero Gallery motion system">
            <p>Scroll behavior</p>
            <div><Box size={20} /><span>Plinth lift <b>· 5%</b></span></div>
            <div><Layers3 size={20} /><span>Caption stagger <b>· 60ms</b></span></div>
            <div><Sparkles size={20} /><span>Card elevation <b>· 180ms</b></span></div>
          </section>
        </>
      )}
    </div>
  );
}
