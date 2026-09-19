import { Plus, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { FoodItem, useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { toast } from 'sonner';
import { formatLKR } from '../utils/currency';

interface FoodCardProps {
  item: FoodItem;
}

export function FoodCard({ item }: FoodCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item);
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&h=400&fit=crop';
            }}
          />
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{item.rating}</span>
          </div>
        </div>

        <CardContent className="flex-1 p-4">
          <h3 className="font-semibold mb-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatLKR(item.price)}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {item.category}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <motion.div className="w-full" whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleAddToCart}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add to Cart
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
