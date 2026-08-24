import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/StatePanel';
import { authHeaders } from '../lib/format';
import { useSEOMeta } from '../hooks/useSEOMeta';
import type { Product } from '../types';

export default function WishlistPage() {
  useSEOMeta({
    title: 'Saved Pairs & Wishlist | SOLEVAULT',
    description: 'Your saved sneaker grails and favorite silhouettes on SOLEVAULT.',
    url: '/wishlist',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchWishlist = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await fetch('/api/wishlist', { headers: await authHeaders() }); if (!response.ok) throw new Error('Unable to load your wishlist'); setProducts(await response.json()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);
  return <div className="page-shell wishlist-page"><header className="page-title"><p className="eyebrow accent">SAVED FOR LATER</p><h1>YOUR WISHLIST.</h1><p>Keep the good pairs close.</p></header>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={fetchWishlist} /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onWishlistChange={fetchWishlist} />)}</div> : <EmptyState title="NOTHING SAVED YET" copy="Tap the heart on a pair you don't want to lose." action={<Link className="button dark" to="/shop">Find your next pair</Link>} />}</div>;
}
