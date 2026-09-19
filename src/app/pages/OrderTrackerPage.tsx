import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Check,
  ChefHat,
  Clock,
  Package,
  Receipt,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';
import { useOrder, Order } from '../context/OrderContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { formatLKR } from '../utils/currency';

const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const orderSteps = [
  { id: 'Pending', label: 'Order Placed', icon: Receipt },
  { id: 'Confirmed', label: 'Confirmed', icon: Check },
  { id: 'Preparing', label: 'Preparing', icon: ChefHat },
  { id: 'Ready', label: 'Ready for Pickup', icon: Package },
  { id: 'Completed', label: 'Completed', icon: Check },
];

function getEstimatedPrepMinutes(order: Order) {
  if (order.preparationTime) return order.preparationTime;

  const itemPrep = order.items.reduce(
    (max, item) => Math.max(max, item.preparationTime || 15),
    0
  );

  return itemPrep || 25;
}

function getEstimatedDeliveryTime(order: Order) {
  const delivery = new Date(order.createdAt);
  delivery.setMinutes(delivery.getMinutes() + getEstimatedPrepMinutes(order));
  return delivery;
}

export function OrderTrackerPage() {
  const navigate = useNavigate();
  const { currentOrder, updateOrderStatus, clearOrder } = useOrder();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!currentOrder) {
      const timer = setTimeout(() => navigate('/checkout'), 100);
      return () => clearTimeout(timer);
    }

    if (currentOrder.orderType !== 'Takeaway') {
      navigate('/order-slip');
      return;
    }

    setIsReady(true);
  }, [currentOrder, navigate]);

  useEffect(() => {
    if (!currentOrder) return;

    const statusTimers: Record<string, number> = {
      Pending: 4000,
      Confirmed: 6000,
      Preparing: 8000,
      Ready: 0,
    };

    const currentStepIndex = orderSteps.findIndex(
      (step) => step.id === currentOrder.status
    );

    if (currentStepIndex < orderSteps.length - 1) {
      const timer = setTimeout(() => {
        const nextStatus = orderSteps[currentStepIndex + 1].id as typeof currentOrder.status;
        updateOrderStatus(nextStatus);
      }, statusTimers[currentOrder.status] || 5000);

      return () => clearTimeout(timer);
    }
  }, [currentOrder?.status, updateOrderStatus]);

  useEffect(() => {
    if (!currentOrder) return;

    const deliveryTime = getEstimatedDeliveryTime(currentOrder);

    const updateRemaining = () => {
      const mins = Math.max(
        0,
        Math.ceil((deliveryTime.getTime() - Date.now()) / 60000)
      );
      setTimeRemaining(mins);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 30000);
    return () => clearInterval(interval);
  }, [currentOrder]);

  const handleConfirmReceived = async () => {
    if (!currentOrder) return;
    setIsConfirming(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/orders/${currentOrder.id}/receive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(error);
    } finally {
      clearOrder();
      navigate('/');
    }
  };

  if (!isReady || !currentOrder) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading order tracking...</p>
      </div>
    );
  }

  const currentStepIndex = Math.max(
    0,
    orderSteps.findIndex((step) => step.id === currentOrder.status)
  );
  const progress = ((currentStepIndex + 1) / orderSteps.length) * 100;
  const orderDate = new Date(currentOrder.createdAt).toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const deliveryTime = getEstimatedDeliveryTime(currentOrder);
  const deliveryTimeLabel = deliveryTime.toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const prepMinutes = getEstimatedPrepMinutes(currentOrder);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Takeaway Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Track your order and pickup time below
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Estimated Delivery / Pickup Time</p>
                    <p className="text-2xl font-bold text-primary">{deliveryTimeLabel}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentOrder.status === 'Ready'
                        ? 'Your order is ready for pickup!'
                        : timeRemaining > 0
                        ? `Approximately ${timeRemaining} minute${timeRemaining === 1 ? '' : 's'} remaining`
                        : 'Your order should be ready soon'}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Prep Time</p>
                    <p className="text-lg font-semibold">{prepMinutes} mins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-2 border-dashed border-primary/30">
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">Food Hub</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Takeaway Order Slip</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Number</p>
                    <p className="font-bold text-lg text-primary">
                      {currentOrder.orderNumber || currentOrder.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Order Type</p>
                    <p className="font-bold text-lg">Takeaway</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{orderDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Payment</p>
                    <p className="font-medium">
                      {currentOrder.paymentMethod || '—'}{' '}
                      ({currentOrder.paymentStatus || 'Pending'})
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-semibold mb-2">Customer Details</p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name: </span>
                      {currentOrder.customerName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email: </span>
                      {currentOrder.customerEmail}
                    </p>
                    {currentOrder.customerPhone && (
                      <p>
                        <span className="text-muted-foreground">Phone: </span>
                        {currentOrder.customerPhone}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-semibold mb-3">Order Details</p>
                  <div className="space-y-2">
                    {currentOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name}{' '}
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </span>
                        <span className="font-medium">
                          {formatLKR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentOrder.specialNotes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold mb-1">Special Notes</p>
                      <p className="text-sm text-muted-foreground">
                        {currentOrder.specialNotes}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatLKR(currentOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>{formatLKR(currentOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatLKR(currentOrder.total)}</span>
                  </div>
                </div>

                <Separator />

                <div className="pt-2 text-center space-y-3">
                  {currentOrder.status === 'Ready' ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Your takeaway order is ready. Collect it and confirm pickup.
                      </p>
                      <Button
                        size="lg"
                        className="w-full gap-2"
                        onClick={handleConfirmReceived}
                        disabled={isConfirming}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        {isConfirming ? 'Confirming...' : 'Pickup Confirm'}
                      </Button>
                    </>
                  ) : currentOrder.status !== 'Completed' ? (
                    <p className="text-sm text-muted-foreground">
                      Pickup Confirm button will be available when your order is ready.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      {orderSteps[currentStepIndex]?.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {orderSteps.slice(0, 4).map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="flex flex-col items-center text-center">
                        <motion.div
                          animate={{ scale: isCurrent ? [1, 1.1, 1] : 1 }}
                          transition={{
                            duration: 1,
                            repeat: isCurrent ? Infinity : 0,
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                            isCompleted
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                        <span className="text-[10px] font-medium leading-tight">
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {currentOrder.status !== 'Ready' &&
            currentOrder.status !== 'Completed' && (
              <p className="text-center text-sm text-muted-foreground">
                Please wait while your order is being prepared. Pickup time:{' '}
                <span className="font-medium text-foreground">{deliveryTimeLabel}</span>
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
