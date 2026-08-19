import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { LoadingState } from './components/StatePanel';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><Suspense fallback={<main className="page-shell"><LoadingState /></main>}><Routes><Route element={<Layout />}><Route index element={<HomePage />} /><Route path="shop" element={<ShopPage />} /><Route path="product/:slug" element={<ProductPage />} /><Route path="cart" element={<CartPage />} /><Route path="login" element={<AuthPage />} /><Route path="wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} /><Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} /><Route path="order-confirmation/:id" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} /><Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} /><Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></Suspense></CartProvider></AuthProvider></BrowserRouter>;
}
