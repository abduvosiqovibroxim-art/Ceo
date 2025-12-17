import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

type Category = 'all' | 'clothing' | 'accessories' | 'posters' | 'collectibles';

interface Product {
  id: string;
  name: string;
  artist: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: Category;
  isNew?: boolean;
  isBestseller?: boolean;
  rating: number;
  reviews: number;
}

const categories: { id: Category; name: string; icon: string }[] = [
  { id: 'all', name: 'All', icon: '🛍️' },
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
  { id: 'posters', name: 'Posters', icon: '🖼️' },
  { id: 'collectibles', name: 'Collectibles', icon: '⭐' },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Shahzoda Tour T-Shirt',
    artist: 'Шахзода',
    price: 129000,
    originalPrice: 159000,
    image: '/celebrities/shahzoda.jpg',
    category: 'clothing',
    isBestseller: true,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: '2',
    name: 'Lola Limited Hoodie',
    artist: 'Лола Юлдашева',
    price: 249000,
    image: '/celebrities/lola_yuldasheva.jpg',
    category: 'clothing',
    isNew: true,
    rating: 4.9,
    reviews: 56,
  },
  {
    id: '3',
    name: 'Sevara Concert Poster',
    artist: 'Севара Назархан',
    price: 45000,
    image: '/celebrities/sevara_nazarkhan.jpg',
    category: 'posters',
    rating: 4.7,
    reviews: 89,
  },
  {
    id: '4',
    name: 'Shohruhxon Phone Case',
    artist: 'Шохруххон',
    price: 79000,
    image: '/celebrities/shohruhxon.jpg',
    category: 'accessories',
    isNew: true,
    rating: 4.5,
    reviews: 34,
  },
  {
    id: '5',
    name: 'Artist Signature Cap',
    artist: 'Various',
    price: 89000,
    originalPrice: 109000,
    image: '/celebrities/rayhon.jpg',
    category: 'accessories',
    isBestseller: true,
    rating: 4.6,
    reviews: 201,
  },
  {
    id: '6',
    name: 'Vinyl Record - Greatest Hits',
    artist: 'Юлдуз Усмонова',
    price: 349000,
    image: '/celebrities/yulduz_usmonova.jpg',
    category: 'collectibles',
    isNew: true,
    rating: 5.0,
    reviews: 12,
  },
  {
    id: '7',
    name: 'Tour Tote Bag',
    artist: 'Озода Нурсаидова',
    price: 69000,
    image: '/celebrities/ozoda_nursaidova.jpg',
    category: 'accessories',
    rating: 4.4,
    reviews: 67,
  },
  {
    id: '8',
    name: 'Limited Edition Art Print',
    artist: 'Севара Назархан',
    price: 189000,
    image: '/celebrities/sevara_nazarkhan.jpg',
    category: 'posters',
    isBestseller: true,
    rating: 4.9,
    reviews: 45,
  },
  {
    id: '9',
    name: 'Autographed Photo',
    artist: 'Райхон',
    price: 299000,
    image: '/celebrities/rayhon.jpg',
    category: 'collectibles',
    rating: 5.0,
    reviews: 8,
  },
  {
    id: '10',
    name: 'Fan Club Bracelet Set',
    artist: 'Various',
    price: 39000,
    image: '/celebrities/shahzoda.jpg',
    category: 'accessories',
    rating: 4.3,
    reviews: 156,
  },
];

const sortOptions = [
  { id: 'popular', name: 'Most Popular' },
  { id: 'newest', name: 'Newest' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
];

export default function MerchPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = mockProducts
    .filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artist.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return b.reviews - a.reviews;
      }
    });

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + ' UZS';
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MerchVerse</h1>
        <p className="text-gray-500 text-sm mt-1">Official merchandise from your favorite artists</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Sort & Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-xl p-4 mb-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Prices</option>
                <option>Under 50,000 UZS</option>
                <option>50,000 - 100,000 UZS</option>
                <option>100,000 - 200,000 UZS</option>
                <option>Over 200,000 UZS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Artist</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Artists</option>
                <option>Шахзода</option>
                <option>Лола Юлдашева</option>
                <option>Севара Назархан</option>
                <option>Шохруххон</option>
                <option>Юлдуз Усмонова</option>
                <option>Райхон</option>
                <option>Озода Нурсаидова</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded text-indigo-600" />
              <span>New arrivals only</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded text-indigo-600" />
              <span>On sale</span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Featured Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Limited Time</p>
            <p className="font-bold text-lg">20% OFF All Hoodies</p>
            <p className="text-sm opacity-90">Use code: STARIO20</p>
          </div>
          <div className="text-4xl">🔥</div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
            >
              <Link to={`/merch/${product.id}`}>
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full aspect-square object-cover"
                  />
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        NEW
                      </span>
                    )}
                    {product.isBestseller && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        BEST
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        SALE
                      </span>
                    )}
                  </div>
                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to cart logic
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs text-indigo-600 font-medium">{product.artist}</p>
                  <h3 className="font-semibold text-sm text-gray-900 mt-0.5 line-clamp-2">
                    {product.name}
                  </h3>
                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({product.reviews})</span>
                  </div>
                  {/* Price */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500">No products found</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 text-indigo-600 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Load More */}
      {filteredProducts.length > 0 && (
        <button className="w-full mt-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
          Load More
        </button>
      )}

      {/* Recently Viewed */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recently Viewed</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {mockProducts.slice(0, 4).map((product) => (
            <Link
              key={product.id}
              to={`/merch/${product.id}`}
              className="flex-shrink-0 w-28"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-28 h-28 rounded-lg object-cover"
              />
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">{product.name}</p>
              <p className="text-xs font-semibold">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="mt-8 bg-gray-900 rounded-xl p-4 text-white">
        <h3 className="font-bold">Get Exclusive Drops</h3>
        <p className="text-sm text-gray-400 mt-1">Be the first to know about new merch releases</p>
        <div className="flex gap-2 mt-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
