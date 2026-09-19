import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { useOrder } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { formatLKR } from '../utils/currency';

const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

type PaymentMethod = 'cash' | 'card' | 'visa';

export function PaymentPage() {
  const navigate = useNavigate();
  const { currentOrder, setOrder } = useOrder();
  const { clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrder) {
      toast.error('No order found');
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const paymentMethodMap = {
        cash: 'Cash',
        card: 'Card',
        visa: 'Visa',
      } as const;

      const payload = {
        items: currentOrder.items.map((item) => ({
          foodItem: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        orderType: currentOrder.orderType,
        tableNumber: currentOrder.tableNumber,
        paymentMethod: paymentMethodMap[paymentMethod],
        notes: currentOrder.specialNotes,
      };

      const response = await axios.post(`${API_URL}/orders`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const backendOrder = response.data.data;
      const estimatedPrep =
        backendOrder.preparationTime ??
        Math.max(
          25,
          currentOrder.items.reduce(
            (max: number, item: { preparationTime?: number }) =>
              Math.max(max, item.preparationTime || 15),
            0
          )
        );

      const updatedOrder = {
        ...currentOrder,
        id: backendOrder.id,
        orderNumber: backendOrder.orderNumber,
        status: backendOrder.status,
        paymentMethod: backendOrder.paymentMethod,
        paymentStatus: backendOrder.paymentStatus,
        createdAt: backendOrder.createdAt,
        preparationTime: estimatedPrep,
      };

      setOrder(updatedOrder);
      clearCart();
      setIsTakeaway(updatedOrder.orderType === 'Takeaway');
      setIsPaid(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success('Payment successful! Order placed.');

      setTimeout(() => {
        if (updatedOrder.orderType === 'Takeaway') {
          navigate('/order-tracker');
        } else {
          navigate('/order-slip');
        }
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (currentOrder || isPaid) {
      setIsReady(true);
      return;
    }

    const timer = setTimeout(() => {
      navigate('/checkout');
    }, 100);

    return () => clearTimeout(timer);
  }, [currentOrder, isPaid, navigate]);

  if (!isReady || !currentOrder) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading payment...</p>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-4">
            {isTakeaway
              ? 'Redirecting to order tracker...'
              : 'Redirecting to your order slip...'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2">Payment</h1>
            <p className="text-muted-foreground">Select your payment method</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total: {formatLKR(currentOrder.total)}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                  >
                    <div className="grid gap-3">
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label
                          htmlFor="cash"
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          <DollarSign className="h-5 w-5 text-primary" />
                          <div>
                            <span className="font-medium">Cash</span>
                            <p className="text-xs text-muted-foreground">
                              Pay at the counter
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="card" id="card" />
                        <Label
                          htmlFor="card"
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <span className="font-medium">Card</span>
                            <p className="text-xs text-muted-foreground">
                              Credit / Debit Card
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="visa" id="visa" />
                        <Label
                          htmlFor="visa"
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          <div className="h-5 w-8 bg-blue-600 rounded text-white text-[10px] font-bold flex items-center justify-center">
                            VISA
                          </div>
                          <div>
                            <span className="font-medium">Visa</span>
                            <p className="text-xs text-muted-foreground">
                              Visa card payment
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {(paymentMethod === 'card' || paymentMethod === 'visa') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder={
                            paymentMethod === 'visa'
                              ? '4xxx xxxx xxxx xxxx'
                              : '1234 5678 9012 3456'
                          }
                          value={cardData.number}
                          onChange={(e) =>
                            setCardData({ ...cardData, number: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-name">Cardholder Name</Label>
                        <Input
                          id="card-name"
                          placeholder="John Doe"
                          value={cardData.name}
                          onChange={(e) =>
                            setCardData({ ...cardData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-expiry">Expiry Date</Label>
                          <Input
                            id="card-expiry"
                            placeholder="MM/YY"
                            value={cardData.expiry}
                            onChange={(e) =>
                              setCardData({ ...cardData, expiry: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-cvv">CVV</Label>
                          <Input
                            id="card-cvv"
                            placeholder="123"
                            maxLength={3}
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? 'Processing...'
                        : `Confirm & Pay ${formatLKR(currentOrder.total)}`}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
