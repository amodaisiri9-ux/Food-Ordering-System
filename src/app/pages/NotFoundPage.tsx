import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home, Search } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center px-4"
      >
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        </motion.div>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="gap-2">
                <Home className="h-5 w-5" />
                Go Home
              </Button>
            </motion.div>
          </Link>
          <Link to="/menu">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="gap-2">
                <Search className="h-5 w-5" />
                Browse Menu
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
