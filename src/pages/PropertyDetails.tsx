import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  Home, 
  MapPin, 
  MessageSquare, 
  Phone, 
  User,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Car
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
  latitude: number | null;
  longitude: number | null;
  deposit_amount: number | null;
  owner: {
    id: string;
    full_name: string;
    phone_number: string;
    email: string;
  };
  property_media: { url: string; sort_order: number }[];
  property_amenities: { amenities: { name: string } }[];
}

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_media(url, sort_order),
          property_amenities(
            amenities(name)
          ),
          owner:profiles!owner_id(id, full_name, phone_number, email)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setProperty(data as any);
    } catch (error: any) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive",
      });
      navigate('/properties');
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

  const handleContactOwner = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact the property owner",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!property) return;

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`
          and(participant_a.eq.${user.id},participant_b.eq.${property.owner.id}),
          and(participant_a.eq.${property.owner.id},participant_b.eq.${user.id})
        `)
        .eq('property_id', property.id)
        .maybeSingle();

      if (existingConversation) {
        navigate('/messages');
        return;
      }

      // Create new conversation
      const { error } = await supabase
        .from('conversations')
        .insert({
          participant_a: user.id,
          participant_b: property.owner.id,
          property_id: property.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conversation started! Check your messages.",
      });

      navigate('/messages');
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const nextImage = () => {
    if (property?.property_media) {
      setCurrentImageIndex((prev) => 
        prev === property.property_media.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.property_media) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.property_media.length - 1 : prev - 1
      );
    }
  };

  const currentImage = property?.property_media?.[currentImageIndex];
  const images = property?.property_media?.sort((a, b) => a.sort_order - b.sort_order) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-8">
              <div className="h-96 bg-gradient-aurora/20 rounded-2xl"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-8 bg-gradient-aurora/20 rounded-lg"></div>
                  <div className="h-32 bg-gradient-aurora/20 rounded-lg"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-gradient-aurora/20 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Property Not Found</CardTitle>
                <CardDescription>The property you're looking for doesn't exist or has been removed.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/properties')} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Properties
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/properties')} 
            className="mb-6 glass-card hover-glow"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="relative mb-8 glass-card rounded-2xl overflow-hidden shadow-medium">
              <div className="relative h-96 lg:h-[500px]">
                <img
                  src={currentImage?.url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 glass-card hover-glow"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 glass-card hover-glow"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Fullscreen Button */}
                <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 glass-card hover-glow"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl w-full h-full max-h-[90vh] p-0">
                    <div className="relative h-full">
                      <img
                        src={currentImage?.url}
                        alt={property.title}
                        className="w-full h-full object-contain"
                      />
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card px-3 py-1 rounded-full">
                    <span className="text-sm font-medium">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="p-4 bg-white/5 backdrop-blur-sm">
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex 
                            ? 'border-primary shadow-glow' 
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`${property.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Property Title and Details */}
              <Card className="glass-card shadow-medium hover-glow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl lg:text-3xl text-gradient mb-2">
                        {property.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        {property.address ? `${property.address}, ` : ''}{property.town}, {property.county}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="glass-card hover-glow">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="glass-card hover-glow">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-3xl font-bold text-gradient">
                    {formatPrice(property)}
                    {property.deposit_amount && (
                      <span className="text-lg text-muted-foreground ml-2">
                        + KES {property.deposit_amount.toLocaleString()} deposit
                      </span>
                    )}
                  </div>

                  {/* Property Features */}
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="secondary" className="glass-card flex items-center gap-2 px-4 py-2">
                      <Home className="h-4 w-4" />
                      {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
                    </Badge>
                    {property.bedrooms && (
                      <Badge variant="secondary" className="glass-card flex items-center gap-2 px-4 py-2">
                        <Bed className="h-4 w-4" />
                        {property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {property.bathrooms && (
                      <Badge variant="secondary" className="glass-card flex items-center gap-2 px-4 py-2">
                        <Bath className="h-4 w-4" />
                        {property.bathrooms} Bathroom{property.bathrooms > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {property.area_sqft && (
                      <Badge variant="secondary" className="glass-card px-4 py-2">
                        {property.area_sqft.toLocaleString()} sq ft
                      </Badge>
                    )}
                    {property.furnished && (
                      <Badge variant="secondary" className="glass-card px-4 py-2">
                        Furnished
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gradient mb-4">Description</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {property.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Amenities */}
                  {property.property_amenities?.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-xl font-semibold text-gradient mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {property.property_amenities.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-muted-foreground">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              {item.amenities.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Location Map Placeholder */}
              {(property.latitude && property.longitude) && (
                <Card className="glass-card shadow-medium hover-glow">
                  <CardHeader>
                    <CardTitle className="text-gradient">Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gradient-aurora/20 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Map integration coming soon</p>
                        <p className="text-sm text-muted-foreground">
                          Coordinates: {property.latitude}, {property.longitude}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="glass-card shadow-medium hover-glow sticky top-24">
                <CardHeader>
                  <CardTitle className="text-gradient">Contact Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{property.owner?.full_name || 'Property Owner'}</p>
                      <p className="text-sm text-muted-foreground">Property Owner</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={handleContactOwner}
                      className="w-full bg-gradient-hero hover-glow shadow-medium"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    
                    {property.owner?.phone_number && (
                      <Button 
                        variant="outline" 
                        className="w-full glass-card hover-glow border-primary/20"
                        onClick={() => window.open(`tel:${property.owner.phone_number}`, '_self')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>Listed on {new Date(property.created_at).toLocaleDateString()}</p>
                    <p>Property ID: {property.id.slice(0, 8)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card className="glass-card shadow-medium hover-glow">
                <CardHeader>
                  <CardTitle className="text-gradient">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{property.property_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listing</span>
                    <Badge variant="outline" className="capitalize">
                      For {property.listing_mode}
                    </Badge>
                  </div>
                  {property.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bedrooms</span>
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bathrooms</span>
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                  )}
                  {property.area_sqft && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Area</span>
                      <span className="font-medium">{property.area_sqft.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Furnished</span>
                    <span className="font-medium">{property.furnished ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetails;