import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Search, MessageCircle, User, Plus, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Kenya Dwell Connect
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => navigate('/properties')}
              className="text-foreground hover:text-primary transition-colors"
            >
              Properties
            </button>
            <button 
              onClick={() => navigate('/properties?listing_mode=rent')}
              className="text-foreground hover:text-primary transition-colors"
            >
              For Rent
            </button>
            <button 
              onClick={() => navigate('/properties?listing_mode=sale')}
              className="text-foreground hover:text-primary transition-colors"
            >
              For Sale
            </button>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                
                {(userRole === 'homeowner' || userRole === 'caretaker') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/create-listing')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    List Property
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                size="sm" 
                className="bg-gradient-hero"
                onClick={() => navigate('/auth')}
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
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
              <button 
                onClick={() => {
                  navigate('/properties');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                Properties
              </button>
              <button 
                onClick={() => {
                  navigate('/properties?listing_mode=rent');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                For Rent
              </button>
              <button 
                onClick={() => {
                  navigate('/properties?listing_mode=sale');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                For Sale
              </button>
              <a href="#about" className="block py-2 text-foreground hover:text-primary transition-colors">
                About
              </a>
              
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/messages');
                        setIsMenuOpen(false);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Button>
                    {(userRole === 'homeowner' || userRole === 'caretaker') && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          navigate('/create-listing');
                          setIsMenuOpen(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        List Property
                      </Button>
                    )}
                    {userRole === 'admin' && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full justify-start bg-gradient-hero"
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;