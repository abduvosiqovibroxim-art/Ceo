import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
        <p className="text-gray-600 mb-4">{error || 'Artist not found'}</p>
        <button
          onClick={() => navigate('/artists')}
          className="text-indigo-600 font-medium"
        >
          {t('common.back')} {t('artists.title')}
        </button>
      </div>
    );
  }

  const imageUrl = artist.image || getAvatarUrl(artist.name);
  const formattedPrice = new Intl.NumberFormat('uz-UZ').format(artist.price);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-semibold text-gray-900">About</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Artist Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />

        {/* Profile section */}
        <div className="px-4 -mt-16">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt={artist.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {artist.is_verified && (
              <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1.5 border-2 border-white">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Artist Info */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{artist.name}</h2>
              {artist.is_popular && (
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  🔥 TOP
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                artist.category === 'pop' ? 'bg-purple-100 text-purple-700' :
                artist.category === 'traditional' ? 'bg-amber-100 text-amber-700' :
                artist.category === 'rap' ? 'bg-gray-800 text-white' :
                'bg-red-100 text-red-700'
              }`}>
                {t(`artists.categories.${artist.category}`) || artist.category}
              </span>
              <span className="text-sm text-gray-500">
                {artist.followers} {t('artists.followers')}
              </span>
            </div>

            {artist.description && (
              <p className="mt-4 text-gray-600 leading-relaxed">
                {artist.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 py-4 border-y border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{artist.followers || '0'}</div>
              <div className="text-xs text-gray-500">{t('artists.followers')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formattedPrice}</div>
              <div className="text-xs text-gray-500">UZS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {artist.status === 'active' ? '✓' : '⏳'}
              </div>
              <div className="text-xs text-gray-500">{t(`artists.status.${artist.status}`) || artist.status}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="px-4 mt-6 space-y-3">
        <Link
          to={`/create-moment?artist=${artist.id}`}
          className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-center shadow-lg hover:shadow-xl transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('artists.orderVideo')}
          </span>
        </Link>

        <button className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 transition-all">
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {t('artists.addToFavorites')}
          </span>
        </button>
      </div>

      {/* Additional Info */}
      <div className="px-4 mt-8 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('artists.about')}</h3>

        <div className="bg-white rounded-xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('artists.gender')}</span>
            <span className="font-medium text-gray-900">
              {artist.gender === 'male' ? t('artists.men') : t('artists.women')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('artists.category')}</span>
            <span className="font-medium text-gray-900">
              {t(`artists.categories.${artist.category}`) || artist.category}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('artists.price')}</span>
            <span className="font-medium text-indigo-600">{formattedPrice} UZS</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('artists.verified')}</span>
            <span className={`font-medium ${artist.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
              {artist.is_verified ? t('common.yes') : t('common.no')}
            </span>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="px-4 pb-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎬</div>
            <div className="flex-1">
              <p className="font-bold">{t('artists.wantVideo')}</p>
              <p className="text-sm opacity-90">{t('artists.orderPersonalized')}</p>
            </div>
            <Link
              to={`/create-moment?artist=${artist.id}`}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {t('artists.order')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
