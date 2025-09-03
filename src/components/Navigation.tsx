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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card backdrop-blur-xl border-b border-white/10 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-glow transition-all duration-300">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">
              Kenya Dwell Connect
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => navigate('/properties')}
              className="text-foreground hover:text-primary transition-colors font-medium hover:scale-105 transform transition-transform duration-200"
            >
              Properties
            </button>
            <button 
              onClick={() => navigate('/properties?listing_mode=rent')}
              className="text-foreground hover:text-primary transition-colors font-medium hover:scale-105 transform transition-transform duration-200"
            >
              For Rent
            </button>
            <button 
              onClick={() => navigate('/properties?listing_mode=sale')}
              className="text-foreground hover:text-primary transition-colors font-medium hover:scale-105 transform transition-transform duration-200"
            >
              For Sale
            </button>
            <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium hover:scale-105 transform transition-transform duration-200">
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
                  className="glass-card hover-glow"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                
                {(userRole === 'homeowner' || userRole === 'caretaker') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/create-listing')}
                    className="glass-card hover-glow border-primary/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    List Property
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full glass-card hover-glow">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                        <AvatarFallback className="bg-gradient-hero text-white">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-card backdrop-blur-xl" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="hover:bg-primary/10">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="hover:bg-primary/10">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="hover:bg-destructive/10 text-destructive">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                size="sm" 
                className="bg-gradient-hero hover-glow shadow-medium"
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
          <div className="md:hidden py-4 border-t border-white/10 glass-card backdrop-blur-xl">
            <div className="space-y-3">
              <button 
                onClick={() => {
                  navigate('/properties');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-foreground hover:text-primary transition-colors font-medium rounded-lg hover:bg-primary/5"
              >
                Properties
              </button>
              <button 
                onClick={() => {
                  navigate('/properties?listing_mode=rent');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-foreground hover:text-primary transition-colors font-medium rounded-lg hover:bg-primary/5"
              >
                For Rent
              </button>
              <button 
                onClick={() => {
                  navigate('/properties?listing_mode=sale');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-foreground hover:text-primary transition-colors font-medium rounded-lg hover:bg-primary/5"
              >
                For Sale
              </button>
              <a href="#about" className="block py-3 px-4 text-foreground hover:text-primary transition-colors font-medium rounded-lg hover:bg-primary/5">
                About
              </a>
              
              <div className="pt-4 space-y-3">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start glass-card hover-glow"
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
                      className="w-full justify-start glass-card hover-glow"
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
                        className="w-full justify-start glass-card hover-glow"
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
                        className="w-full justify-start glass-card hover-glow"
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
                    className="w-full justify-start bg-gradient-hero hover-glow shadow-medium"
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