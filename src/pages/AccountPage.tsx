import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, LogOut, MapPin, Package, UserRound, Heart, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { authHeaders, dateLabel, money } from '../lib/format';
import { EmptyState } from '../components/StatePanel';
import { AccountPageSkeleton } from '../components/ui/Skeleton';
import { useSEOMeta } from '../hooks/useSEOMeta';
import type { Address, Order, Profile } from '../types';

const blank: Address = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', is_default: false };

export default function AccountPage() {
  useSEOMeta({
    title: 'My Account & Orders | SOLEVAULT',
    description: 'Track orders, manage addresses, and view your verified sneaker purchases in the SOLEVAULT Member Vault.',
    url: '/account',
  });

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

  // Password reset state in Account
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const headers = await authHeaders();
    const [orderRes, addressRes] = await Promise.all([
      fetch('/api/orders', { headers }),
      fetch('/api/addresses', { headers }),
    ]);
    if (orderRes.ok) setOrders(await orderRes.json());
    if (addressRes.ok) setAddresses(await addressRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/users?profile=true', {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
    });
    setMessage(response.ok ? 'Profile updated' : 'Could not update profile');
    if (response.ok) refreshProfile();
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (!oldPassword) return setPasswordError('Please enter your current/old password');
    if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match');
    if (newPassword === oldPassword) return setPasswordError('New password must be different from current password');

    const userEmail = profile?.email;
    if (!userEmail) return setPasswordError('User session expired. Please refresh the page.');

    setPasswordBusy(true);
    try {
      // 1. Verify old password by attempting sign-in
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });

      if (verifyErr) {
        return setPasswordError('Incorrect old password. Please enter the correct current password.');
      }

      // 2. If old password verified successfully, update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;

      setPasswordMessage('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Unable to update password');
    } finally {
      setPasswordBusy(false);
    }
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/addresses', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(addressForm),
    });
    if (response.ok) {
      setShowAddress(false);
      setAddressForm(blank);
      load();
    } else {
      setMessage((await response.json()).error);
    }
  };

  const deleteAddress = async (id?: number) => {
    await fetch('/api/addresses', {
      method: 'DELETE',
      headers: await authHeaders(),
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div className="account-page page-shell">
      <header className="account-head">
        <div>
          <p className="eyebrow accent">MEMBER VAULT</p>
          <h1>HELLO, {(profile?.full_name || 'SNEAKER LOVER').split(' ')[0].toUpperCase()}.</h1>
          <p>{profile?.email}</p>
        </div>
        {profile?.role === 'admin' && (
          <Link className="button outline" to="/admin">
            Open admin console <ArrowRight />
          </Link>
        )}
      </header>

      <div className="account-layout">
        <nav className="account-nav">
          {[
            ['profile', UserRound, 'Profile & Security'],
            ['orders', Package, 'Orders'],
            ['addresses', MapPin, 'Addresses'],
            ['wishlist', Heart, 'Wishlist'],
          ].map(([key, Icon, label]) => {
            const TabIcon = Icon as typeof UserRound;
            return (
              <button
                key={String(key)}
                className={tab === key ? 'active' : ''}
                onClick={() => setParams({ tab: String(key) })}
              >
                <TabIcon />
                {String(label)}
              </button>
            );
          })}
          <button onClick={() => supabase.auth.signOut()}>
            <LogOut />
            Log out
          </button>
        </nav>

        <section className="account-content">
          {loading ? (
            <AccountPageSkeleton />
          ) : (
            <>
              {/* ── PROFILE & SECURITY TAB ── */}
              {tab === 'profile' && (
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {/* Personal Details Card */}
                  <div className="account-panel">
                    <p className="eyebrow">PERSONAL DETAILS</p>
                    <h2>YOUR PROFILE</h2>
                    <form onSubmit={saveProfile}>
                      <label>
                        Full name
                        <input
                          value={form.full_name || ''}
                          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                        />
                      </label>
                      <label>
                        Email
                        <input disabled value={profile?.email || ''} />
                      </label>
                      <label>
                        Phone
                        <input
                          value={form.phone || ''}
                          onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        />
                      </label>
                      {message && <p className="form-message success">{message}</p>}
                      <button className="button dark">Save changes</button>
                    </form>
                  </div>

                  {/* Security & Password Reset Card */}
                  <div className="account-panel">
                    <p className="eyebrow">SECURITY</p>
                    <h2>RESET PASSWORD</h2>
                    <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '1.25rem' }}>
                      Enter your current password to authorize setting a new password.
                    </p>

                    <form onSubmit={handleUpdatePassword}>
                      <label>
                        Current Password
                        <div className="password-input">
                          <input
                            type={showOldPass ? 'text' : 'password'}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                            disabled={passwordBusy}
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPass(!showOldPass)}
                            aria-label={showOldPass ? 'Hide password' : 'Show password'}
                            disabled={passwordBusy}
                          >
                            {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>

                      <label>
                        New Password
                        <div className="password-input">
                          <input
                            type={showPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                            disabled={passwordBusy}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            aria-label={showPass ? 'Hide password' : 'Show password'}
                            disabled={passwordBusy}
                          >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>

                      <label>
                        Confirm New Password
                        <div className="password-input">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            minLength={6}
                            disabled={passwordBusy}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                            disabled={passwordBusy}
                          >
                            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>

                      {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
                      {passwordMessage && <p className="form-message success">{passwordMessage}</p>}

                      <button className="button dark" disabled={passwordBusy}>
                        {passwordBusy ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LoaderCircle className="spin" size={15} /> Verifying & Updating…
                          </span>
                        ) : (
                          <>
                            Update password
                            <KeyRound size={15} />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {tab === 'orders' && (
                <div className="account-panel">
                  <p className="eyebrow">ORDER HISTORY</p>
                  <h2>YOUR ORDERS</h2>
                  {orders.length ? (
                    <div className="orders-list">
                      {orders.map((order) => (
                        <article key={order.id}>
                          <div className="order-row">
                            <div>
                              <span>{dateLabel(order.created_at)}</span>
                              <h3>{order.order_number}</h3>
                            </div>
                            <strong className={`status ${String(order.payment_status).toLowerCase()}`}>
                              {order.payment_status}
                            </strong>
                            <b>{money(order.total)}</b>
                          </div>
                          <div className="order-products">
                            {order.items.map((item) => (
                              <div key={item.id}>
                                <img src={item.image} alt="" />
                                <span>
                                  {item.product_name}
                                  <small>
                                    UK {item.size} · Qty {item.quantity}
                                  </small>
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="order-pay-meta">
                            {order.payment_method} · {order.status}
                            {order.cf_order_id ? ` · CF ${order.cf_order_id}` : ''}
                          </p>
                          <div className="status-track">
                            {['Placed', 'Confirmed', 'Shipped', 'Delivered'].map((status, index, list) => (
                              <span
                                className={list.indexOf(order.status) >= index ? 'done' : ''}
                                key={status}
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="NO ORDERS YET"
                      copy="Your first great find is waiting."
                      action={
                        <Link className="button dark" to="/shop">
                          Shop now
                        </Link>
                      }
                    />
                  )}
                </div>
              )}

              {/* ── ADDRESSES TAB ── */}
              {tab === 'addresses' && (
                <div className="account-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">SAVED ADDRESSES</p>
                      <h2>YOUR PLACES</h2>
                    </div>
                    <button className="button outline" onClick={() => setShowAddress(true)}>
                      <Plus /> Add address
                    </button>
                  </div>
                  <div className="address-grid">
                    {addresses.map((address) => (
                      <article key={address.id}>
                        <span>{address.label}{address.is_default && ' · Default'}</span>
                        <h3>{address.full_name}</h3>
                        <p>
                          {address.line1}
                          <br />
                          {address.line2 && <>{address.line2}<br /></>}
                          {address.city}, {address.state} {address.postal_code}
                          <br />
                          {address.phone}
                        </p>
                        <button onClick={() => deleteAddress(address.id)}>
                          <Trash2 /> Remove
                        </button>
                      </article>
                    ))}
                  </div>
                  {showAddress && (
                    <form className="address-form" onSubmit={saveAddress}>
                      <h3>ADD A NEW ADDRESS</h3>
                      {(['label', 'full_name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code'] as (keyof Address)[]).map(
                        (key) => (
                          <label key={key}>
                            {key.replace('_', ' ')}
                            <input
                              required={!['line2'].includes(key)}
                              value={String(addressForm[key] || '')}
                              onChange={(event) =>
                                setAddressForm({ ...addressForm, [key]: event.target.value })
                              }
                            />
                          </label>
                        )
                      )}
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(event) =>
                            setAddressForm({ ...addressForm, is_default: event.target.checked })
                          }
                        />{' '}
                        Make default
                      </label>
                      <div>
                        <button className="button dark">Save address</button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setShowAddress(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ── WISHLIST TAB ── */}
              {tab === 'wishlist' && (
                <div className="account-panel">
                  <p className="eyebrow">SAVED PAIRS</p>
                  <h2>YOUR WISHLIST</h2>
                  <p>Everything you have your eye on, in one place.</p>
                  <Link className="button dark" to="/wishlist">
                    Open wishlist <ArrowRight />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
