import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { ImagePlus, MapPin, Sparkles, Hash, Send, UploadCloud, X, Crop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/layout/BackButton';
import Button from '../components/ui/Button';
import { useSupabase } from '../context/SupabaseContext';
import { getCroppedImage } from '../lib/cropImage';

const MAX_POST_LENGTH = 500;

const parseTags = (value) => value
  .split(',')
  .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
  .filter(Boolean)
  .slice(0, 5);

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Failed to read image file'));
  reader.readAsDataURL(file);
});

const CreatePostView = () => {
  const navigate = useNavigate();
  const { supabase, user } = useSupabase();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [cropSource, setCropSource] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const tags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const remaining = MAX_POST_LENGTH - content.length;

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile for create post:', profileError);
        return;
      }

      setProfile(data || null);
    };

    loadProfile();
  }, [supabase, user?.id]);

  const handleImageSelection = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    setImageUploading(true);
    setError('');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSource(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropper(true);
    } catch (uploadError) {
      console.error('Error processing image:', uploadError);
      setError(uploadError.message || 'Could not process the selected image.');
    } finally {
      setImageUploading(false);
      setIsDragActive(false);
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    await handleImageSelection(file);
    event.target.value = '';
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    await handleImageSelection(file);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleApplyCrop = async () => {
    if (!cropSource || !croppedAreaPixels) return;

    setImageUploading(true);
    try {
      const croppedImage = await getCroppedImage(cropSource, croppedAreaPixels);
      setImageDataUrl(croppedImage);
      setShowCropper(false);
      setCropSource('');
    } catch (cropError) {
      console.error('Error cropping image:', cropError);
      setError(cropError.message || 'Could not crop the selected image.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setCropSource('');
    setCroppedAreaPixels(null);
    setIsDragActive(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();
    const trimmedLocation = location.trim();

    if (!trimmedContent) {
      setError('Write something about your post before publishing.');
      return;
    }

    if (trimmedContent.length > MAX_POST_LENGTH) {
      setError(`Keep the post under ${MAX_POST_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: trimmedContent,
          location: trimmedLocation || null,
          image_url: imageDataUrl || null,
          tags,
        });

      if (insertError) throw insertError;

      navigate('/community');
    } catch (submitError) {
      console.error('Error creating post:', submitError);

      if (submitError?.code === '42P01' || submitError?.message?.toLowerCase().includes('posts')) {
        setError('Posts are not set up in Supabase yet. Run the updated database scripts, then try again.');
      } else {
        setError(submitError.message || 'Could not publish the post.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Create Post</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Publish an update to your feed</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="flex items-center gap-3">
            <img
              src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id || 'artify'}`}
              alt={profile?.full_name || 'Profile'}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
            />
            <div>
              <p className="font-bold text-white">{profile?.full_name || 'Your profile'}</p>
              <p className="text-xs text-gray-400">@{profile?.username || 'artist'}</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Description</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={MAX_POST_LENGTH}
              rows={7}
              placeholder="What are you working on right now?"
              className="w-full rounded-3xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-fuchsia-400/60"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>Share a rehearsal, venue check-in, release update, or collab request.</span>
              <span className={remaining < 40 ? 'text-yellow-300' : ''}>{remaining} left</span>
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
                <MapPin size={14} className="text-cyan-400" />
                Current Location
              </span>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Kochi, Kerala"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-cyan-400/60"
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
              <div className="inline-flex items-center gap-2 font-semibold text-white">
                <ImagePlus size={14} className="text-fuchsia-400" />
                Post Image
              </div>
              <p className="mt-2 text-xs text-gray-400">Use the insert image area below to drag, drop, click, and crop your image in a square 1:1 format.</p>
            </div>
          </div>

          <div className="block">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
              <UploadCloud size={14} className="text-fuchsia-400" />
              Insert Image
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-8 text-center transition-all ${isDragActive ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/15 bg-black/20 hover:border-fuchsia-400/50 hover:bg-white/5'}`}
            >
              {imageDataUrl ? (
                <>
                  <img src={imageDataUrl} alt="Selected post" className="max-h-72 w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setImageDataUrl('');
                    }}
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-500/80"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4 rounded-full bg-fuchsia-500/10 p-4 text-fuchsia-300">
                    <UploadCloud size={26} />
                  </div>
                  <p className="text-base font-semibold text-white">Drop an image here or click to upload</p>
                  <p className="mt-2 text-sm text-gray-400">PNG, JPG, WEBP and other image files are supported, then cropped to a square.</p>
                </>
              )}

              {imageUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white"></div>
                </div>
              )}
            </button>
          </div>

          <label className="block">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Hash size={14} className="text-emerald-400" />
              Tags
            </span>
            <input
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="live, rehearsal, indie, collab"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-emerald-400/60"
            />
            <p className="mt-2 text-xs text-gray-400">Comma-separated. Up to 5 tags will be saved.</p>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving || imageUploading} className="px-6">
              <Send size={16} />
              {saving ? 'Publishing...' : 'Publish Post'}
            </Button>
            <Button type="button" variant="secondary" className="px-6" onClick={() => navigate('/community')}>
              Cancel
            </Button>
          </div>
        </form>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-fuchsia-300">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Live Preview</span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 border-b border-white/10 bg-black/20 p-4">
              <img
                src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id || 'artify'}`}
                alt={profile?.full_name || 'Profile'}
                className="h-11 w-11 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-white">{profile?.full_name || 'Your profile'}</p>
                <p className="text-xs text-gray-400">@{profile?.username || 'artist'} {location.trim() ? `• ${location.trim()}` : ''}</p>
              </div>
            </div>

            {imageDataUrl ? (
              <img src={imageDataUrl} alt="Preview" className="h-64 w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center bg-linear-to-br from-fuchsia-900/20 to-cyan-900/10 px-6 text-center text-sm text-gray-400">
                Upload an image to preview your post artwork here.
              </div>
            )}

            <div className="space-y-4 p-4">
              <p className="min-h-16 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                {content.trim() || 'Your caption preview will appear here as you type.'}
              </p>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCropper && cropSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Crop Image</p>
                <h2 className="mt-1 text-xl font-black text-white">Choose your square post crop</h2>
              </div>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="relative h-[26rem] overflow-hidden rounded-3xl bg-black">
                <Cropper
                  image={cropSource}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span className="inline-flex items-center gap-2">
                    <Crop size={14} className="text-fuchsia-300" />
                    Zoom
                  </span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-fuchsia-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleApplyCrop} disabled={imageUploading}>
                  Apply Crop
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancelCrop}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostView;
