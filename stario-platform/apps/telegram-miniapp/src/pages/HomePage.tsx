import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  UserGroupIcon,
  VideoCameraIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import WebApp from '@twa-dev/sdk';
import { artistsApi, Artist } from '../services/api';

// Generate avatar URL
const getAvatarUrl = (name: string) => {
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true`;
};

const features = [
  {
    title: 'Browse Artists',
    description: 'Find your favorite artists',
    icon: UserGroupIcon,
    to: '/artists',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Create Moment',
    description: 'AI-powered video greetings',
    icon: VideoCameraIcon,
    to: '/create-moment',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Face Quiz',
    description: 'Which artist do you look like?',
    icon: FaceSmileIcon,
    to: '/face-quiz',
    color: 'from-orange-500 to-red-500',
  },
  {
    title: 'My Content',
    description: 'View your created content',
    icon: SparklesIcon,
    to: '/my-content',
    color: 'from-green-500 to-teal-500',
  },
];

export default function HomePage() {
  const user = WebApp.initDataUnsafe.user;
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await artistsApi.getAll({ page_size: 6 });
        setArtists(response.items);
      } catch (err) {
        console.error('Error fetching artists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div className="px-4 py-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-tg-text mb-2">
          Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="text-tg-hint">
          Create magical AI moments with your favorite artists
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={feature.to}
              className="block p-4 rounded-2xl bg-tg-secondary-bg hover:scale-[1.02] transition-transform"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-tg-text text-sm">
                {feature.title}
              </h3>
              <p className="text-xs text-tg-hint mt-1">{feature.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Featured Artists Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-tg-text">Featured Artists</h2>
          <Link to="/artists" className="text-sm text-tg-link">
            See all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 text-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-gray-300 mx-auto mb-2" />
                <div className="h-3 bg-gray-300 rounded mx-2" />
              </div>
            ))
          ) : artists.length > 0 ? (
            artists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="flex-shrink-0 w-24 text-center"
              >
                <img
                  src={artist.image || getAvatarUrl(artist.name)}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-purple-200"
                />
                <p className="text-sm font-medium text-tg-text truncate">
                  {artist.name}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-tg-hint">No artists found</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
