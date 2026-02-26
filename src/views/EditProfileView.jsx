import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const EditProfileView = () => {
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    stage_name: '',
    company_name: '',
    avatar_url: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) {
          setErrorMessage('User not authenticated');
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            bio: profileData.bio || '',
            location: profileData.location || '',
            stage_name: profileData.stage_name || '',
            company_name: profileData.company_name || '',
            avatar_url: profileData.avatar_url || '',
          });
          if (profileData.avatar_url) {
            setImagePreview(profileData.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setErrorMessage('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          avatar_url: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setErrorMessage('User not authenticated');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          avatar_url: imagePreview,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update artists or managers table if needed
      const role = profile?.role;
      if (role === 'artist' && formData.stage_name) {
        const { error: artistError } = await supabase
          .from('artists')
          .update({
            stage_name: formData.stage_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (artistError) {
          throw artistError;
        }
      } else if (role === 'manager' && formData.company_name) {
        const { error: managerError } = await supabase
          .from('managers')
          .update({
            company_name: formData.company_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (managerError) {
          throw managerError;
        }
      }

      setSuccessMessage('Profile updated successfully!');
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const role = profile?.role || 'artist';

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <BackButton />
        <h1 className="text-2xl sm:text-3xl font-bold text-white ml-4">Edit Profile</h1>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/5">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <label className="flex flex-col items-center gap-4 cursor-pointer w-full">
              <div className="relative">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                  <img 
                    src={imagePreview || `https://i.pravatar.cc/150?img=${role === 'artist' ? '1' : '60'}`}
                    className="w-full h-full rounded-full object-cover border-4 border-[#050505]" 
                    alt="Avatar"
                  />
                </div>
                <div className="absolute bottom-0 right-0 p-1 bg-fuchsia-500 rounded-full">
                  <Upload size={16} className="text-white" />
                </div>
              </div>
              <span className="text-gray-300 text-sm">Click to change avatar</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden"
              />
            </label>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
            />
          </div>

          {/* Stage Name or Company Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              {role === 'artist' ? 'Stage Name' : 'Company Name'} {role === 'artist' ? '' : ''}
            </label>
            <input
              type="text"
              name={role === 'artist' ? 'stage_name' : 'company_name'}
              value={role === 'artist' ? formData.stage_name : formData.company_name}
              onChange={handleInputChange}
              placeholder={role === 'artist' ? 'Your stage name' : 'Your company name'}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell others about yourself"
              rows="4"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Your location"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 border border-white/20 text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2.5 rounded-lg font-semibold text-black bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileView;
