import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Plus, Star, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useCart, FoodItem } from '../context/CartContext';
import { formatLKR } from '../utils/currency';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  recommendations?: FoodItem[];
}

export function AiBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadWelcome();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadWelcome = async () => {
    try {
      const res = await axios.get('/api/chat/welcome');
      setMessages([{ role: 'bot', content: res.data.data.reply }]);
      setSuggestions(res.data.data.suggestions);
    } catch {
      setMessages([
        {
          role: 'bot',
          content:
            'Hello! 😊 I\'m your Food Hub buddy. Tell me what you need — I\'ll pick the right menu for you.',
        },
      ]);
      setSuggestions(['Popular recommendations', 'Main course under Rs 15', 'Sweet dessert']);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage = text.trim();
    setInput('');
    setSuggestions([]);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: userMessage, history });
      const { reply, recommendations, suggestions: newSuggestions } = res.data.data;

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: reply, recommendations },
      ]);
      setSuggestions(newSuggestions || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content:
            'Sorry, something went wrong. Please check if the backend server is running and try again! 🙏',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: FoodItem) => {
    addToCart(item);
    toast.success(`${item.name} added to cart!`);
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Food Hub AI</p>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Smart Menu Assistant
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    {formatMessage(msg.content)}
                  </div>
                </div>
              ))}

              {messages.map(
                (msg, idx) =>
                  msg.recommendations &&
                  msg.recommendations.length > 0 && (
                    <div key={`rec-${idx}`} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground px-1">
                        Recommended for you
                      </p>
                      {msg.recommendations.map((item, itemIdx) => (
                        <div
                          key={item.id}
                          className={`flex gap-3 p-2 rounded-xl border bg-card hover:shadow-md transition-shadow ${
                            itemIdx === 0 ? 'border-primary/40 ring-1 ring-primary/20' : ''
                          }`}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=100&h=100&fit=crop';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {itemIdx === 0 && <span className="text-primary mr-1">⭐</span>}
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-bold text-primary">
                                {formatLKR(item.price)}
                              </span>
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="text-xs">{item.rating}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0 self-center h-8"
                            onClick={() => handleAddToCart(item)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="w-2 h-2 rounded-full bg-primary/60"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {suggestions.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Tell me what you'd like to eat..."
                className="flex-1"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </motion.div>
    </>
  );
}
