import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProductImage, handleImageError } from '../../lib/images';
import { money } from '../../lib/format';
import CookieConsent from '../CookieConsent';
import type { Product } from '../../types';

const navItems = [
  ['New Arrivals', '/shop?sort=newest'],
  ['Aero Gallery', '/gallery'],
  ['Sneakers', '/shop?category=sneakers'],
  ['Running', '/shop?category=running'],
  ['Casual', '/shop?category=casual'],
  ['Training', '/shop?category=training'],
  ['Brands', '/#brands'],
  ['Deals', '/shop?discount=50&sort=discount'],
];

export default function LayoutEnhanced() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const { count, toast, dismissToast } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll detection for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery('');
    setLiveResults([]);

    if (location.hash === '#brands') {
      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById('brands');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 20) {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };
      setTimeout(tryScroll, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  // Focus search input on open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setLiveResults([]);
    }
  }, [searchOpen]);

  // Debounced live search preview
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !searchOpen) {
      setLiveResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(Array.isArray(data) ? data.slice(0, 5) : []);
        }
      } catch {
        setLiveResults([]);
      } finally {
        setSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, searchOpen]);

  // Dismiss on Escape key or outside click
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };

    const onClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      window.addEventListener('keydown', onKeyDown);
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [searchOpen]);

  const handleNavClick = (href: string, event: React.MouseEvent) => {
    if (href === '/#brands') {
      if (location.pathname === '/') {
        event.preventDefault();
        const el = document.getElementById('brands');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSearchOpen(false);
    navigate(`/product/${productId}`);
  };

  // Magnetic button effect
  const useMagnetic = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    target.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  }, []);

  const resetMagnetic = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.transform = '';
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      
      {/* Animated promo bar */}
      <div className="promo-bar">
        <span className="promo-item">100% ORIGINAL</span>
        <strong className="promo-item promo-highlight">50–75% OFF MRP</strong>
        <span className="promo-item">BRAND NEW</span>
        <Sparkles className="promo-sparkle" size={14} />
      </div>
      
      <header 
        ref={headerRef}
        className={`site-header ${scrolled ? 'scrolled' : ''}`} 
        style={{
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div className="nav-wrap" ref={searchRef}>
          <button 
            className="mobile-menu-button" 
            onClick={() => setMenuOpen(true)} 
            aria-label="Open menu"
            onMouseEnter={useMagnetic}
            onMouseLeave={resetMagnetic}
          >
            <Menu />
          </button>
          
          <Link className="wordmark" to="/" aria-label="SOLEVAULT home">
            SOLE<span>VAULT</span>
          </Link>
          
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, href], index) => (
              <NavLink 
                key={label} 
                to={href} 
                onClick={(e) => handleNavClick(href, e)}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                }}
                className={({ isActive }) => isActive ? 'nav-link-active' : ''}
              >
                {label}
                <span className="nav-link-underline" />
              </NavLink>
            ))}
          </nav>
          
          <div className="nav-actions">
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className={`search-trigger-btn ${searchOpen ? 'active' : ''}`}
              onMouseEnter={useMagnetic}
              onMouseLeave={resetMagnetic}
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            
            <Link 
              to="/wishlist" 
              aria-label="Wishlist"
              onMouseEnter={useMagnetic}
              onMouseLeave={resetMagnetic}
            >
              <Heart />
            </Link>
            
            <Link 
              to={user ? '/account' : '/login'} 
              aria-label="Account"
              onMouseEnter={useMagnetic}
              onMouseLeave={resetMagnetic}
            >
              <User />
            </Link>
            
            <Link 
              className="cart-link" 
              to="/cart" 
              aria-label={`Cart with ${count} items`}
              onMouseEnter={useMagnetic}
              onMouseLeave={resetMagnetic}
            >
              <ShoppingBag />
              <span className="cart-badge">{count}</span>
            </Link>
          </div>
        </div>

        {/* Enhanced Search Dropdown Panel */}
        {searchOpen && (
          <div className="search-dropdown-panel" role="dialog" aria-label="Quick search">
            <div className="search-dropdown-inner">
              <form onSubmit={submitSearch} className="search-form-row">
                <Search className="search-input-icon" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search brands, silhouettes, styles…"
                  className="search-dropdown-input"
                  aria-label="Search shoes"
                />
                {searching && <Loader2 size={16} className="search-spinner" />}
                {query && !searching && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="search-clear-btn"
                    aria-label="Clear search query"
                  >
                    <X size={16} />
                  </button>
                )}
                <button type="submit" className="search-submit-btn" aria-label="Submit search">
                  Search
                </button>
              </form>

              {/* Instant Live Search Previews */}
              {query.trim().length > 0 && (
                <div className="search-results-box">
                  {liveResults.length > 0 ? (
                    <div className="search-results-list">
                      <p className="search-section-label">Products</p>
                      {liveResults.map((product, index) => (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product.id)}
                          className="search-result-item"
                          role="button"
                          tabIndex={0}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="search-result-thumb"
                            onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
                          />
                          <div className="search-result-info">
                            <span className="search-result-brand">{product.brand}</span>
                            <span className="search-result-name">{product.name}</span>
                            <div className="search-result-price-row">
                              <strong className="search-result-price">{money(product.sale_price)}</strong>
                              {Number(product.mrp) > Number(product.sale_price) && (
                                <s className="search-result-mrp">{money(product.mrp)}</s>
                              )}
                              {product.discount > 0 && (
                                <span className="search-result-discount">{product.discount}% OFF</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight size={15} className="search-result-arrow" />
                        </div>
                      ))}
                      <button type="button" onClick={submitSearch} className="search-view-all-btn">
                        View all results for "{query.trim()}" <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    !searching && (
                      <div className="search-empty-state">
                        <p>No products found matching "{query.trim()}".</p>
                        <div className="search-suggestions">
                          <span>Try searching for:</span>
                          <button type="button" onClick={() => setQuery('Nike')}>Nike</button>
                          <button type="button" onClick={() => setQuery('Sneakers')}>Sneakers</button>
                          <button type="button" onClick={() => setQuery('Running')}>Running</button>
                          <button type="button" onClick={() => setQuery('Adidas')}>Adidas</button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside 
            className="mobile-drawer" 
            onClick={(event) => event.stopPropagation()} 
            aria-label="Mobile navigation"
          >
            <div className="drawer-head">
              <span className="wordmark">
                SOLE<span>VAULT</span>
              </span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X />
              </button>
            </div>
            <p className="drawer-promo">
              TOP BRANDS.
              <br />
              UNREAL PRICES.
            </p>
            <nav>
              {navItems.map(([label, href], index) => (
                <Link
                  key={label}
                  to={href}
                  onClick={(e) => {
                    handleNavClick(href, e);
                    setMenuOpen(false);
                  }}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="mobile-nav-link"
                >
                  {label}
                  <ArrowRight size={18} />
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Enhanced Toast Notification */}
      {toast && (
        <aside
          className="cart-toast"
          role="status"
          aria-live="polite"
        >
          <img
            src={getProductImage(toast.product)}
            alt={toast.product.name}
            className="toast-image"
            onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
          />
          <div className="toast-content">
            <div className="toast-badge">
              <Check size={13} /> ADDED TO BAG · UK {toast.size}
            </div>
            <div className="toast-product-name">
              {toast.product.name}
            </div>
          </div>
          <div className="toast-actions">
            <Link to="/cart" onClick={dismissToast} className="toast-view-btn">
              View Bag
            </Link>
            <button onClick={dismissToast} className="toast-dismiss" aria-label="Dismiss notification">
              <X size={15} />
            </button>
          </div>
        </aside>
      )}

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <span className="wordmark light">
            SOLE<span>VAULT</span>
          </span>
          <p>
            Curated archive of original footwear at liquidation pricing. Every pair verified before dispatch.
          </p>
        </div>

        <div className="footer-grid">
          <div>
            <h3>Categories & Explore</h3>
            <Link to="/gallery">Aero Gallery</Link>
            <Link to="/shop?category=sneakers">Sneakers</Link>
            <Link to="/shop?category=running">Running</Link>
            <Link to="/shop?category=casual">Casual</Link>
            <Link to="/shop?category=training">Training</Link>
          </div>
          <div>
            <h3>Company & Help</h3>
            <Link to="/about">About SOLEVAULT</Link>
            <Link to="/faqs">FAQs & Support</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
            <Link to="/refund-policy">Returns & Refunds</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
          <div>
            <h3>Support & Legal</h3>
            <p>100% Original Products. Verified Brand-New Inventory.</p>
            <p>Support: support@solevault.in</p>
            <p>Mon – Sat, 10:00 AM – 7:00 PM IST</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} SOLEVAULT. All rights reserved.</span>
          <div className="footer-legal-links">
            <Link to="/about">About</Link>
            <Link to="/faqs">FAQs</Link>
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms-of-service">Terms</Link>
            <Link to="/refund-policy">Refunds</Link>
            <Link to="/shipping-policy">Shipping</Link>
          </div>
          <span>Original Footwear. Guaranteed Authenticity.</span>
        </div>
      </footer>

      {/* Global GDPR/Cookie Consent Banner */}
      {!location.pathname.startsWith('/admin') && <CookieConsent />}
      
      <style>{`
        .site-header.scrolled {
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
        }

        .promo-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1.5rem, 6vw, 6rem);
          background: var(--accent);
          color: #111;
          font-size: 10px;
          letter-spacing: 0.15em;
          font-weight: 700;
          height: 29px;
        }

        .promo-highlight {
          color: white;
          animation: promo-pulse 2s ease-in-out infinite;
        }

        @keyframes promo-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .promo-sparkle {
          animation: sparkle-rotate 3s linear infinite;
        }

        @keyframes sparkle-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .promo-item {
          opacity: 0;
          animation: promo-slide-in 0.5s ease forwards;
        }

        .promo-item:nth-child(1) { animation-delay: 0.1s; }
        .promo-item:nth-child(2) { animation-delay: 0.2s; }
        .promo-item:nth-child(3) { animation-delay: 0.3s; }

        @keyframes promo-slide-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-link-underline {
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 100%;
          height: 1px;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }

        .desktop-nav a:hover .nav-link-underline,
        .nav-link-active .nav-link-underline {
          transform: scaleX(1);
        }

        .cart-badge {
          position: absolute;
          right: -8px;
          top: -7px;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          font-size: 9px;
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          animation: badge-bounce 0.3s ease;
        }

        @keyframes badge-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .cart-toast {
          position: fixed;
          bottom: 2rem;
          right: clamp(1rem, 3vw, 2.5rem);
          z-index: 9999;
          background: rgba(15, 15, 15, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          padding: 0.85rem 1.15rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
          max-width: 420px;
          animation: toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes toast-slide-in {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        .toast-image {
          width: 46px;
          height: 46px;
          object-fit: cover;
          border-radius: 6px;
          background: #222;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #ff4d23;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .toast-product-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .toast-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toast-view-btn {
          background: #ff4d23;
          color: #fff;
          padding: 0.45rem 0.8rem;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .toast-view-btn:hover {
          transform: scale(1.05);
        }

        .toast-dismiss {
          background: transparent;
          border: 0;
          color: #888;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }

        .toast-dismiss:hover {
          color: #fff;
        }

        .mobile-nav-link {
          display: flex;
          justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid #333;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0;
          animation: nav-fade-in 0.4s ease forwards;
        }

        @keyframes nav-fade-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .search-result-item {
          animation: result-slide-in 0.3s ease forwards;
          opacity: 0;
        }

        @keyframes result-slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
