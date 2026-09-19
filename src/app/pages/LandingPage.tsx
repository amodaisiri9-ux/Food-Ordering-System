import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Clock, Shield, Star, ChefHat, Bot, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FoodCard } from '../components/FoodCard';
import { menuData } from '../data/menuData';
import { Card, CardContent } from '../components/ui/card';
import { loadReviews, Review } from '../utils/reviewStorage';
import { AiBotWidget } from '../components/AiBotWidget';

export function LandingPage() {
  const featuredItems = menuData.slice(0, 6);
  const targetRef = useRef<HTMLDivElement>(null);
  const [homeReviews, setHomeReviews] = useState<Review[]>([]);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  useEffect(() => {
    setHomeReviews(loadReviews().slice(0, 3));
  }, []);

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  const features = [
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Get your food delivered in 30 minutes or less',
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      icon: Star,
      title: 'Quality Food',
      description: 'Fresh ingredients, prepared with care',
      color: 'bg-yellow-500/10 text-yellow-500'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Secure payments and hygienic packaging',
      color: 'bg-green-500/10 text-green-500'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section ref={targetRef} className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 100, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
              x: [0, -100, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              style={{ opacity, scale, y }}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
              >
                <Star className="h-4 w-4 fill-current" />
                <span>Top Rated Food Hub in Town</span>
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]">
                Savor the <span className="text-primary italic">Perfect</span> 
                <br />
                Dining Experience
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
                Indulge in a world of flavors. We bring the finest cuisines right to your doorstep with speed and elegance.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/menu">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 gap-2">
                      Order Now
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/menu">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2">
                      Explore Menu
                    </Button>
                  </motion.div>
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-muted overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-bold">2,500+ Happy Customers</p>
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] aspect-square max-w-[500px] mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop"
                  alt="Delicious food bowl"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Floating UI Elements */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 z-20 bg-background/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Time</p>
                    <p className="font-bold">25-30 Mins</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 z-20 bg-background/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quality</p>
                    <p className="font-bold">Chef's Choice</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="group hover:shadow-2xl transition-all duration-500 border-none bg-muted/30">
                  <CardContent className="p-10 text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${feature.color} mb-6 transition-transform`}
                    >
                      <feature.icon className="h-10 w-10" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 md:p-12"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4" />
                  AI Powered
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Tell us your preferences — <span className="text-primary">AI Bot</span> picks your order
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Simply tell us what you need — our AI Bot responds like a friend and picks the best
                  dishes from our menu. Add to cart with one click!
                </p>
                <p className="text-sm text-muted-foreground">
                  Budget, spicy, vegetarian, dessert — tell us what you like and our AI finds the perfect order for you.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Bot className="h-10 w-10 text-primary-foreground" />
                </div>
                <p className="text-sm font-medium text-center md:text-right">
                  Click the Bot icon in the bottom-right corner 👇
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Our Most <span className="text-primary">Loved</span> Dishes
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg">
                Hand-picked by our chefs and loved by our community. Discover the flavors that make us special.
              </p>
            </div>
            <Link to="/menu">
              <Button variant="ghost" className="group text-primary hover:text-primary hover:bg-primary/5 text-lg">
                View full menu
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <FoodCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3">Customer Reviews</h2>
              <p className="text-muted-foreground max-w-2xl text-lg">
                See the latest messages from customers who loved their meal. Want to add your own review? Visit the review page and share your experience.
              </p>
            </div>
            <Link to="/reviews">
              <Button variant="secondary" className="rounded-full px-6 py-3">
                Share a Review
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {homeReviews.map((review) => (
              <Card key={review.id} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-sm text-muted-foreground">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-[0_40px_100px_-15px_rgba(var(--primary),0.4)]">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-white"
              >
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  Hungry? We've Got You Covered.
                </h2>
                <p className="text-xl text-white/80 mb-10 leading-relaxed">
                  Join over 10,000+ foodies who enjoy our weekly specials and exclusive offers. Your next favorite meal is just a few clicks away.
                </p>
                <Link to="/menu">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="secondary" className="h-16 px-10 text-xl rounded-full gap-3 shadow-2xl">
                      Start Your Order
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="hidden md:flex justify-center"
              >
                <div className="w-80 h-80 bg-white/10 backdrop-blur-2xl rounded-full p-8 relative">
                   <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-full animate-spin-slow" />
                   <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-6 shadow-inner">
                      <img src="https://images.search.yahoo.com/search/images;_ylt=AwrOuH50vhZqWwIAUR9XNyoA;_ylu=Y29sbwNncTEEcG9zAzEEdnRpZAMEc2VjA3BpdnM-?p=foods+images&fr2=piv-web&type=E210US91215G0&fr=mcafee&imgurl=https%3A%2F%2Fcdn.pixabay.com%2Fphoto%2F2024%2F05%2F20%2F12%2F59%2Ffood-8775158_1280.jpg" alt="Cta" className="rounded-full" />
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <AiBotWidget />
    </div>
  );
}
