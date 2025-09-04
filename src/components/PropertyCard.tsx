import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageCarousel } from "./ImageCarousel";

interface Property {
  id: string;
  title: string;
  county: string;
  town: string;
  property_type: string;
  listing_mode: string;
  rent_price?: number;
  sale_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  currency: string;
  images?: string[];
}

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export const PropertyCard = ({ property, onClick }: PropertyCardProps) => {
  const navigate = useNavigate();
  const price = property.listing_mode === 'rent' ? property.rent_price : property.sale_price;
  const priceLabel = property.listing_mode === 'rent' ? '/month' : '';

  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
    onClick?.();
  };

  return (
    <Card className="glass-card hover-glow cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden group" onClick={handleCardClick}>
      <CardContent className="p-0">
        <div className="relative">
          <ImageCarousel 
            images={property.images || []} 
            alt={property.title}
            className="h-64 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge className="bg-gradient-hero text-white border-0 shadow-medium">
              {property.listing_mode}
            </Badge>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-xl line-clamp-2 text-gradient group-hover:text-primary transition-colors duration-300">
              {property.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm mt-2">
              <MapPin className="h-4 w-4 mr-2 text-primary/70" />
              {property.town}, {property.county}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gradient">
              {property.currency} {price?.toLocaleString()}{priceLabel}
            </div>
            <div className="text-xs text-muted-foreground glass-card px-3 py-1 rounded-full border border-white/20">
              ID: {property.id.slice(0, 8)}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {property.bedrooms && (
                <div className="flex items-center glass-card px-3 py-2 rounded-full border border-white/20">
                  <Bed className="h-4 w-4 mr-2 text-primary/70" />
                  {property.bedrooms}
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center glass-card px-3 py-2 rounded-full border border-white/20">
                  <Bath className="h-4 w-4 mr-2 text-primary/70" />
                  {property.bathrooms}
                </div>
              )}
              {property.area_sqft && (
                <div className="flex items-center glass-card px-3 py-2 rounded-full border border-white/20">
                  <Square className="h-4 w-4 mr-2 text-primary/70" />
                  {property.area_sqft}
                </div>
              )}
            </div>
          </div>
          
          <Badge variant="outline" className="w-fit glass-card border-primary/30 text-primary hover:bg-primary/10">
            {property.property_type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};