import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <RouterProvider router={router} />
          <Toaster />
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}