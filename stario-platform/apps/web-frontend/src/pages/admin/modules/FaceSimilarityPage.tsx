import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface FaceMatch {
  id: string;
  sourceUser: string;
  matchedCelebrity: string;
  similarity: number;
  timestamp: string;
  status: 'processed' | 'pending' | 'failed';
}

const mockMatches: FaceMatch[] = [
  { id: 'm1', sourceUser: 'user_12345', matchedCelebrity: 'Шахзода', similarity: 87, timestamp: '2 min ago', status: 'processed' },
  { id: 'm2', sourceUser: 'user_67890', matchedCelebrity: 'Лола Юлдашева', similarity: 92, timestamp: '5 min ago', status: 'processed' },
  { id: 'm3', sourceUser: 'user_11111', matchedCelebrity: 'Юлдуз Усмонова', similarity: 78, timestamp: '8 min ago', status: 'processed' },
  { id: 'm4', sourceUser: 'user_22222', matchedCelebrity: 'Шохруххон', similarity: 65, timestamp: '12 min ago', status: 'pending' },
  { id: 'm5', sourceUser: 'user_33333', matchedCelebrity: 'Озода', similarity: 0, timestamp: '15 min ago', status: 'failed' },
];

export default function FaceSimilarityPage() {
  const [matches] = useState<FaceMatch[]>(mockMatches);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'database' | 'api'>('overview');

  const stats = [
    { label: 'Total Comparisons', value: '2.4M', icon: '🔍' },
    { label: 'Avg. Similarity', value: '76.3%', icon: '📊' },
    { label: 'Celebrity Faces', value: '1,245', icon: '⭐' },
    { label: 'Processing Speed', value: '45ms', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>👤</span> Face Similarity Engine
              </h1>
              <p className="text-cyan-100 mt-1">Face matching, celebrity database, embedding vectors</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <p className="text-cyan-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'database', 'api'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-cyan-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'api' ? 'API Settings' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Recent Matches */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h3 className="font-bold text-gray-900">Recent Matches</h3>
              </div>
              <div className="divide-y">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{match.sourceUser}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-cyan-600">{match.matchedCelebrity}</span>
                      </div>
                      <div className="text-sm text-gray-500">{match.timestamp}</div>
                    </div>

                    {match.status === 'processed' && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          match.similarity >= 80 ? 'text-green-600' :
                          match.similarity >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {match.similarity}%
                        </div>
                        <p className="text-xs text-gray-500">Similarity</p>
                      </div>
                    )}

                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      match.status === 'processed' ? 'bg-green-100 text-green-700' :
                      match.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {match.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Engine Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Model Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Model</span>
                    <span className="font-medium">ArcFace-R100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Embedding Size</span>
                    <span className="font-medium">512-d</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Accuracy (LFW)</span>
                    <span className="font-medium text-green-600">99.83%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Index Type</span>
                    <span className="font-medium">FAISS IVF</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Similarity Thresholds</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">High Match</span>
                      <span className="font-bold text-green-600">&gt;80%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-[80%] bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Medium Match</span>
                      <span className="font-bold text-yellow-600">60-80%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-[60%] bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Low Match</span>
                      <span className="font-bold text-red-600">&lt;60%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-[40%] bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'database' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Celebrity Database</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Uzbek Artists</span>
                  <span className="font-bold">245</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">K-Pop Stars</span>
                  <span className="font-bold">512</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Hollywood Actors</span>
                  <span className="font-bold">389</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Other</span>
                  <span className="font-bold">99</span>
                </div>
                <button className="w-full py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors">
                  + Add Celebrity
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Embedding Storage</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Vectors</span>
                  <span className="font-bold">1,245</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Index Size</span>
                  <span className="font-bold">2.4 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="font-bold">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Index Status</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Optimized</span>
                </div>
                <button className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Rebuild Index
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'api' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top K Results</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Similarity (%)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (req/min)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="60" />
                </div>
                <button className="w-full py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">API Endpoints</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-mono">POST</span>
                    <span className="font-mono text-sm">/api/v1/face/compare</span>
                  </div>
                  <p className="text-xs text-gray-500">Compare two faces</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">POST</span>
                    <span className="font-mono text-sm">/api/v1/face/search</span>
                  </div>
                  <p className="text-xs text-gray-500">Find similar celebrities</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-mono">GET</span>
                    <span className="font-mono text-sm">/api/v1/face/embedding</span>
                  </div>
                  <p className="text-xs text-gray-500">Get face embedding vector</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
