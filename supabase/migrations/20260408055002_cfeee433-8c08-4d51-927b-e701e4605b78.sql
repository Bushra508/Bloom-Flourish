
-- 1. Create plants table
CREATE TABLE public.plants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  scan_date timestamptz NOT NULL DEFAULT now(),
  issue text,
  confidence_score integer,
  main_cure text,
  tag text NOT NULL DEFAULT 'healthy' CHECK (tag IN ('healthy', 'unhealthy', 'monitor')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plants" ON public.plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plants" ON public.plants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plants" ON public.plants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plants" ON public.plants FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create blogs table
CREATE TABLE public.blogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  img_url text,
  category text NOT NULL CHECK (category IN ('care', 'companion', 'sustainable', 'benefits')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read blogs" ON public.blogs FOR SELECT TO authenticated USING (true);

-- 3. Seed blogs
INSERT INTO public.blogs (name, content, img_url, category) VALUES
('Watering 101: When & How Much', 'Overwatering is the #1 killer of houseplants. The key is to check the top inch of soil — if it''s dry, it''s time to water. Most indoor plants prefer to dry out slightly between waterings. Succulents and cacti need even less. Always use pots with drainage holes, and never let plants sit in standing water for more than 30 minutes.

For outdoor plants, morning watering is best as it allows foliage to dry during the day, reducing disease risk. Deep, infrequent watering encourages strong root growth compared to frequent shallow sprinkles.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', 'care'),

('Light Requirements Guide', 'Understanding light is crucial. South-facing windows provide the brightest, most direct light. East-facing windows offer gentle morning sun. North-facing windows provide consistent but low light.

Signs of too much light include scorched or bleached leaves. Signs of too little light include leggy growth, small leaves, and loss of variegation. Most tropical houseplants thrive in bright, indirect light — near a window but not in direct sun rays.', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop', 'care'),

('Seasonal Plant Care Calendar', 'Spring: Repot root-bound plants, increase watering and feeding, prune winter damage. Summer: Water more frequently, provide shade for sensitive plants, watch for pests. Fall: Reduce watering and feeding, bring tender plants indoors, plant spring bulbs. Winter: Minimize watering, stop fertilizing most plants, increase humidity indoors.', 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=300&fit=crop', 'care'),

('The Three Sisters Method', 'The Three Sisters is a Native American planting method where corn provides a structure for beans to climb, beans fix nitrogen in the soil for all three plants, and squash spreads along the ground, shading the soil to retain moisture and suppress weeds.

This polyculture system creates a self-sustaining ecosystem where each plant contributes to the others'' health. Modern gardeners can adapt this principle by identifying complementary plant groupings in their own gardens.', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop', 'companion'),

('Herbs That Protect Vegetables', 'Basil planted near tomatoes repels aphids and whiteflies while improving flavor. Rosemary deters cabbage moths. Mint repels ants and flea beetles (but plant in pots — it spreads aggressively). Dill attracts beneficial insects like ladybugs and lacewings that eat harmful pests.', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300&fit=crop', 'companion'),

('Composting for Beginners', 'Composting is nature''s recycling. Start with a mix of ''greens'' (nitrogen-rich: food scraps, fresh grass) and ''browns'' (carbon-rich: dry leaves, cardboard, straw) in roughly a 1:3 ratio.

Keep your compost moist but not soggy — like a wrung-out sponge. Turn it every 1-2 weeks to add oxygen. In 2-6 months, you''ll have rich, dark compost that improves soil structure, adds nutrients, and helps retain moisture.', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', 'sustainable'),

('Rainwater Harvesting 101', 'A single inch of rain on a 1,000 sq ft roof yields about 600 gallons of water. A basic rain barrel system costs under $100 and can save thousands of gallons per year. Plants actually prefer rainwater — it''s naturally soft, free of chlorine, and slightly acidic, which most plants love.', 'https://images.unsplash.com/photo-1501004318855-b43130e7a32e?w=400&h=300&fit=crop', 'sustainable'),

('Top Air-Purifying Plants', 'NASA''s Clean Air Study identified several plants exceptional at removing indoor toxins. Snake plants (Sansevieria) remove formaldehyde and are one of the few plants that convert CO2 to oxygen at night. Peace lilies remove ammonia, benzene, and formaldehyde. Spider plants are champion formaldehyde removers and are safe for pets.', 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=300&fit=crop', 'benefits'),

('Plants & Mental Health', 'Studies show that spending just 15 minutes caring for plants can reduce cortisol levels. The presence of indoor plants in workspaces increases productivity by 15%. Gardening has been shown to reduce symptoms of depression and anxiety. The soil microbiome contains bacteria (M. vaccae) that triggers serotonin release.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', 'benefits');

-- 4. Storage bucket for scan images
INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', true);

CREATE POLICY "Public read access for scan images" ON storage.objects FOR SELECT USING (bucket_id = 'scan-images');
CREATE POLICY "Authenticated users can upload scan images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own scan images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own scan images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Remove avatar_url from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
