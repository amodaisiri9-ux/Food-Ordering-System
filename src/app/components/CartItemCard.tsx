import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { formatLKR } from '../utils/currency';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </motion.div>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </motion.div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-primary">
                    {formatLKR(item.price * item.quantity)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatLKR(item.price)} each
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
