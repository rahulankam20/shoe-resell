import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Heart, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?slug=${encodeURIComponent(slug || '')}`).then(async (response) => {
      if (!response.ok) throw new Error('This pair could not be found');
      return response.json();
    }).then(setProduct).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="page-shell"><LoadingState label="Opening the product vault" /></div>;
  if (error || !product) return <div className="page-shell"><ErrorState message={error || 'Product not found'} /></div>;
  const available = product.sizes.filter((entry) => Number(product.stock?.[entry] || 0) > 0);
  const validateSize = () => { if (!size) { setMessage('Select your UK size first'); return false; } setMessage(''); return true; };
  const add = (buyNow = false) => { if (!validateSize()) return; addItem(product, size, quantity); if (buyNow) navigate('/checkout'); else setMessage('Added to your cart'); };
  const wish = async () => { if (!user) { navigate('/login'); return; } const response = await fetch('/api/wishlist', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ product_id: product.id, size: size || null }) }); setMessage(response.ok ? 'Saved to your wishlist' : 'Could not update wishlist'); };

  const mainImageSrc = getProductImage(product, selectedImage);

  return <div className="product-page page-shell">
    <Link className="back-link" to="/shop"><ArrowLeft size={16} /> Back to collection</Link>
    <div className="product-detail-grid">
      <section className="gallery">
        <div className="gallery-main">
          <img
            src={mainImageSrc}
            alt={`${product.brand} ${product.name}, view ${selectedImage + 1}`}
            onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
          />
        </div>
        {product.images.length > 1 && (
          <div className="thumbnails">
            {product.images.map((image, index) => (
              <button className={index === selectedImage ? 'active' : ''} key={image} onClick={() => setSelectedImage(index)}>
                <img
                  src={getProductImage(product, index)}
                  alt={`View ${index + 1}`}
                  loading="lazy"
                  onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
                />
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="product-buy-panel"><p className="eyebrow accent">{product.brand} · {product.category}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p><div className="detail-price"><strong>{money(product.sale_price)}</strong><s>{money(product.mrp)}</s><span>{product.discount}% OFF</span></div><p className="tax-note">Inclusive of all taxes · MRP shown for comparison</p>
        <div className="size-head"><label>Select UK size</label><span>{available.length} sizes available</span></div><div className="size-selector">{product.sizes.map((entry) => <button key={entry} disabled={!available.includes(entry)} className={size === entry ? 'selected' : ''} onClick={() => { setSize(entry); setMessage(''); }}>{entry}</button>)}</div>
        <div className="quantity-row"><label htmlFor="quantity">Quantity</label><select id="quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select>{size && <span>{product.stock[size]} left in this size</span>}</div>
        {message && <p className={`form-message ${message.startsWith('Added') || message.startsWith('Saved') ? 'success' : ''}`} role="status">{message}</p>}
        <div className="buy-actions"><button className="button dark" onClick={() => add(false)}><ShoppingBag size={18} /> Add to cart</button><button className="button outline" onClick={wish}><Heart size={18} /> Wishlist</button><button className="button accent full" onClick={() => add(true)}>Buy now</button></div>
        <div className="service-list"><div><BadgeCheck /><span><strong>Authenticity promise</strong>Every pair is sourced and checked.</span></div><div><Truck /><span><strong>Free shipping over ₹3,000</strong>Dispatch in 1–2 business days.</span></div><div><RotateCcw /><span><strong>Easy 7-day returns</strong>Unused pairs in original condition.</span></div><div><ShieldCheck /><span><strong>Secure shopping</strong>Your details stay protected.</span></div></div>
        <div className="specifications"><h2>Product details</h2>{Object.entries(product.specifications).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>
      </section>
    </div>
  </div>;
}
