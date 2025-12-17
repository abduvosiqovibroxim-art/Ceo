import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { artistsApi, Artist as ApiArtist } from '../services/api';

type Category = 'all' | 'pop' | 'traditional' | 'rap' | 'rock';
type Gender = 'all' | 'male' | 'female';

interface Artist {
  id: string;
  name: string;
  image: string;
  category: string;
  gender: string;
  followers: string;
  isVerified: boolean;
  isPopular?: boolean;
  description: string;
}

// Generate avatar URL with initials and gradient background
const getAvatarUrl = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true&font-size=0.4`;
};

const categories: { id: Category; nameKey: string }[] = [
  { id: 'all', nameKey: 'merch.all' },
  { id: 'pop', nameKey: 'artists.categories.pop' },
  { id: 'traditional', nameKey: 'artists.categories.traditional' },
  { id: 'rap', nameKey: 'artists.categories.rap' },
  { id: 'rock', nameKey: 'artists.categories.rock' },
];

// Convert API artist to local format
const mapApiArtist = (apiArtist: ApiArtist): Artist => ({
  id: apiArtist.id,
  name: apiArtist.name,
  image: apiArtist.image || getAvatarUrl(apiArtist.name),
  category: apiArtist.category || 'pop',
  gender: apiArtist.gender || 'male',
  followers: apiArtist.followers || '0',
  isVerified: apiArtist.is_verified,
  isPopular: apiArtist.is_popular,
  description: apiArtist.description || '',
});

export default function ArtistsPage() {
  const { t } = useTranslation();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedGender, setSelectedGender] = useState<Gender>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'name'>('popular');
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch artists from API
  const fetchArtists = useCallback(async () => {
    try {
      setLoading(true);
      const response = await artistsApi.getAll({ page_size: 100 });
      setArtists(response.items.map(mapApiArtist));
    } catch (err) {
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const filteredArtists = artists
    .filter((artist) => {
      const matchesCategory = selectedCategory === 'all' || artist.category === selectedCategory;
      const matchesGender = selectedGender === 'all' || artist.gender === selectedGender;
      const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesGender && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        const aFollowers = parseFloat(a.followers.replace(/[MK]/g, '')) * (a.followers.includes('M') ? 1000 : 1);
        const bFollowers = parseFloat(b.followers.replace(/[MK]/g, '')) * (b.followers.includes('M') ? 1000 : 1);
        return bFollowers - aFollowers;
      }
      return a.name.localeCompare(b.name);
    });

  const popularArtists = artists.filter(a => a.isPopular).slice(0, 6);
  const visibleArtists = filteredArtists.slice(0, visibleCount);
  const hasMore = filteredArtists.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // Reset visible count when filters change
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setVisibleCount(10);
  };

  const handleGenderChange = (gender: Gender) => {
    setSelectedGender(gender);
    setVisibleCount(10);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(10);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('artists.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('artists.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('artists.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Popular Artists Carousel */}
      {!searchQuery && selectedCategory === 'all' && selectedGender === 'all' && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t('artists.popular')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {popularArtists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500"
                  />
                  {artist.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-2 font-medium text-gray-700 w-24 truncate">{artist.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(category.nameKey)}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleGenderChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedGender === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t('artists.all')}
          </button>
          <button
            onClick={() => handleGenderChange('male')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedGender === 'male' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t('artists.men')}
          </button>
          <button
            onClick={() => handleGenderChange('female')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedGender === 'female' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t('artists.women')}
          </button>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'popular' | 'name')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="popular">{t('artists.byPopularity')}</option>
          <option value="name">{t('artists.byName')}</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading...' : `${t('artists.found')}: ${filteredArtists.length} ${t('artists.artist')}`}
      </p>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Artists Grid */}
      {!loading && filteredArtists.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {visibleArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/artists/${artist.id}`}
                className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full aspect-square object-cover"
                  />
                  {artist.isPopular && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      🔥 TOP
                    </div>
                  )}
                  {artist.isVerified && (
                    <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 truncate">{artist.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{artist.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-indigo-600 font-medium">{artist.followers} {t('artists.followers')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      artist.category === 'pop' ? 'bg-purple-100 text-purple-700' :
                      artist.category === 'traditional' ? 'bg-amber-100 text-amber-700' :
                      artist.category === 'rap' ? 'bg-gray-800 text-white' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t(`artists.categories.${artist.category}`)}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && filteredArtists.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleLoadMore}
          className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {t('artists.showMore')} ({filteredArtists.length - visibleCount})
        </motion.button>
      )}

      {!loading && filteredArtists.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">{t('artists.noResults')}</p>
          <button
            onClick={() => {
              handleCategoryChange('all');
              handleGenderChange('all');
              handleSearchChange('');
            }}
            className="mt-4 text-indigo-600 font-medium"
          >
            {t('artists.resetFilters')}
          </button>
        </div>
      )}

      {/* CTA Banner */}
      <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎬</div>
          <div className="flex-1">
            <p className="font-bold">{t('artists.wantVideo')}</p>
            <p className="text-sm opacity-90">{t('artists.orderPersonalized')}</p>
          </div>
          <Link to="/create-moment" className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold">
            {t('artists.order')}
          </Link>
        </div>
      </div>
    </div>
  );
}
