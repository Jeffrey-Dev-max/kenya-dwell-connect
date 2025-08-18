import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Bed, Bath, Home, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { PropertyCard } from "@/components/PropertyCard";

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: string;
  rent_price: number | null;
  sale_price: number | null;
  listing_mode: string;
  address: string;
  county: string;
  town: string;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean;
  area_sqft: number | null;
  created_at: string;
  currency: string;
  property_amenities: { amenities: { name: string } }[];
  property_media: { url: string; sort_order: number }[];
  owner: {
    display_name: string;
    phone: string;
  };
}

interface Amenity {
  id: string;
  name: string;
}

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    listing_mode: "",
    property_type: "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    bathrooms: "",
    min_sqft: "",
    max_sqft: "",
    location: "",
    amenities: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
    fetchAmenities();
  }, [filters]);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setAmenities(data);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!owner_id(display_name, phone)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,address.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
      }
      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type as any);
      }
      if (filters.listing_mode) {
        query = query.eq('listing_mode', filters.listing_mode as any);
      }
      if (filters.min_price) {
        query = query.or(`rent_price.gte.${parseFloat(filters.min_price)},sale_price.gte.${parseFloat(filters.min_price)}`);
      }
      if (filters.max_price) {
        query = query.or(`rent_price.lte.${parseFloat(filters.max_price)},sale_price.lte.${parseFloat(filters.max_price)}`);
      }
      if (filters.bedrooms) {
        query = query.eq('bedrooms', parseInt(filters.bedrooms));
      }
      if (filters.location) {
        query = query.or(`county.ilike.%${filters.location}%,town.ilike.%${filters.location}%,address.ilike.%${filters.location}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (property: Property) => {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    });
    
    const price = property.listing_mode === 'rent' ? property.rent_price : property.sale_price;
    if (!price) return "Price on request";
    
    const formattedPrice = formatter.format(price);
    return property.listing_mode === 'rent' ? `${formattedPrice}/month` : formattedPrice;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Search and Filters */}
          <div className="bg-card rounded-lg border p-6 mb-8 shadow-soft">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties or ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-9"
                />
              </div>
              
              <Select value={filters.listing_mode} onValueChange={(value) => setFilters({...filters, listing_mode: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.property_type} onValueChange={(value) => setFilters({...filters, property_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Properties</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="bedsitter">Bedsitter</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Min Price (KES)"
                type="number"
                value={filters.min_price}
                onChange={(e) => setFilters({...filters, min_price: e.target.value})}
              />
              
              <Input
                placeholder="Max Price (KES)"
                type="number"
                value={filters.max_price}
                onChange={(e) => setFilters({...filters, max_price: e.target.value})}
              />

              <Select value={filters.bedrooms} onValueChange={(value) => setFilters({...filters, bedrooms: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {loading ? "Loading..." : `${properties.length} Properties Found`}
            </h1>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No properties found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onClick={() => console.log('Property clicked:', property.id)} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Properties;