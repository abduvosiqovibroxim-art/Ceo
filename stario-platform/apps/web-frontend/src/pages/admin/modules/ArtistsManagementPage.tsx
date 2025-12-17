import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { artistsApi, Artist, ArtistStats, ArtistCreate, ArtistUpdate } from '../../../services/api';

type Category = 'pop' | 'traditional' | 'rap' | 'rock';
type Status = 'active' | 'pending' | 'suspended';

const categories: { id: Category; label: string }[] = [
  { id: 'pop', label: 'Pop' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'rap', label: 'Rap' },
  { id: 'rock', label: 'Rock' },
];

const statuses: { id: Status; label: string; color: string }[] = [
  { id: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { id: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-700' },
];

export default function ArtistsManagementPage() {
  useTranslation();

  // Data state
  const [artists, setArtists] = useState<Artist[]>([]);
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ArtistCreate>>({
    name: '',
    description: '',
    image: '',
    category: 'pop',
    gender: 'male',
    price: 50000,
    followers: '0',
    is_verified: false,
    is_popular: false,
    status: 'pending',
    email: '',
    phone: '',
  });

  // Fetch artists from API
  const fetchArtists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await artistsApi.getAll({
        category: filterCategory !== 'all' ? filterCategory : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
        page: currentPage,
        page_size: 20,
      });

      setArtists(response.items);
      setTotalPages(response.total_pages);
      setTotalItems(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artists');
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, searchQuery, currentPage]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await artistsApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchArtists();
    fetchStats();
  }, [fetchArtists, fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchArtists();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterStatus]);

  const openCreateModal = () => {
    setEditingArtist(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      category: 'pop',
      gender: 'male',
      price: 50000,
      followers: '0',
      is_verified: false,
      is_popular: false,
      status: 'pending',
      email: '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (artist: Artist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      description: artist.description || '',
      image: artist.image || '',
      category: artist.category,
      gender: artist.gender,
      price: artist.price,
      followers: artist.followers,
      is_verified: artist.is_verified,
      is_popular: artist.is_popular,
      status: artist.status,
      email: artist.email || '',
      phone: artist.phone || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArtist(null);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    setIsSaving(true);
    try {
      if (editingArtist) {
        // Update existing
        const updateData: ArtistUpdate = {
          name: formData.name,
          description: formData.description || undefined,
          image: formData.image || undefined,
          category: formData.category,
          gender: formData.gender,
          price: formData.price,
          followers: formData.followers,
          is_verified: formData.is_verified,
          is_popular: formData.is_popular,
          status: formData.status,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        };
        await artistsApi.update(editingArtist.id, updateData);
      } else {
        // Create new
        const createData: ArtistCreate = {
          name: formData.name!,
          description: formData.description,
          image: formData.image,
          category: formData.category || 'pop',
          gender: formData.gender || 'male',
          price: formData.price || 50000,
          followers: formData.followers || '0',
          is_verified: formData.is_verified || false,
          is_popular: formData.is_popular || false,
          status: formData.status || 'pending',
          email: formData.email,
          phone: formData.phone,
        };
        await artistsApi.create(createData);
      }

      closeModal();
      fetchArtists();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save artist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!artistToDelete) return;

    try {
      await artistsApi.delete(artistToDelete.id);
      setIsDeleteConfirmOpen(false);
      setArtistToDelete(null);
      fetchArtists();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete artist');
    }
  };

  const toggleVerified = async (artist: Artist) => {
    try {
      await artistsApi.toggleVerification(artist.id, !artist.is_verified);
      fetchArtists();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update verification');
    }
  };

  const togglePopular = async (artist: Artist) => {
    try {
      await artistsApi.togglePopular(artist.id, !artist.is_popular);
      fetchArtists();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update popularity');
    }
  };

  const toggleStatus = async (artist: Artist) => {
    const statusOrder: Status[] = ['active', 'pending', 'suspended'];
    const currentIndex = statusOrder.indexOf(artist.status as Status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      await artistsApi.updateStatus(artist.id, nextStatus);
      fetchArtists();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleSeedArtists = async () => {
    try {
      setLoading(true);
      const result = await artistsApi.seed();
      alert(result.message);
      fetchArtists();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed artists');
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    { label: 'Total Artists', value: stats?.total || 0, icon: '👥' },
    { label: 'Active', value: stats?.active || 0, icon: '✅' },
    { label: 'Verified', value: stats?.verified || 0, icon: '🔵' },
    { label: 'Popular', value: stats?.popular || 0, icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🎤</span> Artists Management
              </h1>
              <p className="text-indigo-200 mt-1">Manage artists, set prices, verify accounts</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {displayStats.map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <p className="text-indigo-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* Seed Button (dev) */}
            {artists.length === 0 && !loading && (
              <button
                onClick={handleSeedArtists}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                Seed Sample Data
              </button>
            )}

            {/* Add Button */}
            <button
              onClick={openCreateModal}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Artist
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading artists...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && artists.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <span className="text-6xl">🎤</span>
            <h3 className="text-xl font-bold text-gray-900 mt-4">No artists found</h3>
            <p className="text-gray-500 mt-2">Get started by adding your first artist or seed sample data</p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleSeedArtists}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                Seed Sample Data
              </button>
              <button
                onClick={openCreateModal}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Add Artist
              </button>
            </div>
          </div>
        )}

        {/* Artists Table */}
        {!loading && artists.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {artists.map((artist, index) => (
                  <motion.tr
                    key={artist.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&size=200&background=6366f1&color=fff`}
                          alt={artist.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{artist.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{artist.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        artist.category === 'pop' ? 'bg-purple-100 text-purple-700' :
                        artist.category === 'traditional' ? 'bg-amber-100 text-amber-700' :
                        artist.category === 'rap' ? 'bg-gray-800 text-white' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {artist.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{artist.price.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm"> UZS</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{artist.followers}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(artist)}
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          statuses.find(s => s.id === artist.status)?.color
                        }`}
                      >
                        {artist.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleVerified(artist)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            artist.is_verified ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={artist.is_verified ? 'Verified' : 'Not verified'}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => togglePopular(artist)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            artist.is_popular ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={artist.is_popular ? 'Popular' : 'Not popular'}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(artist)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setArtistToDelete(artist);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {artists.length} of {totalItems} artists
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingArtist ? 'Edit Artist' : 'Add New Artist'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Artist name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Short description"
                  />
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      {/* File Upload */}
                      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Choose Photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData({ ...formData, image: event.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {/* OR divider */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400">OR</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      {/* URL Input */}
                      <input
                        type="url"
                        value={formData.image?.startsWith('data:') ? '' : (formData.image || '')}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        placeholder="Paste image URL here..."
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const name = formData.name || 'Artist';
                            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                            const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                            setFormData({ ...formData, image: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${randomColor}&color=fff&bold=true&font-size=0.4` });
                          }}
                          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                        >
                          Generate Avatar
                        </button>
                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category || 'pop'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender || 'male'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Two columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (UZS)</label>
                    <input
                      type="number"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>

                  {/* Followers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                    <input
                      type="text"
                      value={formData.followers || ''}
                      onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1.5M"
                    />
                  </div>
                </div>

                {/* Two columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="artist@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_verified || false}
                      onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Verified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_popular || false}
                      onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Popular (Top)</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || isSaving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingArtist ? 'Save Changes' : 'Create Artist'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && artistToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Artist</h3>
                    <p className="text-gray-500 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  Are you sure you want to delete <strong>{artistToDelete.name}</strong>?
                </p>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
