import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Bed, Bath, Square } from "lucide-react";
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
  onClick: () => void;
}

export const PropertyCard = ({ property, onClick }: PropertyCardProps) => {
  const price = property.listing_mode === 'rent' ? property.rent_price : property.sale_price;
  const priceLabel = property.listing_mode === 'rent' ? '/month' : '';

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-0">
        <ImageCarousel 
          images={property.images || []} 
          alt={property.title}
        />
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-2">{property.title}</h3>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {property.listing_mode}
            </Badge>
          </div>
          
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {property.town}, {property.county}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">
              {property.currency} {price?.toLocaleString()}{priceLabel}
            </div>
            <div className="text-xs text-muted-foreground">
              ID: {property.id.slice(0, 8)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {property.bedrooms && (
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1" />
                {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
              </div>
            )}
            {property.area_sqft && (
              <div className="flex items-center">
                <Square className="h-4 w-4 mr-1" />
                {property.area_sqft} sqft
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="w-fit">
            {property.property_type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};