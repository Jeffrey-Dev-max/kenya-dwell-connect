import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, MapPin, DollarSign, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface FormData {
  title: string;
  description: string;
  listing_type: string;
  property_type: string;
  price: string;
  location: string;
  latitude: string;
  longitude: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  furnished: boolean;
  images: string[];
}

const CreateListing = () => {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    listing_type: "",
    property_type: "",
    price: "",
    location: "",
    latitude: "",
    longitude: "",
    bedrooms: "",
    bathrooms: "",
    amenities: [],
    furnished: false,
    images: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({ phone: "", amount: 200 });
  const [uploadingImages, setUploadingImages] = useState(false);
  const { toast } = useToast();

  const [availableAmenities, setAvailableAmenities] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setAvailableAmenities(data);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a listing.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Success",
        description: `${uploadedUrls.length} images uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-listing', {
        body: formData
      });

      if (error) throw error;

      if (data.requires_payment) {
        setShowPaymentDialog(true);
        setPaymentData(prev => ({ ...prev, listing_id: data.listing.id }));
      } else {
        toast({
          title: "Success!",
          description: "Your listing has been created and is now live.",
        });
        // Reset form or redirect
        setFormData({
          title: "",
          description: "",
          listing_type: "",
          property_type: "",
          price: "",
          location: "",
          latitude: "",
          longitude: "",
          bedrooms: "",
          bathrooms: "",
          amenities: [],
          furnished: false,
          images: []
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone_number: paymentData.phone,
          amount: paymentData.amount,
          user_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Request Sent",
        description: "Please complete the payment on your phone.",
      });
      
      setShowPaymentDialog(false);
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please sign in to create a listing.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Listing</CardTitle>
              <CardDescription>
                List your property on Kenya Dwell Connect. First listing is free!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Property Title *</Label>
                      <Input
                        id="title"
                        placeholder="Beautiful 2-bedroom apartment in Westlands"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="Westlands, Nairobi"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="listing_type">Listing Type *</Label>
                      <Select value={formData.listing_type} onValueChange={(value) => setFormData({...formData, listing_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="property_type">Property Type *</Label>
                      <Select value={formData.property_type} onValueChange={(value) => setFormData({...formData, property_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="maisonette">Maisonette</SelectItem>
                          <SelectItem value="bedsitter">Bedsitter</SelectItem>
                          <SelectItem value="bungalow">Bungalow</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (KES) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="50000"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your property in detail..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Property Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Select value={formData.bedrooms} onValueChange={(value) => setFormData({...formData, bedrooms: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bedrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Studio</SelectItem>
                          <SelectItem value="1">1 Bedroom</SelectItem>
                          <SelectItem value="2">2 Bedrooms</SelectItem>
                          <SelectItem value="3">3 Bedrooms</SelectItem>
                          <SelectItem value="4">4 Bedrooms</SelectItem>
                          <SelectItem value="5">5+ Bedrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Select value={formData.bathrooms} onValueChange={(value) => setFormData({...formData, bathrooms: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bathrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Bathroom</SelectItem>
                          <SelectItem value="2">2 Bathrooms</SelectItem>
                          <SelectItem value="3">3 Bathrooms</SelectItem>
                          <SelectItem value="4">4+ Bathrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnished"
                      checked={formData.furnished}
                      onCheckedChange={(checked) => setFormData({...formData, furnished: checked as boolean})}
                    />
                    <Label htmlFor="furnished">Furnished</Label>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableAmenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.id}
                          checked={formData.amenities.includes(amenity.id)}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                        />
                        <Label htmlFor={amenity.id} className="text-sm">{amenity.name}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.amenities.map((amenityId) => {
                        const amenity = availableAmenities.find(a => a.id === amenityId);
                        return (
                          <Badge key={amenityId} variant="secondary">
                            {amenity?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Property Images</h3>
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <Label htmlFor="images" className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80">
                          {uploadingImages ? "Uploading..." : "Click to upload images"}
                        </span>
                        <Input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImages}
                        />
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Upload up to 10 images. PNG, JPG, or JPEG (max 5MB each)
                      </p>
                    </div>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Property ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Listing..." : "Create Listing"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
            <DialogDescription>
              Your free listing has been used. A payment of KES 200 is required to publish this listing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-phone">M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payment-phone"
                  placeholder="+254700000000"
                  value={paymentData.phone}
                  onChange={(e) => setPaymentData({...paymentData, phone: e.target.value})}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span>Listing Fee:</span>
              <span className="font-semibold">KES {paymentData.amount}</span>
            </div>
            <Button onClick={handlePayment} className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Pay with M-Pesa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CreateListing;