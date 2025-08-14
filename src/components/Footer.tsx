import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Kenya Dwell Connect</span>
            </div>
            <p className="text-background/80 text-sm">
              Kenya's premier platform for finding and listing properties. 
              Connecting homeowners, tenants, and caretakers across all 47 counties.
            </p>
            <div className="flex space-x-3">
              <Facebook className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Properties for Rent</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Properties for Sale</a></li>
              <li><a href="#" className="hover:text-background transition-colors">List Your Property</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Find Agencies</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Property Reviews</a></li>
            </ul>
          </div>

          {/* Popular Locations */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Popular Counties</h3>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Nairobi</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Mombasa</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Kisumu</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Nakuru</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Eldoret</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3 text-background/80">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@kenyadwellconnect.co.ke</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+254 700 123 456</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-background/60 text-sm">
          <div>
            © 2024 Kenya Dwell Connect. All rights reserved.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-background transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;