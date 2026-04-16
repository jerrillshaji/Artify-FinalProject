-- ============================================================
-- SECTION 18: CREATE STORAGE BUCKETS AND POLICIES
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- Create public buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',      'avatars',      true, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('portfolio',    'portfolio',    true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('event-images', 'event-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images',  'post-images',  true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AVATARS bucket policies
-- ============================================================

-- Anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can update their own files
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can delete their own files
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- PORTFOLIO bucket policies
-- ============================================================

CREATE POLICY "Portfolio images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

CREATE POLICY "Users can upload their own portfolio images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own portfolio images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own portfolio images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- EVENT-IMAGES bucket policies
-- ============================================================

CREATE POLICY "Event images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- POST-IMAGES bucket policies
-- ============================================================

CREATE POLICY "Post images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
