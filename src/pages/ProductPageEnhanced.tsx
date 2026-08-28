import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, BadgeCheck, Heart, RotateCcw, ShieldCheck, ShoppingBag, Truck, Share2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/StatePanel';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders, money } from '../lib/format';
import { getProductImage, handleImageError } from '../lib/images';
import { useSEOMeta } from '../hooks/useSEOMeta';
import AnimatedSection from '../components/ui/AnimatedSection';
import type { Product } from '../types';

export default function ProductPageEnhanced() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const seoTitle = product
    ? `${product.brand} ${product.name} | Buy Authentic Sneakers | SOLEVAULT`
    : 'Sneaker Details | SOLEVAULT';
  const seoDesc = product?.description
    ? product.description.slice(0, 160)
    : '100% verified original deadstock sneaker pair from the SOLEVAULT curated liquidation archive.';
  const seoImage = product ? getProductImage(product, 0) : undefined;

  useSEOMeta({
    title: seoTitle,
    description: seoDesc,
    image: seoImage,
    url: `/product/${slug || ''}`,
    type: 'product',
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?slug=${encodeURIComponent(slug || '')}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('This pair could not be found');
        return response.json();
      })
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  if (loading) return <div className="page-shell"><LoadingState label="Opening the product vault" /></div>;
  if (error || !product) return <div className="page-shell"><ErrorState message={error || 'Product not found'} /></div>;

  const available = product.sizes.filter((entry) => Number(product.stock?.[entry] || 0) > 0);
  
  const validateSize = () => {
    if (!size) {
      setMessage('Select your UK size first');
      return false;
    }
    setMessage('');
    return true;
  };

  const add = (buyNow = false) => {
    if (!validateSize()) return;
    addItem(product, size, quantity);
    if (buyNow) navigate('/checkout');
    else setMessage('Added to your cart');
  };

  const wish = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ product_id: product.id, size: size || null }),
    });
    setMessage(response.ok ? 'Saved to your wishlist' : 'Could not update wishlist');
  };

  const mainImageSrc = getProductImage(product, selectedImage);

  return (
    <div className="product-page page-shell">
      <AnimatedSection animation="fade" delay={0}>
        <Link className="back-link" to="/shop">
          <ArrowLeft size={16} /> Back to collection
        </Link>
      </AnimatedSection>

      <div className="product-detail-grid">
        {/* Gallery Section */}
        <section className="gallery">
          <AnimatedSection animation="slide-right" delay={0.1}>
            <div 
              ref={imageRef}
              className="gallery-main"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleImageMouseMove}
              style={{ cursor: 'zoom-in' }}
            >
              <img
                src={mainImageSrc}
                alt={`${product.brand} ${product.name}, view ${selectedImage + 1}`}
                onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
                style={{
                  transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  transition: 'transform 0.3s ease',
                }}
              />
              <div className="gallery-overlay">
                <button 
                  className="share-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setMessage('Link copied to clipboard');
                  }}
                  aria-label="Share product"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </AnimatedSection>

          {product.images.length > 1 && (
            <AnimatedSection animation="slide-up" delay={0.2}>
              <div className="thumbnails">
                {product.images.map((image, index) => (
                  <button
                    className={`thumbnail-btn ${index === selectedImage ? 'active' : ''}`}
                    key={image}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={getProductImage(product, index)}
                      alt={`View ${index + 1}`}
                      loading="lazy"
                      onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
                    />
                  </button>
                ))}
              </div>
            </AnimatedSection>
          )}
        </section>

        {/* Product Info Section */}
        <section className="product-buy-panel">
          <AnimatedSection animation="slide-up" delay={0.1}>
            <p className="eyebrow accent">{product.brand} · {product.category}</p>
          </AnimatedSection>

          <AnimatedSection animation="slide-up" delay={0.15}>
            <h1>{product.name}</h1>
          </AnimatedSection>

          <AnimatedSection animation="slide-up" delay={0.2}>
            <p className="detail-description">{product.description}</p>
          </AnimatedSection>

          <AnimatedSection animation="scale" delay={0.25}>
            <div className="detail-price">
              <strong>{money(product.sale_price)}</strong>
              <s>{money(product.mrp)}</s>
              <span className="discount-tag">{product.discount}% OFF</span>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade" delay={0.3}>
            <p className="tax-note">Inclusive of all taxes · MRP shown for comparison</p>
          </AnimatedSection>

          <AnimatedSection animation="slide-up" delay={0.35}>
            <div className="size-head">
              <label>Select UK size</label>
              <span>{available.length} sizes available</span>
            </div>
            <div className="size-selector">
              {product.sizes.map((entry, index) => (
                <button
                  key={entry}
                  disabled={!available.includes(entry)}
                  className={`size-option ${size === entry ? 'selected' : ''}`}
                  onClick={() => { setSize(entry); setMessage(''); }}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {entry}
                </button>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slide-up" delay={0.4}>
            <div className="quantity-row">
              <label htmlFor="quantity">Quantity</label>
              <select
                id="quantity"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              {size && (
                <span className="stock-indicator">
                  {product.stock[size]} left in this size
                </span>
              )}
            </div>
          </AnimatedSection>

          {message && (
            <p 
              className={`form-message ${message.startsWith('Added') || message.startsWith('Saved') || message.startsWith('Link') ? 'success' : ''}`}
              role="status"
              style={{ animation: 'slide-in 0.3s ease' }}
            >
              {message}
            </p>
          )}

          <AnimatedSection animation="scale" delay={0.45}>
            <div className="buy-actions">
              <button className="button dark" onClick={() => add(false)}>
                <ShoppingBag size={18} /> Add to cart
              </button>
              <button className="button outline" onClick={wish}>
                <Heart size={18} /> Wishlist
              </button>
              <button className="button accent full" onClick={() => add(true)}>
                Buy now
              </button>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slide-up" delay={0.5}>
            <div className="service-list">
              <div className="service-item">
                <BadgeCheck />
                <span>
                  <strong>Authenticity promise</strong>
                  Every pair is sourced and checked.
                </span>
              </div>
              <div className="service-item">
                <Truck />
                <span>
                  <strong>Free shipping over ₹3,000</strong>
                  Dispatch in 1–2 business days.
                </span>
              </div>
              <div className="service-item">
                <RotateCcw />
                <span>
                  <strong>Easy 7-day returns</strong>
                  Unused pairs in original condition.
                </span>
              </div>
              <div className="service-item">
                <ShieldCheck />
                <span>
                  <strong>Secure shopping</strong>
                  Your details stay protected.
                </span>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slide-up" delay={0.55}>
            <div className="specifications">
              <h2>Product details</h2>
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="spec-row">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </section>
      </div>

      <style>{`
        .product-detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(380px, 0.8fr);
          gap: clamp(2rem, 5vw, 6rem);
        }

        .gallery-main {
          background: linear-gradient(135deg, #e8e6e2 0%, #e4e2de 100%);
          aspect-ratio: 0.95;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }

        .gallery-main img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-overlay {
          position: absolute;
          top: 1rem;
          right: 1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .gallery-main:hover .gallery-overlay {
          opacity: 1;
        }

        .share-btn {
          background: rgba(255, 255, 255, 0.95);
          border: 0;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .share-btn:hover {
          transform: scale(1.1);
          background: white;
        }

        .thumbnails {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .thumbnail-btn {
          width: 90px;
          aspect-ratio: 1;
          border: 2px solid transparent;
          background: #e5e2dd;
          padding: 0;
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .thumbnail-btn.active {
          border-color: var(--ink);
        }

        .thumbnail-btn:hover {
          transform: translateY(-2px);
        }

        .thumbnail-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-buy-panel {
          padding-top: 2rem;
        }

        .product-buy-panel h1 {
          font-size: clamp(2.5rem, 4vw, 5.5rem);
          line-height: 0.92;
          letter-spacing: -0.065em;
          margin: 1rem 0;
        }

        .detail-description {
          color: #5f5f5f;
          line-height: 1.7;
          max-width: 600px;
        }

        .detail-price {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .detail-price strong {
          font-size: 1.8rem;
        }

        .detail-price s {
          color: #888;
        }

        .discount-tag {
          background: var(--accent);
          color: white;
          padding: 0.4rem 0.55rem;
          font-size: 10px;
          font-weight: 800;
          border-radius: 4px;
          animation: pop-in 0.3s ease;
        }

        @keyframes pop-in {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .tax-note {
          color: #888;
          font-size: 10px;
          margin-top: 0.5rem;
        }

        .size-head {
          margin-top: 2.5rem;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
        }

        .size-head span {
          color: var(--muted);
          font-weight: 400;
        }

        .size-selector {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.45rem;
          margin-top: 0.75rem;
        }

        .size-option {
          height: 48px;
          border: 1px solid var(--line);
          background: transparent;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
        }

        .size-option:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }

        .size-option.selected {
          background: var(--ink);
          color: white;
          border-color: var(--ink);
          animation: pop-in 0.3s ease;
        }

        .size-option:disabled {
          text-decoration: line-through;
          background: #eee;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .quantity-row {
          margin: 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 11px;
        }

        .quantity-row select {
          border: 1px solid var(--line);
          background: transparent;
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }

        .stock-indicator {
          color: var(--accent);
          font-weight: 600;
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .buy-actions {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 0.5rem;
        }

        .buy-actions .full {
          grid-column: 1 / -1;
        }

        .service-list {
          margin-top: 2rem;
          border-top: 1px solid var(--line);
        }

        .service-item {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid var(--line);
          transition: background 0.2s ease;
        }

        .service-item:hover {
          background: rgba(255, 77, 35, 0.03);
        }

        .service-item svg {
          width: 20px;
          color: var(--accent);
        }

        .service-item span {
          display: flex;
          flex-direction: column;
          font-size: 10px;
          color: var(--muted);
        }

        .service-item strong {
          color: var(--ink);
          font-size: 11px;
          margin-bottom: 0.15rem;
        }

        .specifications {
          margin-top: 2.5rem;
        }

        .specifications h2 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--line);
          padding: 0.8rem 0;
          font-size: 11px;
        }

        .spec-row span {
          color: var(--muted);
        }

        @media (max-width: 800px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
          }

          .product-buy-panel {
            padding-top: 0;
          }

          .size-selector {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
