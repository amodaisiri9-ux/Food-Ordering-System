import { Link } from 'react-router';
import { UtensilsCrossed, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Food Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your favorite restaurant ordering system. Fresh food, fast delivery, amazing taste.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/menu" className="text-muted-foreground hover:text-primary transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/order-tracker" className="text-muted-foreground hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+94 77 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@foodhub.lk</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>No. 22, Galle Road, Colombo 03</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Opening Hours</h3>
            <p className="text-sm text-muted-foreground">
              Mon - Sun: 10:00 AM - 11:00 PM
            </p>
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Food Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
