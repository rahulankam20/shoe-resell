import { useCallback, useEffect, useState } from 'react';
import { Edit3, PackageSearch, Plus, RefreshCcw, ShoppingBag, Tags, Trash2, Users, X, CreditCard, Phone, MapPin, Eye, PackageCheck, Truck } from 'lucide-react';
import { authHeaders, money } from '../lib/format';
import { ErrorState, LoadingState } from '../components/StatePanel';
import type { Brand, Category, Order, Payment, Product, Profile, Refund, WebhookEvent } from '../types';

type Tab = 'products' | 'orders' | 'payments' | 'taxonomy' | 'users';
const emptyProduct = { brand: '', name: '', category: '', description: '', images: [''], specifications: { Upper: '', Sole: '', Colour: '' }, mrp: 0, sale_price: 0, sizes: ['7', '8', '9', '10'], stock: { '7': 5, '8': 5, '9': 5, '10': 5 }, gender: 'Unisex', featured: false, popularity: 0 };

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [taxonomyName, setTaxonomyName] = useState('');
  const [taxonomyType, setTaxonomyType] = useState<'brands' | 'categories'>('brands');
  const [refunding, setRefunding] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const headers = await authHeaders();
      const [p, o, b, c, u, pay] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders?admin=true', { headers }),
        fetch('/api/products?type=brands'),
        fetch('/api/products?type=categories'),
        fetch('/api/users', { headers }),
        fetch('/api/payments?admin=true', { headers }),
      ]);
      if (!p.ok || !o.ok || !b.ok || !c.ok || !u.ok) throw new Error('Could not load admin data');
      setProducts(await p.json());
      setOrders(await o.json());
      setBrands(await b.json());
      setCategories(await c.json());
      setUsers(await u.json());
      if (pay.ok) {
        const ledger = await pay.json();
        setPayments(ledger.payments || []);
        setRefunds(ledger.refunds || []);
        setWebhooks(ledger.webhooks || []);
        if (ledger.orders?.length) setOrders(ledger.orders);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const api = async (url: string, method: string, body: object) => {
    const response = await fetch(url, { method, headers: await authHeaders(), body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Action failed');
    return result;
  };
  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try { await api('/api/products', editing.id ? 'PUT' : 'POST', editing); setEditing(null); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save'); }
  };
  const deleteProduct = async (id: number) => { if (!confirm('Delete this product?')) return; await api('/api/products', 'DELETE', { id }); load(); };
  const updateOrder = async (id: number, status: string) => {
    await api('/api/orders', 'PUT', { id, status });
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => prev ? { ...prev, status: status as any } : null);
    }
    load();
  };
  const addTaxonomy = async (event: React.FormEvent) => { event.preventDefault(); if (!taxonomyName.trim()) return; await api(`/api/products?type=${taxonomyType}`, 'POST', { name: taxonomyName, taxonomy: taxonomyType === 'brands' ? 'brand' : 'category' }); setTaxonomyName(''); load(); };
  const deleteTaxonomy = async (type: 'brands' | 'categories', id: number) => { await api(`/api/products?type=${type}`, 'DELETE', { id }); load(); };
  const updateRole = async (id: string, role: string) => { await api('/api/users', 'PUT', { id, role }); load(); };
  const refundOrder = async (order: Order) => {
    if (!confirm(`Refund ${money(order.total)} for ${order.order_number}?`)) return;
    setRefunding(order.id);
    try {
      await api('/api/payments?action=refund', 'POST', { action: 'refund', order_id: order.id, amount: order.total, note: 'admin_console_refund' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed');
    } finally {
      setRefunding(null);
    }
  };
  const reconcileOrder = async (order: Order) => {
    await api('/api/payments?action=reconcile', 'POST', { action: 'reconcile', order_id: order.id });
    load();
  };

  const formatAddress = (addr?: any) => {
    if (!addr) return 'No address recorded';
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code].filter(Boolean);
    return parts.join(', ');
  };

  return <div className="admin-page page-shell"><header className="admin-head"><div><p className="eyebrow accent">SOLEVAULT OPERATIONS</p><h1>ADMIN CONSOLE.</h1></div><button className="button outline" onClick={load}><RefreshCcw /> Refresh</button></header><nav className="admin-tabs">{([['products', PackageSearch, 'Products'], ['orders', ShoppingBag, 'Orders'], ['payments', CreditCard, 'Payments'], ['taxonomy', Tags, 'Brands & categories'], ['users', Users, 'Users']] as const).map(([key, Icon, label]) => <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}><Icon />{label}</button>)}</nav>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={load} /> : <section className="admin-panel">
    {tab === 'products' && <><div className="panel-heading"><div><h2>PRODUCTS</h2><p>{products.length} products in the vault</p></div><button className="button dark" onClick={() => setEditing(emptyProduct as Partial<Product>)}><Plus /> Add product</button></div><div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Pricing</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.images[0]} alt="" /><span><strong>{product.name}</strong><small>{product.brand}</small></span></div></td><td>{product.category}<small>{product.gender}</small></td><td><strong>{money(product.sale_price)}</strong><small><s>{money(product.mrp)}</s> · {product.discount}% off</small></td><td>{Object.values(product.stock || {}).reduce((sum, value) => sum + Number(value), 0)} units</td><td>{product.featured ? 'Yes' : 'No'}</td><td><div className="table-actions"><button onClick={() => setEditing(product)} aria-label="Edit"><Edit3 /></button><button onClick={() => deleteProduct(product.id)} aria-label="Delete"><Trash2 /></button></div></td></tr>)}</tbody></table></div></>}
    {tab === 'orders' && <><div className="panel-heading"><div><h2>ORDERS</h2><p>{orders.length} customer orders</p></div></div><div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Customer & Phone</th><th>Delivery Address</th><th>Items</th><th>Payment</th><th>Total</th><th>Fulfillment</th><th>Actions</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong><small>{new Date(order.created_at).toLocaleDateString('en-IN')}</small></td><td><div><strong>{order.customer_name || 'Customer'}</strong></div><small>{order.email}</small><div style={{ marginTop: '3px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ff4d23' }}><Phone size={11} /> <strong>{order.phone || order.address?.phone || 'No phone'}</strong></div></td><td style={{ maxWidth: '240px' }}><div style={{ fontSize: '11px', lineHeight: '1.4' }}><MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom', color: '#666' }} />{formatAddress(order.address)}</div></td><td><div style={{ fontSize: '11px' }}>{(order.items || []).map((item, idx) => <div key={idx} style={{ marginBottom: '2px' }}><strong>{item.product_name}</strong> · Size {item.size} <small>(x{item.quantity})</small></div>)}</div></td><td><span style={{ fontWeight: 700, color: order.payment_status === 'PAID' ? '#16a34a' : '#d97706' }}>{order.payment_status}</span><small>{order.cf_order_id ? `CF #${order.cf_order_id}` : 'Pending CF'}</small></td><td><strong>{money(order.total)}</strong></td><td><select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)}>{['Pending', 'Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></td><td><button className="button outline" style={{ minHeight: '32px', padding: '0 8px', fontSize: '9px' }} onClick={() => setSelectedOrder(order)}><Eye size={12} /> Dispatch</button></td></tr>)}</tbody></table></div></>}
    {tab === 'payments' && <>
      <div className="panel-heading"><div><h2>PAYMENTS</h2><p>Cashfree IDs, failures, refunds and webhook ledger. Secrets are never shown.</p></div></div>
      <div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>State</th><th>Cashfree</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong><small>{order.payment_method} · {order.failure_reason || '—'}</small></td><td>{order.payment_status}<small>{order.paid_at ? new Date(order.paid_at).toLocaleString('en-IN') : 'Not captured'}</small></td><td>{order.cf_order_id || '—'}<small>{order.cf_environment || 'SANDBOX'}</small></td><td>{money(order.total)}</td><td><div className="table-actions"><button className="button outline" onClick={() => reconcileOrder(order)}>Reconcile</button>{order.payment_status === 'PAID' && <button className="button dark" disabled={refunding === order.id} onClick={() => refundOrder(order)}>{refunding === order.id ? 'Refunding…' : 'Refund'}</button>}</div></td></tr>)}</tbody></table></div>
      <h3 className="admin-subhead">CAPTURED PAYMENTS</h3>
      <div className="admin-table-wrap"><table><thead><tr><th>CF payment</th><th>Order</th><th>Amount</th><th>Source</th><th>When</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td>{payment.cf_payment_id || '—'}<small>{payment.bank_reference || payment.payment_message}</small></td><td>#{payment.order_id}</td><td>{money(payment.amount)} {payment.currency}</td><td>{payment.source}</td><td>{new Date(payment.created_at).toLocaleString('en-IN')}</td></tr>)}{!payments.length && <tr><td colSpan={5}>No captured payments yet.</td></tr>}</tbody></table></div>
      <h3 className="admin-subhead">REFUNDS</h3>
      <div className="admin-table-wrap"><table><thead><tr><th>Refund</th><th>Order</th><th>Amount</th><th>Status</th><th>CF refund</th></tr></thead><tbody>{refunds.map((refund) => <tr key={refund.refund_id}><td>{refund.refund_id}<small>{refund.reason}</small></td><td>#{refund.order_id}</td><td>{money(refund.amount)}</td><td>{refund.status}</td><td>{refund.cf_refund_id || '—'}</td></tr>)}{!refunds.length && <tr><td colSpan={5}>No refunds yet.</td></tr>}</tbody></table></div>
      <h3 className="admin-subhead">WEBHOOK EVENTS</h3>
      <div className="admin-table-wrap"><table><thead><tr><th>Type</th><th>Order</th><th>CF payment</th><th>Signature</th><th>When</th></tr></thead><tbody>{webhooks.map((event) => <tr key={event.id}><td>{event.event_type}<small>{event.source}</small></td><td>{event.order_id || '—'}</td><td>{event.cf_payment_id || '—'}</td><td>{event.signature_valid ? 'Valid' : 'Rejected'}</td><td>{new Date(event.created_at).toLocaleString('en-IN')}</td></tr>)}{!webhooks.length && <tr><td colSpan={5}>No webhook events stored.</td></tr>}</tbody></table></div>
    </>}
    {tab === 'taxonomy' && <><div className="panel-heading"><div><h2>BRANDS & CATEGORIES</h2><p>Control storefront navigation</p></div></div><form className="inline-admin-form" onSubmit={addTaxonomy}><select value={taxonomyType} onChange={(event) => setTaxonomyType(event.target.value as 'brands' | 'categories')}><option value="brands">Brand</option><option value="categories">Category</option></select><input value={taxonomyName} onChange={(event) => setTaxonomyName(event.target.value)} placeholder={`New ${taxonomyType === 'brands' ? 'brand' : 'category'} name`} /><button className="button dark">Add</button></form><div className="taxonomy-grid"><div><h3>BRANDS</h3>{brands.map((brand) => <div key={brand.id}><span>{brand.name}</span><button onClick={() => deleteTaxonomy('brands', brand.id)}><Trash2 /></button></div>)}</div><div><h3>CATEGORIES</h3>{categories.map((category) => <div key={category.id}><span>{category.name}</span><button onClick={() => deleteTaxonomy('categories', category.id)}><Trash2 /></button></div>)}</div></div></>}
    {tab === 'users' && <><div className="panel-heading"><div><h2>USERS</h2><p>{users.length} registered profiles</p></div></div><div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.full_name || 'No name'}</td><td>{user.email}</td><td>{new Date(user.created_at).toLocaleDateString('en-IN')}</td><td><select value={user.role} onChange={(event) => updateRole(user.id, event.target.value)}><option value="customer">Customer</option><option value="admin">Admin</option></select></td></tr>)}</tbody></table></div></>}
  </section>}
  {editing && <div className="modal-backdrop"><form className="product-modal" onSubmit={saveProduct}><div className="modal-head"><div><p className="eyebrow accent">INVENTORY</p><h2>{editing.id ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</h2></div><button type="button" onClick={() => setEditing(null)}><X /></button></div><div className="modal-fields"><label>Brand<select value={editing.brand || ''} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} required><option value="">Select brand</option>{brands.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Name<input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required /></label><label>Category<select value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} required><option value="">Select category</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Gender<select value={editing.gender || 'Unisex'} onChange={(e) => setEditing({ ...editing, gender: e.target.value })}><option>Men</option><option>Women</option><option>Unisex</option></select></label><label>MRP<input type="number" min="1" value={editing.mrp || ''} onChange={(e) => setEditing({ ...editing, mrp: Number(e.target.value) })} required /></label><label>Sale price<input type="number" min="1" value={editing.sale_price || ''} onChange={(e) => setEditing({ ...editing, sale_price: Number(e.target.value) })} required /></label><label className="span-two">Description<textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label><label className="span-two">Image URLs (one per line)<textarea value={(editing.images || []).join('\n')} onChange={(e) => setEditing({ ...editing, images: e.target.value.split('\n').filter(Boolean) })} required /></label><label className="span-two">Sizes (comma separated)<input value={(editing.sizes || []).join(', ')} onChange={(e) => { const sizes = e.target.value.split(',').map((v) => v.trim()).filter(Boolean); setEditing({ ...editing, sizes, stock: Object.fromEntries(sizes.map((s) => [s, editing.stock?.[s] || 5])) }); }} /></label><label>Stock per size<input type="number" min="0" value={Object.values(editing.stock || {})[0] || 0} onChange={(e) => setEditing({ ...editing, stock: Object.fromEntries((editing.sizes || []).map((s) => [s, Number(e.target.value)])) })} /></label><label className="checkbox"><input type="checkbox" checked={Boolean(editing.featured)} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured product</label></div><button className="button accent full">Save product</button></form></div>}
  {selectedOrder && <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}><div className="product-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow accent">DISPATCH & SHIPPING DETAILS</p><h2>ORDER #{selectedOrder.order_number}</h2></div><button type="button" onClick={() => setSelectedOrder(null)}><X /></button></div><div style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}><div style={{ background: '#f0ede8', padding: '1rem', borderRadius: '4px', border: '1px solid #e0ded9' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d23', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}><MapPin size={14} /> Shipping Destination</div><div style={{ fontSize: '13px', lineHeight: '1.5' }}><div><strong>Recipient:</strong> {selectedOrder.address?.full_name || selectedOrder.customer_name}</div><div><strong>Address:</strong> {selectedOrder.address?.line1} {selectedOrder.address?.line2 && `, ${selectedOrder.address.line2}`}</div><div><strong>City & State:</strong> {selectedOrder.address?.city}, {selectedOrder.address?.state}</div><div><strong>PIN / Postal Code:</strong> {selectedOrder.address?.postal_code}</div><div style={{ marginTop: '6px', color: '#ff4d23' }}><strong><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />Phone Number:</strong> <a href={`tel:${selectedOrder.phone || selectedOrder.address?.phone}`} style={{ color: '#ff4d23', fontWeight: 700 }}>{selectedOrder.phone || selectedOrder.address?.phone || 'No phone provided'}</a></div><div><strong>Email:</strong> {selectedOrder.email}</div></div></div><div style={{ background: '#faf9f6', padding: '1rem', borderRadius: '4px', border: '1px solid #e8e6e1' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}><PackageCheck size={14} /> Ordered Items (Packing List)</div><div style={{ display: 'grid', gap: '8px' }}>{(selectedOrder.items || []).map((item, idx) => <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #eee' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{item.image && <img src={item.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '3px' }} />}<div><strong>{item.product_name}</strong> <small style={{ color: '#777' }}>({item.brand})</small><div style={{ fontSize: '11px', color: '#555' }}>Size: <strong>UK {item.size}</strong> · Qty: <strong>{item.quantity}</strong></div></div></div><div><strong>{money(item.sale_price * item.quantity)}</strong></div></div>)}</div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '2px solid #ddd' }}><span>Total Order Value:</span><strong style={{ fontSize: '1.1rem' }}>{money(selectedOrder.total)}</strong></div></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f5f5', padding: '0.8rem 1rem', borderRadius: '4px' }}><div><span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', display: 'block' }}>Payment Status</span><strong style={{ color: selectedOrder.payment_status === 'PAID' ? '#16a34a' : '#d97706' }}>{selectedOrder.payment_status}</strong> {selectedOrder.cf_order_id && <small style={{ color: '#888' }}> · CF #{selectedOrder.cf_order_id}</small>}</div><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} /><select value={selectedOrder.status} onChange={(e) => updateOrder(selectedOrder.id, e.target.value)} style={{ fontWeight: 700, padding: '4px 8px' }}>{['Pending', 'Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}</select></div></div></div></div></div>}
  </div>;
}

