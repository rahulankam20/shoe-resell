import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/StatePanel';
import { useSEOMeta } from '../hooks/useSEOMeta';
import type { Brand, Category, Product } from '../types';

export default function ShopPage() {
  const [params, setParams] = useSearchParams();

  const activeCategory = params.get('category');
  const activeBrand = params.get('brand');
  const activeSearch = params.get('search');

  const pageTitle = activeCategory
    ? `Shop ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} | SOLEVAULT`
    : activeBrand
    ? `Shop ${activeBrand.charAt(0).toUpperCase() + activeBrand.slice(1)} | SOLEVAULT`
    : activeSearch
    ? `Search results for "${activeSearch}" | SOLEVAULT`
    : 'Shop The Vault Collection | SOLEVAULT';

  useSEOMeta({
    title: pageTitle,
    description: 'Browse authentic sneakers, running shoes, and street classics with 50–75% off MRP. All pairs 100% verified original.',
    url: `/shop${params.toString() ? `?${params.toString()}` : ''}`,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryString = params.toString();
  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/products?${queryString}`);
      if (!response.ok) throw new Error('Unable to load the collection');
      setProducts(await response.json());
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load products'); } finally { setLoading(false); }
  }, [queryString]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetch('/api/storefront').then((res) => res.json()).then((data) => { setBrands(data.brands || []); setCategories(data.categories || []); }); }, []);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };
  const selectedSize = params.get('size') || '';
  const sizeOptions = useMemo(() => ['4', '5', '6', '7', '8', '9', '10', '11', '12'], []);
  const filterCount = ['brand', 'category', 'size', 'gender', 'maxPrice', 'discount'].filter((key) => params.has(key)).length;

  return <div className="shop-page page-shell">
    <header className="shop-hero">
      <p className="eyebrow accent">50–75% OFF MRP</p>
      <h1>THE VAULT<br /><span>IS OPEN.</span></h1>
      <p>Original, brand-new footwear. Curated hard. Priced right.</p>
    </header>
    <div className="catalog-toolbar"><button className="filter-trigger" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} /> Filters {filterCount > 0 && <span>{filterCount}</span>}</button><p>{loading ? 'Curating…' : `${products.length} pairs`}</p><label>Sort <select value={params.get('sort') || 'newest'} onChange={(event) => update('sort', event.target.value)}><option value="newest">Newest</option><option value="popular">Most popular</option><option value="price-asc">Price low–high</option><option value="price-desc">Price high–low</option><option value="discount">Biggest discount</option></select><ChevronDown size={16} /></label></div>
    <div className="catalog-layout">
      <aside className={`filters ${filtersOpen ? 'open' : ''}`}><div className="filter-mobile-head"><strong>Filters</strong><button onClick={() => setFiltersOpen(false)}><X /></button></div>
        <div className="filter-group"><label htmlFor="catalog-search">Search</label><input id="catalog-search" type="search" value={params.get('search') || ''} onChange={(event) => update('search', event.target.value)} placeholder="Name, brand, category" /></div>
        <FilterSelect label="Brand" value={params.get('brand') || ''} onChange={(value) => update('brand', value)} options={brands.map((item) => [item.slug, item.name])} />
        <FilterSelect label="Category" value={params.get('category') || ''} onChange={(value) => update('category', value)} options={categories.map((item) => [item.slug, item.name])} />
        <FilterSelect label="Gender" value={params.get('gender') || ''} onChange={(value) => update('gender', value)} options={[['men', 'Men'], ['women', 'Women'], ['unisex', 'Unisex']]} />
        <div className="filter-group"><label>UK Size</label><div className="size-filter">{sizeOptions.map((size) => <button className={selectedSize === size ? 'selected' : ''} key={size} onClick={() => update('size', selectedSize === size ? '' : size)}>{size}</button>)}</div></div>
        <FilterSelect label="Price" value={params.get('maxPrice') || ''} onChange={(value) => update('maxPrice', value)} options={[['2500', 'Under ₹2,500'], ['4000', 'Under ₹4,000'], ['6000', 'Under ₹6,000'], ['10000', 'Under ₹10,000']]} />
        <FilterSelect label="Minimum discount" value={params.get('discount') || ''} onChange={(value) => update('discount', value)} options={[['40', '40% and above'], ['50', '50% and above'], ['60', '60% and above'], ['70', '70% and above']]} />
        <button className="button dark full" onClick={() => setFiltersOpen(false)}>Show {products.length} pairs</button><button className="clear-filters" onClick={() => setParams(new URLSearchParams())}>Clear all filters</button>
      </aside>
      <section className="catalog-results" aria-live="polite">{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={fetchProducts} /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="NO PAIRS FOUND" copy="Try changing a filter or searching for a different style." action={<button className="button dark" onClick={() => setParams(new URLSearchParams())}>Reset filters</button>} />}</section>
    </div>
    {filtersOpen && <button className="filter-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />}
  </div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="filter-group"><label>{label}</label><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">All {label.toLowerCase()}</option>{options.map(([valueItem, labelItem]) => <option value={valueItem} key={valueItem}>{labelItem}</option>)}</select></div>;
}
