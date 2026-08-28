import { useEffect, useRef, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductImage, handleImageError } from '../lib/images';
import { money } from '../lib/format';
import CookieConsent from './CookieConsent';
import type { Product } from '../types';

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

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { count, toast, dismissToast } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const handleSelectProduct = (slug: string) => {
    setSearchOpen(false);
    navigate(`/product/${slug}`);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="promo-bar">
        <div className="promo-track">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index}>
              100% ORIGINAL <strong>50–75% OFF MRP</strong> BRAND NEW <i /> AUTHENTICATED VAULT
            </span>
          ))}
        </div>
      </div>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`} ref={searchRef}>
        <div className="nav-wrap">
          <button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <Link className="wordmark" to="/" aria-label="SOLEVAULT home">
            SOLE<span>VAULT</span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <NavLink key={label} to={href} onClick={(e) => handleNavClick(href, e)}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className={`search-trigger-btn ${searchOpen ? 'active' : ''}`}
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <Link to="/wishlist" aria-label="Wishlist">
              <Heart />
            </Link>
            <Link to={user ? '/account' : '/login'} aria-label="Account">
              <User />
            </Link>
            <Link className="cart-link" to="/cart" aria-label={`Cart with ${count} items`}>
              <ShoppingBag />
              <span>{count}</span>
            </Link>
          </div>
        </div>

        {/* Anchored Search Dropdown Panel */}
        {searchOpen && (
          <div className="search-dropdown-panel" role="dialog" aria-label="Quick search">
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
                    {liveResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product.slug)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectProduct(product.slug);
                          }
                        }}
                        className="search-result-item"
                        role="button"
                        tabIndex={0}
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
        )}
      </header>

      {menuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()} aria-label="Mobile navigation">
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
              {navItems.map(([label, href]) => (
                <Link
                  key={label}
                  to={href}
                  onClick={(e) => {
                    handleNavClick(href, e);
                    setMenuOpen(false);
                  }}
                >
                  {label}
                  <ArrowRight size={18} />
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Floating Add to Cart Toast Notification */}
      {toast && (
        <aside className="cart-toast" role="status" aria-live="polite">
          <img
            src={getProductImage(toast.product)}
            alt={toast.product.name}
            onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
          />
          <div>
            <p>
              <Check size={13} /> ADDED TO BAG · UK {toast.size}
            </p>
            <strong>{toast.product.name}</strong>
          </div>
          <Link to="/cart" onClick={dismissToast}>
            View Bag
          </Link>
          <button onClick={dismissToast} aria-label="Dismiss notification">
            <X size={15} />
          </button>
        </aside>
      )}

      <main id="main" key={location.pathname} className="page-enter">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-mark" aria-hidden="true">
          SOLE<span>VAULT</span>
        </div>
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

      {/* Global GDPR/Cookie Consent Banner (suppressed on admin) */}
      {!location.pathname.startsWith('/admin') && <CookieConsent />}
    </div>
  );
}
