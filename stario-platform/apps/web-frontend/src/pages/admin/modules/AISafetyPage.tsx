import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ContentItem {
  id: string;
  type: 'video' | 'image' | 'audio';
  user: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  flags: string[];
  riskScore: number;
}

const mockContent: ContentItem[] = [
  { id: '1', type: 'video', user: 'user_12345', timestamp: '2 min ago', status: 'pending', flags: ['face_manipulation'], riskScore: 72 },
  { id: '2', type: 'image', user: 'user_67890', timestamp: '5 min ago', status: 'pending', flags: ['inappropriate_content'], riskScore: 85 },
  { id: '3', type: 'video', user: 'user_11111', timestamp: '12 min ago', status: 'approved', flags: [], riskScore: 12 },
  { id: '4', type: 'audio', user: 'user_22222', timestamp: '18 min ago', status: 'rejected', flags: ['unauthorized_voice'], riskScore: 95 },
  { id: '5', type: 'video', user: 'user_33333', timestamp: '25 min ago', status: 'pending', flags: ['celebrity_consent'], riskScore: 45 },
];

export default function AISafetyPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [content] = useState<ContentItem[]>(mockContent);

  const filteredContent = content.filter(c => filter === 'all' || c.status === filter);

  const stats = [
    { label: 'Total Scans Today', value: '12,450', change: '+8.3%' },
    { label: 'Auto-Approved', value: '11,892', change: '+7.1%' },
    { label: 'Flagged for Review', value: '535', change: '-2.4%' },
    { label: 'Blocked', value: '23', change: '-15.2%' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🛡️</span> AI Safety & Compliance
              </h1>
              <p className="text-green-100 mt-1">Content moderation, safety filters, consent verification</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-green-100 text-sm">{stat.label}</p>
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-300' : 'text-red-300'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Safety Rules */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Active Safety Rules</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Face Manipulation Detection</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Celebrity Consent Check</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">NSFW Content Filter</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Voice Authorization</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Political Content Block</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Consent Database</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Artists with consent</span>
                <span className="font-bold text-gray-900">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending approval</span>
                <span className="font-bold text-yellow-600">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revoked</span>
                <span className="font-bold text-red-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expired</span>
                <span className="font-bold text-gray-500">8</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Manage Consents
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Risk Thresholds</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Auto-approve below</span>
                  <span className="font-bold text-green-600">30%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-full w-[30%] bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Manual review</span>
                  <span className="font-bold text-yellow-600">30-70%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-full w-[40%] ml-[30%] bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Auto-block above</span>
                  <span className="font-bold text-red-600">70%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-full w-[30%] ml-[70%] bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Review Queue */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Content Review Queue</h3>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y">
            {filteredContent.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  item.type === 'video' ? 'bg-purple-100' :
                  item.type === 'image' ? 'bg-blue-100' : 'bg-pink-100'
                }`}>
                  {item.type === 'video' ? '🎬' : item.type === 'image' ? '🖼️' : '🎤'}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.type.toUpperCase()}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{item.user}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{item.timestamp}</span>
                  </div>
                  {item.flags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.flags.map((flag) => (
                        <span key={flag} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    item.riskScore < 30 ? 'text-green-600' :
                    item.riskScore < 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.riskScore}%
                  </div>
                  <p className="text-xs text-gray-500">Risk Score</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'approved' ? 'bg-green-100 text-green-700' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
