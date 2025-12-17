import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  category: string;
  uses: number;
  status: 'active' | 'draft' | 'archived';
}

const mockTemplates: Template[] = [
  { id: 't1', name: 'Concert Promo', category: 'Events', uses: 12450, status: 'active' },
  { id: 't2', name: 'Album Release', category: 'Music', uses: 8920, status: 'active' },
  { id: 't3', name: 'Fan Meetup', category: 'Events', uses: 5640, status: 'active' },
  { id: 't4', name: 'Birthday Wish', category: 'Personal', uses: 15890, status: 'active' },
  { id: 't5', name: 'Holiday Special', category: 'Seasonal', uses: 0, status: 'draft' },
];

export default function AIPosterMakerAdminPage() {
  const [templates] = useState<Template[]>(mockTemplates);
  const [selectedTab, setSelectedTab] = useState<'templates' | 'generation' | 'settings'>('templates');

  const stats = [
    { label: 'Posters Generated', value: '156K', icon: '🖼️' },
    { label: 'Active Templates', value: '48', icon: '📑' },
    { label: 'Avg. Gen Time', value: '3.2s', icon: '⏱️' },
    { label: 'User Rating', value: '4.8', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🎨</span> AI Poster Maker
              </h1>
              <p className="text-orange-100 mt-1">Template management, generation pipeline, style configs</p>
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
                <p className="text-orange-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['templates', 'generation', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'templates' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Poster Templates</h3>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                + New Template
              </button>
            </div>
            <div className="divide-y">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎨</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        template.status === 'active' ? 'bg-green-100 text-green-700' :
                        template.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {template.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{template.category}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{template.uses.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">Uses</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'generation' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Generation Pipeline</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Face Detection</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-500">RetinaFace model for face localization</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Background Removal</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-500">U2-Net for precise segmentation</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Style Transfer</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-500">Neural style application</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Text Overlay</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-500">Dynamic text positioning</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Processing Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Queue Size</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processing</span>
                    <span className="font-bold text-orange-600">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Today</span>
                    <span className="font-bold text-green-600">2,456</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-bold text-red-600">12</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Output Formats</h3>
                <div className="flex flex-wrap gap-2">
                  {['PNG', 'JPG', 'WebP', 'PDF', 'SVG'].map((format) => (
                    <span key={format} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quality Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Resolution</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option>1080 x 1920 (HD)</option>
                    <option>2160 x 3840 (4K)</option>
                    <option>4320 x 7680 (8K)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">JPG Quality</label>
                  <input type="range" className="w-full" min="60" max="100" defaultValue="90" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PNG Compression</label>
                  <input type="range" className="w-full" min="1" max="9" defaultValue="6" />
                </div>
                <button className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Watermark Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enable Watermark</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Position</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option>Bottom Right</option>
                    <option>Bottom Left</option>
                    <option>Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                  <input type="range" className="w-full" min="10" max="100" defaultValue="50" />
                </div>
                <button className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
