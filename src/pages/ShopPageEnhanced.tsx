import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ChevronDown, SlidersHorizontal, X, Grid, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCardEnhanced from '../components/ui/ProductCardEnhanced';
import { EmptyState, ErrorState, LoadingState } from '../components/StatePanel';
import { useSEOMeta } from '../hooks/useSEOMeta';
import AnimatedSection from '../components/ui/AnimatedSection';
import type { Brand, Category, Product } from '../types';

export default function ShopPageEnhanced() {
  const [params, setParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const gridRef = useRef<HTMLDivElement>(null);

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
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/products?${queryString}`);
      if (!response.ok) throw new Error('Unable to load the collection');
      setProducts(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetch('/api/storefront')
      .then((res) => res.json())
      .then((data) => {
        setBrands(data.brands || []);
        setCategories(data.categories || []);
      });
  }, []);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const selectedSize = params.get('size') || '';
  const sizeOptions = useMemo(() => ['4', '5', '6', '7', '8', '9', '10', '11', '12'], []);
  const filterCount = ['brand', 'category', 'size', 'gender', 'maxPrice', 'discount'].filter((key) => params.has(key)).length;

  return (
    <div className="shop-page page-shell">
      {/* Animated Hero */}
      <header className="shop-hero">
        <AnimatedSection animation="slide-up" delay={0}>
          <p className="eyebrow accent">50–75% OFF MRP</p>
        </AnimatedSection>
        <AnimatedSection animation="blur" delay={0.1}>
          <h1>
            THE VAULT
            <br />
            <span>IS OPEN.</span>
          </h1>
        </AnimatedSection>
        <AnimatedSection animation="slide-up" delay={0.2}>
          <p>Original, brand-new footwear. Curated hard. Priced right.</p>
        </AnimatedSection>
      </header>

      {/* Toolbar with animations */}
      <div className="catalog-toolbar">
        <button 
          className="filter-trigger" 
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={18} /> 
          Filters 
          {filterCount > 0 && (
            <span className="filter-count" style={{ animation: 'pop-in 0.3s ease' }}>
              {filterCount}
            </span>
          )}
        </button>
        
        <div className="catalog-info">
          {loading ? (
            <span className="loading-dots">Curating</span>
          ) : (
            <span className="product-count">{products.length} pairs</span>
          )}
        </div>
        
        <div className="catalog-controls">
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <Grid size={16} />
            </button>
          </div>
          
          <label className="sort-label">
            Sort
            <select 
              value={params.get('sort') || 'newest'} 
              onChange={(event) => update('sort', event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price low–high</option>
              <option value="price-desc">Price high–low</option>
              <option value="discount">Biggest discount</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </div>
      </div>

      <div className="catalog-layout">
        {/* Filters Sidebar */}
        <aside className={`filters ${filtersOpen ? 'open' : ''}`}>
          <div className="filter-mobile-head">
            <strong>Filters</strong>
            <button onClick={() => setFiltersOpen(false)}>
              <X />
            </button>
          </div>

          <AnimatedSection animation="slide-up" delay={0} className="filter-group">
            <label htmlFor="catalog-search">Search</label>
            <input
              id="catalog-search"
              type="search"
              value={params.get('search') || ''}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Name, brand, category"
            />
          </AnimatedSection>

          <FilterSelect
            label="Brand"
            value={params.get('brand') || ''}
            onChange={(value) => update('brand', value)}
            options={brands.map((item) => [item.slug, item.name])}
          />
          
          <FilterSelect
            label="Category"
            value={params.get('category') || ''}
            onChange={(value) => update('category', value)}
            options={categories.map((item) => [item.slug, item.name])}
          />
          
          <FilterSelect
            label="Gender"
            value={params.get('gender') || ''}
            onChange={(value) => update('gender', value)}
            options={[['men', 'Men'], ['women', 'Women'], ['unisex', 'Unisex']]}
          />

          <AnimatedSection animation="slide-up" className="filter-group">
            <label>UK Size</label>
            <div className="size-filter">
              {sizeOptions.map((size, index) => (
                <button
                  className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                  key={size}
                  onClick={() => update('size', selectedSize === size ? '' : size)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {size}
                </button>
              ))}
            </div>
          </AnimatedSection>

          <FilterSelect
            label="Price"
            value={params.get('maxPrice') || ''}
            onChange={(value) => update('maxPrice', value)}
            options={[
              ['2500', 'Under ₹2,500'],
              ['4000', 'Under ₹4,000'],
              ['6000', 'Under ₹6,000'],
              ['10000', 'Under ₹10,000'],
            ]}
          />
          
          <FilterSelect
            label="Minimum discount"
            value={params.get('discount') || ''}
            onChange={(value) => update('discount', value)}
            options={[
              ['40', '40% and above'],
              ['50', '50% and above'],
              ['60', '60% and above'],
              ['70', '70% and above'],
            ]}
          />

          <button className="button dark full" onClick={() => setFiltersOpen(false)}>
            Show {products.length} pairs
          </button>
          
          <button className="clear-filters" onClick={() => setParams(new URLSearchParams())}>
            Clear all filters
          </button>
        </aside>

        {/* Product Grid */}
        <section className="catalog-results" aria-live="polite">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} retry={fetchProducts} />
          ) : products.length ? (
            <div 
              ref={gridRef}
              className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`}
            >
              {products.map((product, index) => (
                <ProductCardEnhanced key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="NO PAIRS FOUND"
              copy="Try changing a filter or searching for a different style."
              action={
                <button className="button dark" onClick={() => setParams(new URLSearchParams())}>
                  Reset filters
                </button>
              }
            />
          )}
        </section>
      </div>

      {filtersOpen && (
        <button 
          className="filter-backdrop" 
          aria-label="Close filters" 
          onClick={() => setFiltersOpen(false)}
        />
      )}

      <style>{`
        .shop-hero {
          padding: clamp(2rem, 5vw, 5rem) 0;
          border-bottom: 1px solid var(--line);
        }

        .shop-hero h1 {
          font-size: clamp(4rem, 9vw, 9rem);
          margin: 0.5rem 0;
        }

        .shop-hero h1 span {
          color: var(--accent);
        }

        .shop-hero > p:last-child {
          color: var(--muted);
          margin-top: 0.5rem;
        }

        .catalog-toolbar {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--line);
        }

        .filter-trigger {
          display: none;
          border: 0;
          background: transparent;
          align-items: center;
          gap: 0.5rem;
          text-transform: uppercase;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .filter-trigger:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .filter-count {
          background: var(--accent);
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
        }

        @keyframes pop-in {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .catalog-info {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .loading-dots::after {
          content: '…';
          animation: dots 1.5s infinite;
        }

        @keyframes dots {
          0%, 20% { content: '…'; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '…'; }
        }

        .product-count {
          animation: fade-in 0.3s ease;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .catalog-controls {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .view-toggle {
          display: flex;
          gap: 0.25rem;
          background: rgba(0, 0, 0, 0.03);
          padding: 4px;
          border-radius: 8px;
        }

        .view-toggle button {
          border: 0;
          background: transparent;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          color: var(--muted);
        }

        .view-toggle button.active {
          background: white;
          color: var(--ink);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .sort-label {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .sort-label select {
          appearance: none;
          border: 0;
          background: transparent;
          padding-right: 1.5rem;
          font-weight: 700;
          cursor: pointer;
        }

        .sort-label svg {
          position: absolute;
          right: 0;
          pointer-events: none;
        }

        .catalog-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 3rem;
          padding-top: 2rem;
        }

        .filters {
          border-right: 1px solid var(--line);
          padding-right: 2rem;
        }

        .filter-mobile-head {
          display: none;
        }

        .filter-group {
          border-bottom: 1px solid var(--line);
          padding: 1.25rem 0;
        }

        .filter-group > label {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 800;
          margin-bottom: 0.75rem;
        }

        .filter-group input,
        .filter-group select {
          width: 100%;
          border: 0;
          background: transparent;
          font-size: 12px;
          padding: 0.4rem 0;
          outline: none;
        }

        .size-filter {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
        }

        .size-btn {
          height: 35px;
          border: 1px solid var(--line);
          background: transparent;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .size-btn.selected {
          background: var(--ink);
          color: white;
          border-color: var(--ink);
          animation: pop-in 0.3s ease;
        }

        .filters .button {
          margin-top: 1.5rem;
          display: none;
        }

        .clear-filters {
          border: 0;
          background: transparent;
          text-decoration: underline;
          font-size: 10px;
          margin-top: 1rem;
          padding: 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .clear-filters:hover {
          color: var(--accent);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1.2rem;
        }

        .product-grid.list-view {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1120px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 800px) {
          .filter-trigger {
            display: flex;
          }
          
          .catalog-layout {
            grid-template-columns: 1fr;
          }
          
          .filters {
            position: fixed;
            z-index: 102;
            left: 0;
            top: 0;
            bottom: 0;
            width: min(88vw, 380px);
            overflow-y: auto;
            background: var(--paper);
            padding: 1.5rem;
            transform: translateX(-105%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 0;
          }
          
          .filters.open {
            transform: translateX(0);
          }
          
          .filter-mobile-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .filter-mobile-head button {
            border: 0;
            background: transparent;
          }
          
          .filters .button {
            display: flex;
          }
          
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .view-toggle {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .product-grid {
            gap: 0.55rem;
          }
        }

        .filter-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          border: 0;
          cursor: pointer;
          animation: fade-in 0.3s ease;
        }
      `}</style>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <AnimatedSection animation="slide-up" className="filter-group">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All {label.toLowerCase()}</option>
        {options.map(([valueItem, labelItem]) => (
          <option value={valueItem} key={valueItem}>
            {labelItem}
          </option>
        ))}
      </select>
    </AnimatedSection>
  );
}
