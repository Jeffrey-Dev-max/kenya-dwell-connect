import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import PropertyTypes from "@/components/PropertyTypes";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <PropertyTypes />
      <FeaturedProperties />
      <Footer />
    </div>
  );
};

export default Index;
