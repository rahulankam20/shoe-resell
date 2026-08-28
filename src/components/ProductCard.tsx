import { Heart, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { Product } from '../types';
import { money, authHeaders } from '../lib/format';
import { getProductImage, handleImageError } from '../lib/images';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import TiltCard from './motion/TiltCard';

export default function ProductCard({
  product,
  onWishlistChange,
}: {
  product: Product;
  onWishlistChange?: () => void;
}) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(Boolean(product.wishlist_id));
  const availableSize = product.sizes.find((size) => Number(product.stock?.[size] || 0) > 0);

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    const response = await fetch('/api/wishlist', {
      method: wishlisted ? 'DELETE' : 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ product_id: product.id }),
    });
    if (response.ok) {
      setWishlisted(!wishlisted);
      onWishlistChange?.();
    }
    setBusy(false);
  };

  const imageSrc = getProductImage(product);

  return (
    <article className="product-card">
      <TiltCard>
        <div className="product-media">
          <Link to={`/product/${product.slug}`} aria-label={`View ${product.brand} ${product.name}`}>
            <img
              src={imageSrc}
              alt={`${product.brand} ${product.name}`}
              loading="lazy"
              decoding="async"
              onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
            />
          </Link>
          <span className="discount-badge">{product.discount}% OFF</span>
          <button
            className={`icon-button wishlist-button ${wishlisted ? 'active' : ''}`}
            onClick={toggleWishlist}
            disabled={busy}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          {availableSize && (
            <button className="quick-add" onClick={() => addItem(product, availableSize, 1)}>
              <Plus size={16} /> Quick add · UK {availableSize}
            </button>
          )}
        </div>
      </TiltCard>
      <div className="product-info">
        <p className="eyebrow">{product.brand}</p>
        <Link to={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-category">
          {product.category} · {product.gender}
        </p>
        <div className="price-line">
          <strong>{money(product.sale_price)}</strong>
          <s>{money(product.mrp)}</s>
        </div>
        <p className="size-preview">UK {product.sizes.join(' · ')}</p>
      </div>
    </article>
  );
}
