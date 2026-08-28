import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Reveal from '../components/motion/Reveal';
import MagneticButton from '../components/ui/MagneticButton';
import { ErrorState, LoadingState } from '../components/StatePanel';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders, money } from '../lib/format';
import { getProductImage, handleImageError } from '../lib/images';
import { useSEOMeta } from '../hooks/useSEOMeta';
import type { Product } from '../types';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const [imageFocus, setImageFocus] = useState({ x: 50, y: 50 });
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

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingState label="Opening the product vault" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-shell">
        <ErrorState message={error || 'Product not found'} />
      </div>
    );
  }

  const available = product.sizes.filter((entry) => Number(product.stock?.[entry] || 0) > 0);
  const mainImageSrc = getProductImage(product, selectedImage);

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

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${product.brand} ${product.name}`, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
    setMessage('Link copied to clipboard');
  };

  const trackImageFocus = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setImageFocus({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="product-page page-shell">
      <Reveal from="left">
        <Link className="back-link" to="/shop">
          <ArrowLeft size={16} /> Back to collection
        </Link>
      </Reveal>

      <div className="product-detail-grid">
        <section className="gallery">
          <Reveal from="right">
            <div
              className={`gallery-main product-zoom-stage${zoomed ? ' is-zoomed' : ''}`}
              ref={imageRef}
              onPointerEnter={() => setZoomed(true)}
              onPointerLeave={() => setZoomed(false)}
              onPointerMove={trackImageFocus}
            >
              <img
                src={mainImageSrc}
                alt={`${product.brand} ${product.name}, view ${selectedImage + 1}`}
                className={zoomed ? '' : 'gallery-float-active'}
                style={{ transformOrigin: `${imageFocus.x}% ${imageFocus.y}%` }}
                onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
              />
              <button className="share-button" onClick={share} aria-label="Share product">
                <Share2 size={18} />
              </button>
              <span className="gallery-glint" aria-hidden="true" />
            </div>
          </Reveal>

          {product.images.length > 1 && (
            <Reveal delay={100}>
              <div className="thumbnails">
                {product.images.map((image, index) => (
                  <button
                    className={index === selectedImage ? 'active' : ''}
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
            </Reveal>
          )}
        </section>

        <section className="product-buy-panel">
          <Reveal delay={80}>
            <p className="eyebrow accent">
              {product.brand} · {product.category}
            </p>
            <h1>{product.name}</h1>
            <p className="detail-description">{product.description}</p>
            <div className="detail-price">
              <strong>{money(product.sale_price)}</strong>
              <s>{money(product.mrp)}</s>
              <span>{product.discount}% OFF</span>
            </div>
            <p className="tax-note">Inclusive of all taxes · MRP shown for comparison</p>
          </Reveal>

          <Reveal delay={140}>
            <div className="size-head">
              <label>Select UK size</label>
              <span>{available.length} sizes available</span>
            </div>
            <div className="size-selector">
              {product.sizes.map((entry) => (
                <button
                  key={entry}
                  disabled={!available.includes(entry)}
                  className={size === entry ? 'selected' : ''}
                  onClick={() => {
                    setSize(entry);
                    setMessage('');
                  }}
                >
                  {entry}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="quantity-row">
              <label htmlFor="quantity">Quantity</label>
              <select id="quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              {size && <span>{product.stock[size]} left in this size</span>}
            </div>
          </Reveal>

          {message && (
            <p
              className={`form-message ${
                message.startsWith('Added') || message.startsWith('Saved') || message.startsWith('Link')
                  ? 'success'
                  : ''
              }`}
              role="status"
            >
              {message}
            </p>
          )}

          <Reveal delay={220} from="scale">
            <div className="buy-actions">
              <MagneticButton strength={0.2} className="button dark" onClick={() => add(false)}>
                <ShoppingBag size={18} /> Add to cart
              </MagneticButton>
              <MagneticButton strength={0.2} className="button outline" onClick={wish}>
                <Heart size={18} /> Wishlist
              </MagneticButton>
              <MagneticButton strength={0.2} className="button accent full" onClick={() => add(true)}>
                Buy now
              </MagneticButton>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="service-list">
              <div>
                <BadgeCheck />
                <span>
                  <strong>Authenticity promise</strong>
                  Every pair is sourced and checked.
                </span>
              </div>
              <div>
                <Truck />
                <span>
                  <strong>Free shipping over ₹3,000</strong>
                  Dispatch in 1–2 business days.
                </span>
              </div>
              <div>
                <RotateCcw />
                <span>
                  <strong>Easy 7-day returns</strong>
                  Unused pairs in original condition.
                </span>
              </div>
              <div>
                <ShieldCheck />
                <span>
                  <strong>Secure shopping</strong>
                  Your details stay protected.
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="specifications">
              <h2>Product details</h2>
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
