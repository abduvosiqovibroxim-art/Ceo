import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { artistsApi, Artist } from '../services/api';

// Generate avatar URL
const getAvatarUrl = (name: string) => {
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true`;
};

const categories = ['All', 'Music', 'Sports', 'Entertainment', 'Comedy'];

export default function ArtistsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const filters: { category?: string; search?: string } = {};
        if (selectedCategory !== 'All') {
          filters.category = selectedCategory;
        }
        if (search) {
          filters.search = search;
        }
        const response = await artistsApi.getAll({ ...filters, page_size: 50 });
        setArtists(response.items);
      } catch (err) {
        console.error('Error fetching artists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, [selectedCategory, search]);

  return (
    <div className="px-4 py-6">
      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tg-hint" />
        <input
          type="text"
          placeholder="Search artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-tg-secondary-bg text-tg-text placeholder-tg-hint outline-none"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-stario-purple text-white'
                : 'bg-tg-secondary-bg text-tg-text'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          // Loading skeleton
          [...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-tg-secondary-bg animate-pulse">
              <div className="w-full aspect-square rounded-xl bg-gray-300 mb-3" />
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          ))
        ) : artists.length > 0 ? (
          artists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/artists/${artist.id}`}
                className="block p-4 rounded-2xl bg-tg-secondary-bg"
              >
                <img
                  src={artist.image || getAvatarUrl(artist.name)}
                  alt={artist.name}
                  className="w-full aspect-square rounded-xl object-cover mb-3"
                />
                <h3 className="font-semibold text-tg-text text-sm truncate">
                  {artist.name}
                </h3>
                <p className="text-xs text-tg-hint">
                  {artist.category} • {artist.followers}
                </p>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            <p className="text-tg-hint">No artists found</p>
          </div>
        )}
      </div>
    </div>
  );
}
