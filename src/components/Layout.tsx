import { useEffect, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X, ArrowRight, Check } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductImage, handleImageError } from '../lib/images';

const navItems = [
  ['New Arrivals', '/shop?sort=newest'],
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
  const { count, toast, dismissToast } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);

    if (location.hash === '#brands') {
      setTimeout(() => {
        const el = document.getElementById('brands');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

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
    if (query.trim()) navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="promo-bar">
        <span>100% ORIGINAL</span>
        <strong>50–75% OFF MRP</strong>
        <span>BRAND NEW</span>
      </div>
      <header className="site-header">
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
            <button onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search />
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

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search products">
          <button className="search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
            <X />
          </button>
          <form onSubmit={submitSearch}>
            <label htmlFor="site-search">What are you looking for?</label>
            <div>
              <input
                id="site-search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Nike, running, clogs…"
              />
              <button aria-label="Submit search">
                <ArrowRight />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Add to Cart Toast Notification */}
      {toast && (
        <aside
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: 'clamp(1rem, 3vw, 2.5rem)',
            zIndex: 9999,
            background: 'rgba(15, 15, 15, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            maxWidth: '420px',
            pointerEvents: 'auto',
          }}
          role="status"
          aria-live="polite"
        >
          <img
            src={getProductImage(toast.product)}
            alt={toast.product.name}
            style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '6px', background: '#222' }}
            onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10px',
                color: '#ff4d23',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <Check size={13} /> ADDED TO BAG · UK {toast.size}
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {toast.product.name}
            </div>
          </div>
          <Link
            to="/cart"
            className="button primary"
            style={{ padding: '0 0.85rem', minHeight: '34px', fontSize: '11px', whiteSpace: 'nowrap' }}
            onClick={dismissToast}
          >
            View bag ({count})
          </Link>
          <button
            onClick={dismissToast}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </aside>
      )}

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <Link className="wordmark light" to="/">
              SOLE<span>VAULT</span>
            </Link>
            <p>
              Original footwear. Honest prices.
              <br />
              No compromise on style.
            </p>
          </div>
          <div className="footer-cta">
            <p>GET FIRST DIBS ON THE NEXT DROP</p>
            <Link to="/shop?sort=newest">
              Shop new arrivals <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="footer-grid">
          <div>
            <h3>Shop</h3>
            <Link to="/shop?category=sneakers">Sneakers</Link>
            <Link to="/shop?category=running">Running</Link>
            <Link to="/shop?discount=50">Deals</Link>
          </div>
          <div>
            <h3>Help</h3>
            <Link to="/account">My account</Link>
            <Link to="/shipping-policy">Shipping policy</Link>
            <Link to="/refund-policy">Returns & refunds</Link>
          </div>
          <div>
            <h3>Our promise</h3>
            <p>Every pair is brand new, quality checked and sourced for authenticity.</p>
          </div>
        </div>
        <div className="footer-legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SOLEVAULT</span>
          <span>Independent footwear reseller. No affiliation with featured brands.</span>
        </div>
      </footer>
    </div>
  );
}
