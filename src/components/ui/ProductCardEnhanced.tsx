import { Heart, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { Product } from '../../types';
import { money, authHeaders } from '../../lib/format';
import { getProductImage, handleImageError } from '../../lib/images';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

interface ProductCardEnhancedProps {
  product: Product;
  onWishlistChange?: () => void;
  index?: number;
}

export default function ProductCardEnhanced({
  product,
  onWishlistChange,
  index = 0,
}: ProductCardEnhancedProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(Boolean(product.wishlist_id));
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const availableSize = product.sizes.find((size) => Number(product.stock?.[size] || 0) > 0);

  // Intersection observer for reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Track mouse for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setMousePosition({ x, y });
  };

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
    <article
      ref={cardRef}
      className="product-card-enhanced"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? `perspective(1000px) rotateY(${mousePosition.x * 8}deg) rotateX(${-mousePosition.y * 8}deg) translateY(${isHovered ? -8 : 0}px)`
          : 'translateY(40px) scale(0.95)',
        transition: isVisible 
          ? 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease-out'
          : 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: isVisible ? `${index * 80}ms` : '0ms',
      }}
    >
      <div className="product-media-enhanced">
        <Link to={`/product/${product.slug}`} aria-label={`View ${product.brand} ${product.name}`}>
          <img
            src={imageSrc}
            alt={`${product.brand} ${product.name}`}
            loading="lazy"
            decoding="async"
            onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
            style={{
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              filter: isHovered ? 'brightness(1.05)' : 'brightness(1)',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease',
            }}
          />
        </Link>
        
        {/* Animated discount badge */}
        <span 
          className="discount-badge-enhanced"
          style={{
            transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-10deg)',
            transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            transitionDelay: `${index * 80 + 200}ms`,
          }}
        >
          {product.discount}% OFF
        </span>
        
        {/* Wishlist button with heart animation */}
        <button
          className={`wishlist-btn-enhanced ${wishlisted ? 'active' : ''}`}
          onClick={toggleWishlist}
          disabled={busy}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            transform: isHovered ? 'scale(1)' : 'scale(0.8)',
            opacity: isHovered ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease',
          }}
        >
          <Heart 
            size={18} 
            fill={wishlisted ? 'currentColor' : 'none'}
            style={{
              animation: wishlisted ? 'heartbeat 0.6s ease-in-out' : 'none',
            }}
          />
        </button>
        
        {/* Quick add with slide animation */}
        {availableSize && (
          <button 
            className="quick-add-enhanced"
            onClick={() => addItem(product, availableSize, 1)}
            style={{
              transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
              opacity: isHovered ? 1 : 0,
            }}
          >
            <Plus size={16} /> Quick add · UK {availableSize}
          </button>
        )}
        
        {/* Shine effect overlay */}
        <div 
          className="product-shine"
          style={{
            opacity: isHovered ? 0.15 : 0,
            transform: `translateX(${isHovered ? mousePosition.x * 200 : -100}px)`,
            transition: 'opacity 0.3s ease, transform 0.5s ease',
          }}
        />
      </div>
      
      <div className="product-info-enhanced">
        <p 
          className="eyebrow-enhanced"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            transitionDelay: `${index * 80 + 100}ms`,
          }}
        >
          {product.brand}
        </p>
        
        <Link to={`/product/${product.slug}`}>
          <h3
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              transitionDelay: `${index * 80 + 150}ms`,
            }}
          >
            {product.name}
          </h3>
        </Link>
        
        <p 
          className="product-category-enhanced"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            transitionDelay: `${index * 80 + 200}ms`,
          }}
        >
          {product.category} · {product.gender}
        </p>
        
        <div 
          className="price-line-enhanced"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            transitionDelay: `${index * 80 + 250}ms`,
          }}
        >
          <strong>{money(product.sale_price)}</strong>
          <s>{money(product.mrp)}</s>
        </div>
        
        <p 
          className="size-preview-enhanced"
          style={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          UK {product.sizes.join(' · ')}
        </p>
      </div>
      
      <style>{`
        .product-card-enhanced {
          min-width: 0;
          cursor: pointer;
        }
        
        .product-media-enhanced {
          position: relative;
          background: linear-gradient(135deg, #e8e6e2 0%, #e4e2de 100%);
          overflow: hidden;
          aspect-ratio: 0.83;
          border-radius: 4px;
        }
        
        .product-media-enhanced > a {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .product-media-enhanced img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .discount-badge-enhanced {
          position: absolute;
          left: 0.75rem;
          top: 0.75rem;
          padding: 0.45rem 0.6rem;
          background: var(--accent);
          color: white;
          font-size: 9px;
          letter-spacing: 0.08em;
          font-weight: 800;
          z-index: 2;
        }
        
        .wishlist-btn-enhanced {
          position: absolute;
          right: 0.75rem;
          top: 0.75rem;
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 2;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .wishlist-btn-enhanced.active {
          color: var(--accent);
        }
        
        .wishlist-btn-enhanced:hover {
          transform: scale(1.1);
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.25); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
        }
        
        .quick-add-enhanced {
          position: absolute;
          bottom: 0.75rem;
          left: 0.75rem;
          right: 0.75rem;
          height: 42px;
          border: 0;
          background: rgba(255, 255, 255, 0.98);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.3s ease, opacity 0.3s ease, background 0.2s ease;
          z-index: 2;
        }
        
        .quick-add-enhanced:hover {
          background: var(--ink);
          color: white;
        }
        
        .product-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 1) 50%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 1;
        }
        
        .product-info-enhanced {
          padding: 1rem 0.1rem 1.5rem;
        }
        
        .eyebrow-enhanced {
          color: var(--accent);
          font-size: 10px;
          letter-spacing: 0.19em;
          font-weight: 750;
          text-transform: uppercase;
          margin: 0 0 0.5rem;
        }
        
        .product-info-enhanced h3 {
          margin: 0;
          font-size: 1rem;
          letter-spacing: -0.02em;
        }
        
        .product-category-enhanced {
          font-size: 10px;
          color: var(--muted);
          margin: 0;
        }
        
        .price-line-enhanced {
          display: flex;
          gap: 0.65rem;
          align-items: baseline;
          margin-top: 0.8rem;
        }
        
        .price-line-enhanced strong {
          font-size: 0.95rem;
        }
        
        .price-line-enhanced s {
          color: #888;
          font-size: 0.75rem;
        }
        
        .size-preview-enhanced {
          font-size: 10px;
          color: var(--muted);
          margin: 0.5rem 0 0;
        }
      `}</style>
    </article>
  );
}
