import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';

export interface CartToast {
  id: string;
  product: Product;
  size: string;
  quantity: number;
}

interface CartValue {
  items: CartItem[];
  count: number;
  mrpTotal: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  toast: CartToast | null;
  dismissToast: () => void;
  addItem: (product: Product, size: string, quantity?: number) => void;
  updateItem: (productId: number, oldSize: string, updates: { size?: string; quantity?: number }) => void;
  removeItem: (productId: number, size: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartValue | null>(null);
const storageKey = 'solevault-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<CartToast | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const dismissToast = () => setToast(null);

  const addItem = (product: Product, size: string, quantity = 1) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.product.id === product.id && item.size === size);
      if (index < 0) return [...current, { product, size, quantity }];
      return current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: Math.min(5, item.quantity + quantity) } : item
      );
    });
    setToast({
      id: `${product.id}-${size}-${Date.now()}`,
      product,
      size,
      quantity,
    });
  };

  const updateItem = (productId: number, oldSize: string, updates: { size?: string; quantity?: number }) =>
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId && item.size === oldSize
          ? { ...item, size: updates.size ?? item.size, quantity: updates.quantity ?? item.quantity }
          : item
      )
    );

  const removeItem = (productId: number, size: string) =>
    setItems((current) => current.filter((item) => !(item.product.id === productId && item.size === size)));

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const mrpTotal = items.reduce((sum, item) => sum + Number(item.product.mrp) * item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.product.sale_price) * item.quantity, 0);
    const shipping = items.length && subtotal < 3000 ? 149 : 0;
    return {
      mrpTotal,
      subtotal,
      shipping,
      discount: mrpTotal - subtotal,
      total: subtotal + shipping,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        ...totals,
        toast,
        dismissToast,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
};
