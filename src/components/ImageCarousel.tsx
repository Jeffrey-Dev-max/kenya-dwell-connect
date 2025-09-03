import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export const ImageCarousel = ({ images, alt, className }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-64 bg-gradient-aurora/10 rounded-xl flex items-center justify-center ${className || ''}`}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      <div className={`relative w-full h-64 rounded-xl overflow-hidden group ${className || ''}`}>
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={openFullscreen}
        />
        
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 glass-card opacity-0 group-hover:opacity-100 transition-all duration-300 hover-glow"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 glass-card opacity-0 group-hover:opacity-100 transition-all duration-300 hover-glow"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 glass-card opacity-0 group-hover:opacity-100 transition-all duration-300 hover-glow"
          onClick={openFullscreen}
        >
          <Maximize2 className="h-4 w-4 text-white" />
        </Button>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-primary shadow-glow' : 'bg-white/50 hover:bg-white/70'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 glass-card px-3 py-1 rounded-full text-xs text-white font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-screen-lg w-full h-[90vh] p-0">
          <div className="relative w-full h-full bg-black">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeFullscreen}
            >
              <X className="h-6 w-6" />
            </Button>

            <img
              src={images[currentIndex]}
              alt={`${alt} - Image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>

                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};