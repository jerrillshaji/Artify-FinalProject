-- ============================================================
-- SECTION 9: STORAGE BUCKET NOTES
-- ============================================================
-- Create buckets manually or run these statements separately:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true), ('portfolio', 'portfolio', true), ('event-images', 'event-images', true), ('post-images', 'post-images', true);

-- Example storage policies for avatars:
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
