import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Home, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-kenya-housing.jpg";

const HeroSection = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    satisfiedClients: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, status')
        .eq('status', 'active');

      if (!error && properties) {
        setStats({
          totalProperties: properties.length,
          activeListings: properties.length,
          satisfiedClients: Math.floor(properties.length * 0.8) // Estimated
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Beautiful Kenyan housing with Mount Kenya backdrop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Kenyan Home
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Discover beautiful properties for rent and sale across Kenya. 
              From Nairobi apartments to coastal villas.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-strong max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Enter county or town (e.g., Nairobi, Mombasa)"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                  />
                </div>
              </div>
              
              <div>
                <select className="w-full py-3 px-4 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background">
                  <option value="">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="maisonette">Maisonette</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="mansion">Mansion</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <Button size="lg" className="h-12 bg-gradient-hero hover:opacity-90 transition-all duration-300 shadow-medium">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Home className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalProperties.toLocaleString()}+</div>
                <div className="text-white/80 text-sm">Properties Listed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.activeListings.toLocaleString()}</div>
                <div className="text-white/80 text-sm">Active Listings</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.satisfiedClients.toLocaleString()}+</div>
                <div className="text-white/80 text-sm">Satisfied Clients</div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/properties">
              <Button size="lg" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm">
                <Home className="h-5 w-5 mr-2" />
                Browse Properties
              </Button>
            </Link>
            <Link to="/create-listing">
              <Button size="lg" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm">
                <Star className="h-5 w-5 mr-2" />
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;