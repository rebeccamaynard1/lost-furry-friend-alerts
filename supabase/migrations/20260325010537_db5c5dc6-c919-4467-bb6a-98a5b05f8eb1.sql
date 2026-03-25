
-- Create storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', true);

-- Storage policies: anyone can view, authenticated users can upload
CREATE POLICY "Anyone can view pet photos" ON storage.objects FOR SELECT USING (bucket_id = 'pet-photos');
CREATE POLICY "Authenticated users can upload pet photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pet-photos');
CREATE POLICY "Users can update own pet photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'pet-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own pet photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pet-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
