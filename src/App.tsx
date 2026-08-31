import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import {
  HomePageSkeleton,
  ShopPageSkeleton,
  ProductPageSkeleton,
  WishlistPageSkeleton,
  AeroGallerySkeleton,
  AccountPageSkeleton,
  AdminPageSkeleton,
  OrderConfirmationSkeleton,
  AuthPageSkeleton,
} from './components/ui/Skeleton';

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
          <Routes>
            <Route element={<Layout />}>
              <Route
                index
                element={
                  <Suspense fallback={<HomePageSkeleton />}>
                    <HomePage />
                  </Suspense>
                }
              />
              <Route
                path="shop"
                element={
                  <Suspense fallback={<ShopPageSkeleton />}>
                    <ShopPage />
                  </Suspense>
                }
              />
              <Route
                path="product/:slug"
                element={
                  <Suspense fallback={<ProductPageSkeleton />}>
                    <ProductPage />
                  </Suspense>
                }
              />
              <Route
                path="cart"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <CartPage />
                  </Suspense>
                }
              />
              <Route
                path="login"
                element={
                  <Suspense fallback={<AuthPageSkeleton />}>
                    <AuthPage />
                  </Suspense>
                }
              />
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<WishlistPageSkeleton />}>
                      <WishlistPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div className="page-shell" />}>
                      <CheckoutPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="order-confirmation/:id"
                element={
                  <Suspense fallback={<OrderConfirmationSkeleton />}>
                    <OrderConfirmationPage />
                  </Suspense>
                }
              />
              <Route
                path="account"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<AccountPageSkeleton />}>
                      <AccountPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <Suspense fallback={<AdminPageSkeleton />}>
                      <AdminPage />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="about"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <AboutPage />
                  </Suspense>
                }
              />
              <Route
                path="faqs"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <FAQsPage />
                  </Suspense>
                }
              />
              <Route
                path="gallery"
                element={
                  <Suspense fallback={<AeroGallerySkeleton count={6} />}>
                    <AeroGalleryPage />
                  </Suspense>
                }
              />
              <Route
                path="aero-gallery"
                element={
                  <Suspense fallback={<AeroGallerySkeleton count={6} />}>
                    <AeroGalleryPage />
                  </Suspense>
                }
              />
              <Route
                path="privacy-policy"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <PrivacyPolicyPage />
                  </Suspense>
                }
              />
              <Route
                path="terms-of-service"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <TermsOfServicePage />
                  </Suspense>
                }
              />
              <Route
                path="refund-policy"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <RefundPolicyPage />
                  </Suspense>
                }
              />
              <Route
                path="shipping-policy"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <ShippingPolicyPage />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<div className="page-shell" />}>
                    <NotFoundPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
