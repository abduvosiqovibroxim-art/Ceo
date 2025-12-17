import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import WebApp from '@twa-dev/sdk';
import { artistsApi, Artist } from '../services/api';

// Generate avatar URL with initials and gradient background
const getAvatarUrl = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true&font-size=0.4`;
};

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await artistsApi.getById(id);
        setArtist(data);
      } catch (err) {
        console.error('Error fetching artist:', err);
        setError('Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  const handleCreateMoment = () => {
    WebApp.HapticFeedback.impactOccurred('medium');
    navigate(`/create-moment?artist=${id}`);
  };

  const handleBack = () => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stario-purple"></div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-tg-hint mb-4">{error || 'Artist not found'}</p>
        <button
          onClick={() => navigate('/artists')}
          className="text-stario-purple font-medium"
        >
          Back to Artists
        </button>
      </div>
    );
  }

  const imageUrl = artist.image || getAvatarUrl(artist.name);
  const formattedPrice = new Intl.NumberFormat('uz-UZ').format(artist.price);

  return (
    <div className="min-h-screen bg-tg-bg">
      {/* Header */}
      <div className="relative h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-stario-purple to-stario-pink" />
        <div className="absolute inset-0 bg-gradient-to-t from-tg-bg to-transparent" />

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </button>

        {/* Header Title */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <h1 className="text-white font-semibold">About</h1>
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <HeartIcon className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <ShareIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Artist Avatar */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <div className="relative">
            <img
              src={imageUrl}
              alt={artist.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-tg-bg shadow-lg"
            />
            {artist.is_verified && (
              <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1.5 border-2 border-tg-bg">
                <CheckBadgeIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-20 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-tg-text">{artist.name}</h1>
            {artist.is_popular && (
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                🔥 TOP
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              artist.category === 'pop' ? 'bg-purple-100 text-purple-700' :
              artist.category === 'traditional' ? 'bg-amber-100 text-amber-700' :
              artist.category === 'rap' ? 'bg-gray-800 text-white' :
              'bg-red-100 text-red-700'
            }`}>
              {artist.category}
            </span>
            <span className="text-tg-hint">•</span>
            <span className="text-tg-hint">{artist.followers} followers</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="text-center p-3 rounded-xl bg-tg-secondary-bg">
            <p className="text-lg font-bold text-tg-text">{artist.followers || '0'}</p>
            <p className="text-xs text-tg-hint">Followers</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-tg-secondary-bg">
            <p className="text-lg font-bold text-tg-text">{formattedPrice}</p>
            <p className="text-xs text-tg-hint">UZS</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-tg-secondary-bg">
            <p className="text-lg font-bold text-tg-text">
              {artist.status === 'active' ? '✓' : '⏳'}
            </p>
            <p className="text-xs text-tg-hint">{artist.status}</p>
          </div>
        </motion.div>

        {/* Bio */}
        {artist.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="font-semibold text-tg-text mb-2">About</h2>
            <p className="text-sm text-tg-hint">{artist.description}</p>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-tg-secondary-bg rounded-xl p-4 space-y-3 mb-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Gender</span>
            <span className="font-medium text-tg-text">
              {artist.gender === 'male' ? 'Male' : 'Female'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Category</span>
            <span className="font-medium text-tg-text capitalize">{artist.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Price</span>
            <span className="font-medium text-stario-purple">{formattedPrice} UZS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tg-hint">Verified</span>
            <span className={`font-medium ${artist.is_verified ? 'text-green-500' : 'text-tg-hint'}`}>
              {artist.is_verified ? 'Yes' : 'No'}
            </span>
          </div>
        </motion.div>

        {/* Create Moment Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleCreateMoment}
          className="w-full py-4 bg-gradient-to-r from-stario-purple to-stario-pink text-white rounded-xl font-semibold text-center shadow-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Order Video
          </span>
        </motion.button>

        {/* Add to Favorites Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full mt-3 py-4 bg-tg-secondary-bg text-tg-text rounded-xl font-semibold"
        >
          <span className="flex items-center justify-center gap-2">
            <HeartIcon className="w-5 h-5" />
            Add to Favorites
          </span>
        </motion.button>
      </div>
    </div>
  );
}
