import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'development' | 'planned';
  stats?: {
    label: string;
    value: string;
  }[];
  path: string;
  color: string;
}

const modules: Module[] = [
  {
    id: 'ai-safety',
    name: 'AI Safety & Compliance',
    description: 'Модерация контента, фильтры безопасности, проверка согласий',
    icon: '🛡️',
    status: 'active',
    stats: [
      { label: 'Проверок сегодня', value: '12,450' },
      { label: 'Заблокировано', value: '23' },
    ],
    path: '/admin/ai-safety',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'deepfake-video',
    name: 'DeepFake Video Generation',
    description: 'Генерация AI-видео с артистами, lip-sync, face-swap',
    icon: '🎬',
    status: 'active',
    stats: [
      { label: 'Видео создано', value: '8,234' },
      { label: 'В очереди', value: '45' },
    ],
    path: '/admin/deepfake-pipeline',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'voice-cloning',
    name: 'Voice Cloning / TTS',
    description: 'Клонирование голоса артистов, Text-to-Speech синтез',
    icon: '🎤',
    status: 'active',
    stats: [
      { label: 'Голосов в базе', value: '156' },
      { label: 'Синтезов/день', value: '3,420' },
    ],
    path: '/admin/voice-cloning',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'face-similarity',
    name: 'Face Similarity Engine',
    description: 'Распознавание лиц, сравнение со знаменитостями',
    icon: '🎭',
    status: 'active',
    stats: [
      { label: 'Анализов', value: '45,678' },
      { label: 'Точность', value: '94.2%' },
    ],
    path: '/admin/face-similarity',
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'ai-poster',
    name: 'AI Poster Maker',
    description: 'Генерация постеров с AI, стили, шаблоны',
    icon: '🖼️',
    status: 'active',
    stats: [
      { label: 'Постеров создано', value: '23,456' },
      { label: 'Шаблонов', value: '48' },
    ],
    path: '/admin/poster-maker',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'ai-avatar',
    name: 'AI Avatar Generator',
    description: 'Генерация AI-аватаров, виртуальные персонажи',
    icon: '👤',
    status: 'active',
    stats: [
      { label: 'Аватаров создано', value: '15,234' },
      { label: 'Стилей', value: '24' },
    ],
    path: '/admin/avatar-generator',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'merchverse',
    name: 'MerchVerse Subsystem',
    description: '3D визуализация, print-on-demand, интеграция с производством',
    icon: '👕',
    status: 'active',
    stats: [
      { label: 'Товаров', value: '324' },
      { label: 'Заказов/день', value: '89' },
    ],
    path: '/admin/merchverse',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'billing',
    name: 'Billing System',
    description: 'Stripe, Payme, Click, VAS billing, подписки',
    icon: '💳',
    status: 'active',
    stats: [
      { label: 'Транзакций/день', value: '1,234' },
      { label: 'Выручка/день', value: '45M UZS' },
    ],
    path: '/admin/billing',
    color: 'from-green-600 to-teal-600',
  },
  {
    id: 'moderation',
    name: 'Content Moderation',
    description: 'AI модерация, ручная проверка, жалобы пользователей',
    icon: '🔍',
    status: 'active',
    stats: [
      { label: 'На модерации', value: '12' },
      { label: 'Обработано', value: '5,678' },
    ],
    path: '/admin/content-moderation',
    color: 'from-red-500 to-rose-600',
  },
  {
    id: 'artists-management',
    name: 'Artists Management',
    description: 'Управление артистами: ФИО, цена, описание, фото, категории',
    icon: '🎤',
    status: 'active',
    stats: [
      { label: 'Всего артистов', value: '40' },
      { label: 'Активных', value: '38' },
    ],
    path: '/admin/artists',
    color: 'from-fuchsia-500 to-pink-600',
  },
];

const stats = [
  { label: 'Всего пользователей', value: '125,430', change: '+12.5%', icon: '👥' },
  { label: 'Видео создано', value: '45,678', change: '+8.3%', icon: '🎬' },
  { label: 'Выручка (месяц)', value: '1.2B UZS', change: '+15.2%', icon: '💰' },
  { label: 'Активных подписок', value: '8,234', change: '+5.7%', icon: '⭐' },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const filteredModules = modules.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Module['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>;
      case 'development':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">In Dev</span>;
      case 'planned':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">Planned</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Stario Admin</h1>
              <p className="text-slate-300 mt-1">Internal Modules Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules..."
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Internal Modules</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={module.path}
                className={`block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all ${
                  module.status === 'planned' ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className={`bg-gradient-to-r ${module.color} p-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{module.icon}</span>
                    {getStatusBadge(module.status)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{module.description}</p>

                  {module.stats && module.stats.length > 0 && (
                    <div className="flex gap-4 mt-4 pt-4 border-t">
                      {module.stats.map((stat) => (
                        <div key={stat.label}>
                          <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* System Status */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-5 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="font-medium text-gray-900">API Gateway</p>
                <p className="text-xs text-green-600">Healthy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="font-medium text-gray-900">ML Pipeline</p>
                <p className="text-xs text-green-600">Healthy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-xs text-green-600">Healthy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                </div>
                <p className="font-medium text-gray-900">GPU Cluster</p>
                <p className="text-xs text-yellow-600">High Load (78%)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="font-medium text-gray-900">CDN</p>
                <p className="text-xs text-green-600">Healthy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Video generation completed</td>
                  <td className="px-6 py-4 text-sm text-gray-500">DeepFake Video</td>
                  <td className="px-6 py-4 text-sm text-gray-500">user_12345</td>
                  <td className="px-6 py-4 text-sm text-gray-500">2 min ago</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Success</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Content flagged for review</td>
                  <td className="px-6 py-4 text-sm text-gray-500">AI Safety</td>
                  <td className="px-6 py-4 text-sm text-gray-500">system</td>
                  <td className="px-6 py-4 text-sm text-gray-500">5 min ago</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Payment processed</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Billing</td>
                  <td className="px-6 py-4 text-sm text-gray-500">user_67890</td>
                  <td className="px-6 py-4 text-sm text-gray-500">8 min ago</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Success</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">New artist added</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Admin Panel</td>
                  <td className="px-6 py-4 text-sm text-gray-500">admin_1</td>
                  <td className="px-6 py-4 text-sm text-gray-500">15 min ago</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Info</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Voice model training started</td>
                  <td className="px-6 py-4 text-sm text-gray-500">Voice Cloning</td>
                  <td className="px-6 py-4 text-sm text-gray-500">ml_pipeline</td>
                  <td className="px-6 py-4 text-sm text-gray-500">23 min ago</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Processing</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
