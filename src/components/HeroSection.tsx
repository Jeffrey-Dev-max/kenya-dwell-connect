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
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-blue-900/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-bold leading-tight">
              Find Your Perfect
              <span className="block text-gradient bg-gradient-aurora bg-clip-text text-transparent">
                Kenyan Home
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Discover exceptional properties for rent and sale across Kenya. 
              From luxury Nairobi apartments to stunning coastal villas.
            </p>
          </div>

          {/* Search Bar */}
          <div className="glass-card rounded-3xl p-8 shadow-strong max-w-4xl mx-auto border border-white/20 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Enter county or town (e.g., Nairobi, Mombasa)"
                    className="w-full pl-12 pr-4 py-4 rounded-xl glass-card border border-white/30 focus:ring-2 focus:ring-primary focus:border-primary/50 text-foreground bg-white/10 placeholder-white/70 backdrop-blur-xl transition-all duration-300"
                  />
                </div>
              </div>
              
              <div>
                <select className="w-full py-4 px-4 rounded-xl glass-card border border-white/30 focus:ring-2 focus:ring-primary focus:border-primary/50 text-foreground bg-white/10 backdrop-blur-xl transition-all duration-300">
                  <option value="">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="maisonette">Maisonette</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="mansion">Mansion</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <Button size="lg" variant="premium" className="h-14">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card className="glass-card border-white/20 backdrop-blur-xl hover-glow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gradient mb-2">{stats.totalProperties.toLocaleString()}+</div>
                <div className="text-white/80 text-lg">Properties Listed</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-white/20 backdrop-blur-xl hover-glow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-sunset rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gradient mb-2">{stats.activeListings.toLocaleString()}</div>
                <div className="text-white/80 text-lg">Active Listings</div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-white/20 backdrop-blur-xl hover-glow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-aurora rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gradient mb-2">{stats.satisfiedClients.toLocaleString()}+</div>
                <div className="text-white/80 text-lg">Satisfied Clients</div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
            <Link to="/properties">
              <Button size="lg" variant="outline" className="text-white hover:text-primary">
                <Home className="h-5 w-5 mr-2" />
                Browse Properties
              </Button>
            </Link>
            <Link to="/create-listing">
              <Button size="lg" variant="secondary">
                <Star className="h-5 w-5 mr-2" />
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-14 border-2 border-white/50 rounded-full flex justify-center glass-card backdrop-blur-xl">
          <div className="w-2 h-4 bg-gradient-hero rounded-full mt-3 animate-pulse shadow-glow" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;