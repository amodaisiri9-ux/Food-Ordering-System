import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { formatLKR } from '../utils/currency';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal } = useCart();
  const { createOrder } = useOrder();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    orderType: 'dine-in' as 'dine-in' | 'takeaway',
    tableNumber: '',
    specialNotes: '',
  });

  const total = getCartTotal();
  const tax = total * 0.1;
  const grandTotal = total + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (formData.orderType === 'dine-in' && !formData.tableNumber) {
      toast.error('Please enter your table number');
      return;
    }

    createOrder({
      items: cart,
      subtotal: total,
      tax,
      total: grandTotal,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      orderType: formData.orderType === 'dine-in' ? 'Dining' : 'Takeaway',
      tableNumber:
        formData.orderType === 'dine-in' && formData.tableNumber
          ? Number(formData.tableNumber)
          : undefined,
      specialNotes: formData.specialNotes,
    });

    navigate('/payment');
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your order</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+94 77 123 4567"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Order Type</Label>
                      <RadioGroup
                        value={formData.orderType}
                        onValueChange={(value: 'dine-in' | 'takeaway') =>
                          setFormData({ ...formData, orderType: value })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="dine-in" id="dine-in" />
                          <Label htmlFor="dine-in" className="font-normal">
                            Dine-in
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="takeaway" id="takeaway" />
                          <Label htmlFor="takeaway" className="font-normal">
                            Takeaway
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.orderType === 'dine-in' && (
                      <div className="space-y-2">
                        <Label htmlFor="tableNumber">Table Number</Label>
                        <Input
                          id="tableNumber"
                          type="number"
                          placeholder="Enter table number"
                          value={formData.tableNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, tableNumber: e.target.value })
                          }
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Special Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special instructions for your order..."
                        value={formData.specialNotes}
                        onChange={(e) =>
                          setFormData({ ...formData, specialNotes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" size="lg" className="w-full">
                        Continue to Payment
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatLKR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatLKR(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-medium">{formatLKR(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">
                    {formatLKR(grandTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
