import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem } from './CartContext';

export interface OrderItem extends CartItem {
  preparationTime?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderType: 'Dining' | 'Takeaway';
  specialNotes?: string;
  paymentMethod?: 'Cash' | 'Card' | 'Visa';
  paymentStatus?: 'Pending' | 'Paid';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  createdAt: string;
  preparationTime?: number;
  tableNumber?: number;
}

interface OrderContextType {
  currentOrder: Order | null;
  createOrder: (orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'paymentStatus' | 'orderNumber'>) => void;
  setOrder: (order: Order) => void;
  updateOrderStatus: (status: Order['status']) => void;
  clearOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'foodhub-current-order';

function loadStoredOrder(): Order | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as Order;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveStoredOrder(order: Order | null) {
  if (order) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(() => loadStoredOrder());

  useEffect(() => {
    saveStoredOrder(currentOrder);
  }, [currentOrder]);

  const createOrder = (orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'paymentStatus' | 'orderNumber'>) => {
    const order: Order = {
      ...orderData,
      id: `draft-${Date.now()}`,
      status: 'Pending',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };
    saveStoredOrder(order);
    setCurrentOrder(order);
  };

  const setOrder = (order: Order) => {
    saveStoredOrder(order);
    setCurrentOrder(order);
  };

  const updateOrderStatus = (status: Order['status']) => {
    if (currentOrder) {
      const updated = { ...currentOrder, status };
      saveStoredOrder(updated);
      setCurrentOrder(updated);
    }
  };

  const clearOrder = () => {
    saveStoredOrder(null);
    setCurrentOrder(null);
  };

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        createOrder,
        setOrder,
        updateOrderStatus,
        clearOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
}
