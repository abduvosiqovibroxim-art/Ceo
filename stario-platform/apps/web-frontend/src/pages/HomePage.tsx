import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  VideoCameraIcon,
  UserGroupIcon,
  PhotoIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { artistsApi, Artist } from '../services/api';

const features = [
  {
    nameKey: 'features.starioMoment.name',
    descriptionKey: 'features.starioMoment.description',
    icon: VideoCameraIcon,
    href: '/create-moment',
    color: 'bg-purple-500',
  },
  {
    nameKey: 'features.faceQuiz.name',
    descriptionKey: 'features.faceQuiz.description',
    icon: UserGroupIcon,
    href: '/face-quiz',
    color: 'bg-pink-500',
  },
  {
    nameKey: 'features.posterMaker.name',
    descriptionKey: 'features.posterMaker.description',
    icon: PhotoIcon,
    href: '/poster-maker',
    color: 'bg-blue-500',
  },
  {
    nameKey: 'features.voiceQuiz.name',
    descriptionKey: 'features.voiceQuiz.description',
    icon: MicrophoneIcon,
    href: '/voice-quiz',
    color: 'bg-green-500',
  },
];

// Generate avatar URL
const getAvatarUrl = (name: string) => {
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true`;
};

export default function HomePage() {
  const { t } = useTranslation();
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await artistsApi.getAll({ page_size: 6, is_popular: true });
        // If no popular artists, get any artists
        if (response.items.length === 0) {
          const allResponse = await artistsApi.getAll({ page_size: 6 });
          setFeaturedArtists(allResponse.items);
        } else {
          setFeaturedArtists(response.items);
        }
      } catch (err) {
        console.error('Error fetching artists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div className="px-4 py-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          {t('home.title')}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('home.subtitle')}
        </p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.nameKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={feature.href}
              className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-3`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">{t(feature.nameKey)}</h3>
              <p className="text-sm text-gray-500 mt-1">{t(feature.descriptionKey)}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Featured Artists */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('home.featuredArtists')}</h2>
          <Link to="/artists" className="text-indigo-600 text-sm font-medium">
            {t('common.seeAll')}
          </Link>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
          {loading ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 text-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-gray-200" />
                <div className="mt-2 h-4 w-16 mx-auto bg-gray-200 rounded" />
              </div>
            ))
          ) : featuredArtists.length > 0 ? (
            featuredArtists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="flex-shrink-0 text-center"
              >
                <img
                  src={artist.image || getAvatarUrl(artist.name)}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100"
                />
                <p className="mt-2 text-sm font-medium text-gray-900 truncate w-20">
                  {artist.name}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No artists found</p>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <h3 className="text-lg font-bold">{t('home.specialOffer')}</h3>
        <p className="text-sm mt-1 opacity-90">
          {t('home.offerDescription')}
        </p>
        <Link
          to="/create-moment"
          className="mt-4 inline-block bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm"
        >
          {t('common.createNow')}
        </Link>
      </motion.div>
    </div>
  );
}
