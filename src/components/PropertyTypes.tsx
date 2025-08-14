import { Card, CardContent } from "@/components/ui/card";
import { Building, Home, Factory, TreePine } from "lucide-react";

const PropertyTypes = () => {
  const propertyTypes = [
    {
      icon: Building,
      title: "Apartments",
      description: "Modern living spaces in urban centers",
      count: "450+ listings",
      gradient: "from-primary to-primary-light"
    },
    {
      icon: Home,
      title: "Maisonettes",
      description: "Spacious family homes with gardens",
      count: "320+ listings", 
      gradient: "from-secondary to-secondary-light"
    },
    {
      icon: Factory,
      title: "Commercial",
      description: "Office spaces and retail properties",
      count: "180+ listings",
      gradient: "from-accent to-accent-warm"
    },
    {
      icon: TreePine,
      title: "Land & Plots",
      description: "Development opportunities and farmland",
      count: "250+ listings",
      gradient: "from-success to-secondary-light"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Browse by Property Type
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the perfect property type that matches your needs and lifestyle across Kenya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {propertyTypes.map((type, index) => {
            const IconComponent = type.icon;
            return (
              <Card key={index} className="group hover:shadow-medium transition-all duration-300 cursor-pointer border-0 overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {type.description}
                  </p>
                  <div className="text-primary font-medium text-sm">
                    {type.count}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PropertyTypes;