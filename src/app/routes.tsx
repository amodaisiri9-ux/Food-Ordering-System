import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { LandingPage } from './pages/LandingPage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/LoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackerPage } from './pages/OrderTrackerPage';
import { PaymentPage } from './pages/PaymentPage';
import { OrderSlipPage } from './pages/OrderSlipPage';
import { ReviewPage } from './pages/ReviewPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AdminPage } from './pages/AdminPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: 'login', Component: LoginPage },
      { path: 'contact', Component: ContactPage },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'menu', Component: MenuPage },
          { path: 'cart', Component: CartPage },
          { path: 'checkout', Component: CheckoutPage },
          { path: 'order-tracker', Component: OrderTrackerPage },
          { path: 'payment', Component: PaymentPage },
          { path: 'order-slip', Component: OrderSlipPage },
        ],
      },
      { path: 'reviews', Component: ReviewPage },
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin', Component: AdminPage },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
