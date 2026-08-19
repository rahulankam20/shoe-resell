import { useEffect, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X, ArrowRight } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  ['New Arrivals', '/shop?sort=newest'], ['Sneakers', '/shop?category=sneakers'], ['Running', '/shop?category=running'], ['Casual', '/shop?category=casual'], ['Training', '/shop?category=training'], ['Brands', '/#brands'], ['Deals', '/shop?discount=50&sort=discount'],
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location.pathname, location.search]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="promo-bar"><span>100% ORIGINAL</span><strong>50–75% OFF MRP</strong><span>BRAND NEW</span></div>
    <header className="site-header">
      <div className="nav-wrap">
        <button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
        <Link className="wordmark" to="/" aria-label="SOLEVAULT home">SOLE<span>VAULT</span></Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(([label, href]) => <NavLink key={label} to={href}>{label}</NavLink>)}
        </nav>
        <div className="nav-actions">
          <button onClick={() => setSearchOpen(true)} aria-label="Search"><Search /></button>
          <Link to="/wishlist" aria-label="Wishlist"><Heart /></Link>
          <Link to={user ? '/account' : '/login'} aria-label="Account"><User /></Link>
          <Link className="cart-link" to="/cart" aria-label={`Cart with ${count} items`}><ShoppingBag /><span>{count}</span></Link>
        </div>
      </div>
    </header>

    {menuOpen && <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
      <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()} aria-label="Mobile navigation">
        <div className="drawer-head"><span className="wordmark">SOLE<span>VAULT</span></span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
        <p className="drawer-promo">TOP BRANDS.<br />UNREAL PRICES.</p>
        <nav>{navItems.map(([label, href]) => <Link key={label} to={href}>{label}<ArrowRight size={18} /></Link>)}</nav>
      </aside>
    </div>}

    {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search products">
      <button className="search-close" onClick={() => setSearchOpen(false)} aria-label="Close search"><X /></button>
      <form onSubmit={submitSearch}><label htmlFor="site-search">What are you looking for?</label><div><input id="site-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Nike, running, clogs…" /><button aria-label="Submit search"><ArrowRight /></button></div></form>
    </div>}

    <main id="main"><Outlet /></main>
    <footer className="site-footer">
      <div className="footer-top"><div><Link className="wordmark light" to="/">SOLE<span>VAULT</span></Link><p>Original footwear. Honest prices.<br />No compromise on style.</p></div><div className="footer-cta"><p>GET FIRST DIBS ON THE NEXT DROP</p><Link to="/shop?sort=newest">Shop new arrivals <ArrowRight size={18} /></Link></div></div>
      <div className="footer-grid"><div><h3>Shop</h3><Link to="/shop?category=sneakers">Sneakers</Link><Link to="/shop?category=running">Running</Link><Link to="/shop?discount=50">Deals</Link></div><div><h3>Help</h3><Link to="/account">My account</Link><Link to="/cart">Shipping & returns</Link><Link to="/account">Order status</Link></div><div><h3>Our promise</h3><p>Every pair is brand new, quality checked and sourced for authenticity.</p></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} SOLEVAULT</span><span>Independent footwear reseller. No affiliation with featured brands.</span></div>
    </footer>
  </div>;
}
