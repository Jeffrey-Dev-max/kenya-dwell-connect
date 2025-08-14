import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";

const FeaturedProperties = () => {
  const properties = [
    {
      id: 1,
      title: "Modern 3BR Apartment in Kilimani",
      location: "Kilimani, Nairobi",
      price: "KSh 85,000",
      type: "rent",
      bedrooms: 3,
      bathrooms: 2,
      area: 1200,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      featured: true
    },
    {
      id: 2,
      title: "Luxury Villa with Ocean View",
      location: "Nyali, Mombasa",
      price: "KSh 12,500,000",
      type: "sale",
      bedrooms: 5,
      bathrooms: 4,
      area: 3500,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
      featured: true
    },
    {
      id: 3,
      title: "Cozy Bedsitter in Kasarani",
      location: "Kasarani, Nairobi",
      price: "KSh 18,000",
      type: "rent",
      bedrooms: 1,
      bathrooms: 1,
      area: 350,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
      featured: false
    },
    {
      id: 4,
      title: "Family Maisonette in Karen",
      location: "Karen, Nairobi",
      price: "KSh 8,500,000",
      type: "sale",
      bedrooms: 4,
      bathrooms: 3,
      area: 2800,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      featured: true
    }
  ];

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Featured Properties
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover handpicked properties across Kenya, from modern city apartments 
            to luxurious coastal villas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="group hover:shadow-medium transition-all duration-300 overflow-hidden border-0 bg-white">
              <div className="relative">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {property.featured && (
                  <Badge className="absolute top-3 left-3 bg-gradient-hero text-white">
                    Featured
                  </Badge>
                )}
                <Badge 
                  className={`absolute top-3 right-3 ${
                    property.type === 'rent' 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  For {property.type === 'rent' ? 'Rent' : 'Sale'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-3 right-3 bg-white/80 hover:bg-white/90 text-foreground p-2 h-auto"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.bathrooms}
                      </div>
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        {property.area}ft²
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-primary">
                      {property.price}
                      {property.type === 'rent' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-hero hover:opacity-90 transition-all duration-300">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View All Properties
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;