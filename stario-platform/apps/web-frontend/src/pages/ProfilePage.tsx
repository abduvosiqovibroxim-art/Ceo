import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  isPremium: boolean;
  stats: {
    videosCreated: number;
    postersGenerated: number;
    ordersPlaced: number;
    totalSpent: number;
  };
}

interface Order {
  id: string;
  date: string;
  status: 'delivered' | 'processing' | 'shipped' | 'cancelled';
  total: number;
  items: number;
  image: string;
}

const mockUser: UserProfile = {
  id: '1',
  name: 'Aziz Karimov',
  email: 'aziz@example.com',
  phone: '+998 90 123 45 67',
  avatar: 'https://via.placeholder.com/100',
  joinDate: 'March 2024',
  isPremium: true,
  stats: {
    videosCreated: 12,
    postersGenerated: 28,
    ordersPlaced: 5,
    totalSpent: 1250000,
  },
};

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    date: '2024-12-01',
    status: 'delivered',
    total: 249000,
    items: 2,
    image: 'https://via.placeholder.com/60',
  },
  {
    id: 'ORD-002',
    date: '2024-11-28',
    status: 'shipped',
    total: 129000,
    items: 1,
    image: 'https://via.placeholder.com/60',
  },
  {
    id: 'ORD-003',
    date: '2024-11-15',
    status: 'delivered',
    total: 450000,
    items: 3,
    image: 'https://via.placeholder.com/60',
  },
];

const menuItems = [
  { icon: '📦', label: 'My Orders', path: '/orders', badge: '2' },
  { icon: '🎬', label: 'My Content', path: '/my-content', badge: null },
  { icon: '❤️', label: 'Favorites', path: '/favorites', badge: '8' },
  { icon: '🎁', label: 'Rewards & Points', path: '/rewards', badge: null },
  { icon: '💳', label: 'Payment Methods', path: '/payments', badge: null },
  { icon: '📍', label: 'Addresses', path: '/addresses', badge: null },
  { icon: '🔔', label: 'Notifications', path: '/notifications', badge: '3' },
  { icon: '⚙️', label: 'Settings', path: '/settings', badge: null },
  { icon: '❓', label: 'Help & Support', path: '/support', badge: null },
];

export default function ProfilePage() {
  const [user] = useState<UserProfile>(mockUser);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'settings'>('overview');

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + ' UZS';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="px-4 py-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
            />
            {user.isPremium && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                <svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user.name}</h1>
              {user.isPremium && (
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                  PRO
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm">{user.email}</p>
            <p className="text-white/60 text-xs mt-1">Member since {user.joinDate}</p>
          </div>
          <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold">{user.stats.videosCreated}</p>
            <p className="text-xs text-white/70">Videos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{user.stats.postersGenerated}</p>
            <p className="text-xs text-white/70">Posters</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{user.stats.ordersPlaced}</p>
            <p className="text-xs text-white/70">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{(user.stats.totalSpent / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-white/70">Spent</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'orders', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/create-moment"
              className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-4 text-white"
            >
              <div className="text-2xl mb-2">🎬</div>
              <p className="font-semibold">Create Video</p>
              <p className="text-xs text-white/80">AI greeting video</p>
            </Link>
            <Link
              to="/poster-maker"
              className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl p-4 text-white"
            >
              <div className="text-2xl mb-2">🖼️</div>
              <p className="font-semibold">Make Poster</p>
              <p className="text-xs text-white/80">AI poster generator</p>
            </Link>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Premium Banner */}
          {!user.isPremium && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="text-3xl">👑</div>
                <div className="flex-1">
                  <p className="font-bold">Upgrade to Premium</p>
                  <p className="text-sm text-white/90">Get unlimited AI generations & exclusive merch</p>
                </div>
                <button className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-semibold">
                  Upgrade
                </button>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors">
            Log Out
          </button>
        </motion.div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {mockOrders.length > 0 ? (
            mockOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={order.image}
                    alt="Order"
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{order.id}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{order.items} item{order.items > 1 ? 's' : ''}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{order.date}</p>
                      <p className="font-semibold text-indigo-600">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <button className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                  {order.status === 'delivered' && (
                    <button className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                      Reorder
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-500">No orders yet</p>
              <Link to="/merch" className="mt-4 inline-block text-indigo-600 font-medium">
                Start Shopping
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Personal Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  defaultValue={user.phone}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              Save Changes
            </button>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Get notified about orders & promos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Updates</p>
                  <p className="text-sm text-gray-500">Receive newsletter & offers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-500">Use dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Language</h3>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500">
              <option value="uz">O'zbek</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 mb-3">Once you delete your account, there is no going back.</p>
            <button className="w-full py-2.5 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors">
              Delete Account
            </button>
          </div>
        </motion.div>
      )}

      {/* App Version */}
      <p className="text-center text-xs text-gray-400 mt-8">
        Stario v1.0.0 • Made with ❤️ in Uzbekistan
      </p>
    </div>
  );
}
