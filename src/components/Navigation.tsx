import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Search, MessageCircle, User, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Kenya Dwell Connect
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Properties
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              For Rent
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              For Sale
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              List Property
            </Button>
            <Button size="sm" className="bg-gradient-hero">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="space-y-3">
              <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">
                Properties
              </a>
              <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">
                For Rent
              </a>
              <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">
                For Sale
              </a>
              <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">
                About
              </a>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  List Property
                </Button>
                <Button className="w-full justify-start bg-gradient-hero">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;