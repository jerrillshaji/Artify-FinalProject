import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, MoreHorizontal, Share2, CalendarClock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/layout/BackButton';
import Button from '../components/ui/Button';
import { useSupabase } from '../context/SupabaseContext';

const POST_DETAIL_SELECT = `
  id,
  author_id,
  content,
  location,
  image_url,
  tags,
  created_at,
  author:profiles!posts_author_id_fkey (
    id,
    username,
    full_name,
    avatar_url,
    is_verified,
    role
  )
`;

const formatPostDate = (timestamp) => {
  if (!timestamp) return '';

  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PostDetailView = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { supabase } = useSupabase();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      setLoading(true);
      setError('');

      try {
        const { data, error: postError } = await supabase
          .from('posts')
          .select(POST_DETAIL_SELECT)
          .eq('id', postId)
          .maybeSingle();

        if (postError) throw postError;
        if (!data) {
          setError('Post not found.');
          setPost(null);
          return;
        }

        setPost(data);
      } catch (loadError) {
        console.error('Error loading post:', loadError);
        setError(loadError.message || 'Could not load this post right now.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, supabase]);

  const profilePath = useMemo(() => {
    if (!post?.author?.id) return '/profile';
    return `/profile?id=${post.author.id}`;
  }, [post?.author?.id]);

  const handleShare = async () => {
    if (!post) return;

    const url = `${window.location.origin}/posts/${post.id}`;
    const text = `${post.author?.full_name || 'Artify user'} on Artify: ${post.content}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Artify Post', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }
    } catch (shareError) {
      console.error('Error sharing post:', shareError);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <BackButton />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="text-2xl font-black text-white">{error || 'Post not found.'}</h1>
          <p className="mt-3 text-sm text-gray-400">The post may have been deleted or is not available yet.</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate('/feed')}>Back To Feed</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Post</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Post Details</h1>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <div className="bg-black/30">
          {post.image_url ? (
            <img src={post.image_url} alt="Post" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-linear-to-br from-fuchsia-900/20 to-cyan-900/10 px-10 text-center text-gray-400">
              No image attached to this post.
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
            <button
              type="button"
              onClick={() => navigate(profilePath)}
              className="flex items-center gap-3 text-left"
            >
              <img
                src={post.author?.avatar_url || `https://i.pravatar.cc/150?u=${post.author?.id || post.author_id}`}
                alt={post.author?.full_name || 'Profile'}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-white">{post.author?.full_name || 'Unknown user'}</p>
                <p className="text-xs text-gray-400">@{post.author?.username || 'artist'}</p>
              </div>
            </button>
            <button className="text-gray-400 hover:text-white">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 sm:text-base">
              {post.content}
            </p>

            <div className="space-y-3 text-sm text-gray-300">
              {post.location && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                  <MapPin size={14} className="text-cyan-300" />
                  <span>{post.location}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                <CalendarClock size={14} className="text-fuchsia-300" />
                <span>{formatPostDate(post.created_at)}</span>
              </div>
            </div>

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-200 sm:text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto flex gap-3 border-t border-white/10 p-5">
            <Button variant="secondary" className="flex-1" onClick={() => navigate(profilePath)}>
              View Profile
            </Button>
            <Button className="flex-1" onClick={handleShare}>
              <Share2 size={15} />
              Share Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailView;