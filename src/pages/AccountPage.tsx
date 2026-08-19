import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, LogOut, MapPin, Package, UserRound, Heart, Plus, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders, dateLabel, money } from '../lib/format';
import { EmptyState, LoadingState } from '../components/StatePanel';
import type { Address, Order, Profile } from '../types';

const blank: Address = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', is_default: false };

export default function AccountPage() {
  const { profile, refreshProfile } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'profile';
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [addressForm, setAddressForm] = useState<Address>(blank);
  const [showAddress, setShowAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => { setLoading(true); const headers = await authHeaders(); const [orderRes, addressRes] = await Promise.all([fetch('/api/orders', { headers }), fetch('/api/addresses', { headers })]); if (orderRes.ok) setOrders(await orderRes.json()); if (addressRes.ok) setAddresses(await addressRes.json()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  const saveProfile = async (event: React.FormEvent) => { event.preventDefault(); const response = await fetch('/api/profile', { method: 'PUT', headers: await authHeaders(), body: JSON.stringify({ full_name: form.full_name, phone: form.phone }) }); setMessage(response.ok ? 'Profile updated' : 'Could not update profile'); if (response.ok) refreshProfile(); };
  const saveAddress = async (event: React.FormEvent) => { event.preventDefault(); const response = await fetch('/api/addresses', { method: 'POST', headers: await authHeaders(), body: JSON.stringify(addressForm) }); if (response.ok) { setShowAddress(false); setAddressForm(blank); load(); } else setMessage((await response.json()).error); };
  const deleteAddress = async (id?: number) => { await fetch('/api/addresses', { method: 'DELETE', headers: await authHeaders(), body: JSON.stringify({ id }) }); load(); };

  return <div className="account-page page-shell"><header className="account-head"><div><p className="eyebrow accent">MEMBER VAULT</p><h1>HELLO, {(profile?.full_name || 'SNEAKER LOVER').split(' ')[0].toUpperCase()}.</h1><p>{profile?.email}</p></div>{profile?.role === 'admin' && <Link className="button outline" to="/admin">Open admin console <ArrowRight /></Link>}</header><div className="account-layout"><nav className="account-nav">{[['profile', UserRound, 'Profile'], ['orders', Package, 'Orders'], ['addresses', MapPin, 'Addresses'], ['wishlist', Heart, 'Wishlist']].map(([key, Icon, label]) => { const TabIcon = Icon as typeof UserRound; return <button key={String(key)} className={tab === key ? 'active' : ''} onClick={() => setParams({ tab: String(key) })}><TabIcon />{String(label)}</button>; })}<button onClick={() => supabase.auth.signOut()}><LogOut />Log out</button></nav><section className="account-content">{loading ? <LoadingState /> : <>
    {tab === 'profile' && <div className="account-panel"><p className="eyebrow">PERSONAL DETAILS</p><h2>YOUR PROFILE</h2><form onSubmit={saveProfile}><label>Full name<input value={form.full_name || ''} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label><label>Email<input disabled value={profile?.email || ''} /></label><label>Phone<input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>{message && <p className="form-message success">{message}</p>}<button className="button dark">Save changes</button></form></div>}
    {tab === 'orders' && <div className="account-panel"><p className="eyebrow">ORDER HISTORY</p><h2>YOUR ORDERS</h2>{orders.length ? <div className="orders-list">{orders.map((order) => <article key={order.id}><div className="order-row"><div><span>{dateLabel(order.created_at)}</span><h3>{order.order_number}</h3></div><strong className={`status ${String(order.payment_status).toLowerCase()}`}>{order.payment_status}</strong><b>{money(order.total)}</b></div><div className="order-products">{order.items.map((item) => <div key={item.id}><img src={item.image} alt="" /><span>{item.product_name}<small>UK {item.size} · Qty {item.quantity}</small></span></div>)}</div><p className="order-pay-meta">{order.payment_method} · {order.status}{order.cf_order_id ? ` · CF ${order.cf_order_id}` : ''}</p><div className="status-track">{['Placed', 'Confirmed', 'Shipped', 'Delivered'].map((status, index, list) => <span className={list.indexOf(order.status) >= index ? 'done' : ''} key={status}>{status}</span>)}</div></article>)}</div> : <EmptyState title="NO ORDERS YET" copy="Your first great find is waiting." action={<Link className="button dark" to="/shop">Shop now</Link>} />}</div>}
    {tab === 'addresses' && <div className="account-panel"><div className="panel-heading"><div><p className="eyebrow">SAVED ADDRESSES</p><h2>YOUR PLACES</h2></div><button className="button outline" onClick={() => setShowAddress(true)}><Plus /> Add address</button></div><div className="address-grid">{addresses.map((address) => <article key={address.id}><span>{address.label}{address.is_default && ' · Default'}</span><h3>{address.full_name}</h3><p>{address.line1}<br />{address.line2 && <>{address.line2}<br /></>}{address.city}, {address.state} {address.postal_code}<br />{address.phone}</p><button onClick={() => deleteAddress(address.id)}><Trash2 /> Remove</button></article>)}</div>{showAddress && <form className="address-form" onSubmit={saveAddress}><h3>ADD A NEW ADDRESS</h3>{(['label', 'full_name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code'] as (keyof Address)[]).map((key) => <label key={key}>{key.replace('_', ' ')}<input required={!['line2'].includes(key)} value={String(addressForm[key] || '')} onChange={(event) => setAddressForm({ ...addressForm, [key]: event.target.value })} /></label>)}<label className="checkbox"><input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm({ ...addressForm, is_default: event.target.checked })} /> Make default</label><div><button className="button dark">Save address</button><button type="button" className="text-button" onClick={() => setShowAddress(false)}>Cancel</button></div></form>}</div>}
    {tab === 'wishlist' && <div className="account-panel"><p className="eyebrow">SAVED PAIRS</p><h2>YOUR WISHLIST</h2><p>Everything you have your eye on, in one place.</p><Link className="button dark" to="/wishlist">Open wishlist <ArrowRight /></Link></div>}
  </>}</section></div></div>;
}
