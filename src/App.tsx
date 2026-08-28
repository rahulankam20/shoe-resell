import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import LayoutEnhanced from './components/ui/LayoutEnhanced';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { LoadingState } from './components/StatePanel';

// Import enhanced animation styles
import './styles/animations.css';

// Lazy load pages for better performance
const HomePageEnhanced = lazy(() => import('./pages/HomePageEnhanced'));
const ShopPageEnhanced = lazy(() => import('./pages/ShopPageEnhanced'));
const ProductPageEnhanced = lazy(() => import('./pages/ProductPageEnhanced'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));
const ShippingPolicyPage = lazy(() => import('./pages/ShippingPolicyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const AeroGalleryPage = lazy(() => import('./pages/AeroGalleryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense
            fallback={
              <main className="page-shell">
                <LoadingState />
              </main>
            }
          >
            <Routes>
              <Route element={<LayoutEnhanced />}>
                <Route index element={<HomePageEnhanced />} />
                <Route path="shop" element={<ShopPageEnhanced />} />
                <Route path="product/:slug" element={<ProductPageEnhanced />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="login" element={<AuthPage />} />
                <Route
                  path="wishlist"
                  element={
                    <ProtectedRoute>
                      <WishlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="order-confirmation/:id" element={<OrderConfirmationPage />} />
                <Route
                  path="account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
                <Route path="about" element={<AboutPage />} />
                <Route path="faqs" element={<FAQsPage />} />
                <Route path="gallery" element={<AeroGalleryPage />} />
                <Route path="aero-gallery" element={<AeroGalleryPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-of-service" element={<TermsOfServicePage />} />
                <Route path="refund-policy" element={<RefundPolicyPage />} />
                <Route path="shipping-policy" element={<ShippingPolicyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
