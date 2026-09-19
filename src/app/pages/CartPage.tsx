import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CartItemCard } from '../components/CartItemCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { formatLKR } from '../utils/currency';

export function CartPage() {
  const { cart, getCartTotal, getCartCount } = useCart();
  const total = getCartTotal();
  const tax = total * 0.1;
  const grandTotal = total + tax;

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <ShoppingBag className="h-24 w-24 text-muted-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some delicious items to get started!
          </p>
          <Link to="/menu">
            <Button size="lg">
              Browse Menu
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
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
            <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {cart.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
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
              <CardFooter>
                <Link to="/checkout" className="w-full">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="w-full">
                      Proceed to Checkout
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
