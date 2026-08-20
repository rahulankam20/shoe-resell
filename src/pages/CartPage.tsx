import { ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { money } from '../lib/format';
import { getProductImage, handleImageError } from '../lib/images';
import { EmptyState } from '../components/StatePanel';

export default function CartPage() {
  const { items, mrpTotal, subtotal, discount, shipping, total, updateItem, removeItem } = useCart();

  if (!items.length)
    return (
      <div className="page-shell empty-page">
        <EmptyState
          title="YOUR CART IS EMPTY"
          copy="The right pair is still in the vault."
          action={
            <Link className="button dark" to="/shop">
              Explore the collection
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="cart-page page-shell">
      <header className="page-title">
        <p className="eyebrow accent">YOUR SELECTION</p>
        <h1>THE CART.</h1>
        <p>
          {items.length} selected {items.length === 1 ? 'style' : 'styles'}
        </p>
      </header>
      <div className="cart-layout">
        <section className="cart-items">
          {items.map(({ product, size, quantity }) => (
            <article className="cart-item" key={`${product.id}-${size}`}>
              <Link to={`/product/${product.slug}`}>
                <img
                  src={getProductImage(product)}
                  alt={`${product.brand} ${product.name}`}
                  onError={(e) => handleImageError(e, '/images/solevault-hero.webp')}
                />
              </Link>
              <div className="cart-item-copy">
                <p className="eyebrow">{product.brand}</p>
                <h2>{product.name}</h2>
                <div className="cart-controls">
                  <label>
                    Size
                    <select
                      value={size}
                      onChange={(event) => updateItem(product.id, size, { size: event.target.value })}
                    >
                      {product.sizes
                        .filter((entry) => Number(product.stock[entry] || 0) > 0)
                        .map((entry) => (
                          <option key={entry}>{entry}</option>
                        ))}
                    </select>
                  </label>
                  <div className="qty-control">
                    <button
                      onClick={() =>
                        quantity === 1
                          ? removeItem(product.id, size)
                          : updateItem(product.id, size, { quantity: quantity - 1 })
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() =>
                        updateItem(product.id, size, { quantity: Math.min(5, quantity + 1) })
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus />
                    </button>
                  </div>
                </div>
                <div className="cart-item-price">
                  <strong>{money(Number(product.sale_price) * quantity)}</strong>
                  <s>{money(Number(product.mrp) * quantity)}</s>
                </div>
              </div>
              <button
                className="remove-item"
                onClick={() => removeItem(product.id, size)}
                aria-label={`Remove ${product.name}`}
              >
                <Trash2 />
              </button>
            </article>
          ))}
        </section>
        <aside className="order-summary">
          <p className="eyebrow">ORDER SUMMARY</p>
          <h2>{money(total)}</h2>
          <div>
            <span>MRP total</span>
            <span>{money(mrpTotal)}</span>
          </div>
          <div className="saving">
            <span>Vault discount</span>
            <strong>− {money(discount)}</strong>
          </div>
          <div>
            <span>Shipping</span>
            <span>{shipping ? money(shipping) : 'FREE'}</span>
          </div>
          <div className="summary-total">
            <strong>Total</strong>
            <strong>{money(total)}</strong>
          </div>
          <p className="saving-note">You save {money(discount)} on this order.</p>
          <Link className="button accent full" to="/checkout">
            Secure checkout <ArrowRight />
          </Link>
          <p className="secure-note">
            <ShieldCheck /> Secure UPI checkout · Server-confirmed
          </p>
        </aside>
      </div>
    </div>
  );
}
