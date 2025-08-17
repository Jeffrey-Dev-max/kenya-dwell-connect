-- Insert default amenities
INSERT INTO public.amenities (name) VALUES
('Wi-Fi'),
('Air Conditioning'),
('Parking'),
('Swimming Pool'),
('Gym'),
('Security'),
('Garden'),
('Balcony'),
('Elevator'),
('Generator'),
('CCTV'),
('Water Supply'),
('Backup Water'),
('Solar Power'),
('Furnished'),
('Kitchen Appliances'),
('Laundry'),
('Pet Friendly'),
('Playground'),
('Rooftop Access')
ON CONFLICT (name) DO NOTHING;