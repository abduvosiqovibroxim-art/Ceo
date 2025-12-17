import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AvatarStyle {
  id: string;
  name: string;
  preview: string;
  uses: number;
  status: 'active' | 'beta' | 'deprecated';
}

const mockStyles: AvatarStyle[] = [
  { id: 's1', name: '3D Cartoon', preview: '🎭', uses: 45200, status: 'active' },
  { id: 's2', name: 'Anime', preview: '🌸', uses: 38900, status: 'active' },
  { id: 's3', name: 'Realistic', preview: '👤', uses: 28500, status: 'active' },
  { id: 's4', name: 'Pixel Art', preview: '👾', uses: 15600, status: 'active' },
  { id: 's5', name: 'Watercolor', preview: '🎨', uses: 8900, status: 'beta' },
  { id: 's6', name: 'Oil Painting', preview: '🖼️', uses: 2100, status: 'beta' },
];

export default function AIAvatarGeneratorPage() {
  const [styles] = useState<AvatarStyle[]>(mockStyles);
  const [selectedTab, setSelectedTab] = useState<'styles' | 'generation' | 'models'>('styles');

  const stats = [
    { label: 'Avatars Generated', value: '892K', icon: '🎭' },
    { label: 'Active Styles', value: '24', icon: '🎨' },
    { label: 'Avg. Gen Time', value: '4.5s', icon: '⏱️' },
    { label: 'User Satisfaction', value: '96%', icon: '😊' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🎭</span> AI Avatar Generator
              </h1>
              <p className="text-indigo-100 mt-1">Style models, avatar generation, customization engine</p>
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
                <p className="text-indigo-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['styles', 'generation', 'models'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'styles' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Avatar Styles</h3>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                + New Style
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6">
              {styles.map((style, index) => (
                <motion.div
                  key={style.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-5xl">{style.preview}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{style.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      style.status === 'active' ? 'bg-green-100 text-green-700' :
                      style.status === 'beta' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {style.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{style.uses.toLocaleString()} uses</div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors">
                      Edit
                    </button>
                    <button className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Preview
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
                    <span className="font-medium">Face Encoder</span>
                    <span className="text-sm text-gray-500">ArcFace</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Style Encoder</span>
                    <span className="text-sm text-gray-500">CLIP</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Generator</span>
                    <span className="text-sm text-gray-500">StyleGAN3</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Upscaler</span>
                    <span className="text-sm text-gray-500">Real-ESRGAN</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Queue Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-bold">128</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processing</span>
                    <span className="font-bold text-indigo-600">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Today</span>
                    <span className="font-bold text-green-600">4,892</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-bold text-red-600">23</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Output Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Default Size</span>
                    <span className="font-medium">512x512</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max Size</span>
                    <span className="font-medium">2048x2048</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Format</span>
                    <span className="font-medium">PNG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'models' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Active Models</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">StyleGAN3-T</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Production</span>
                  </div>
                  <p className="text-sm text-gray-500">Main avatar generation model</p>
                  <div className="flex gap-4 text-sm mt-2">
                    <span className="text-gray-500">VRAM: <span className="text-gray-900">8GB</span></span>
                    <span className="text-gray-500">Speed: <span className="text-gray-900">45ms</span></span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">AnimeGAN v3</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Production</span>
                  </div>
                  <p className="text-sm text-gray-500">Anime style transformation</p>
                  <div className="flex gap-4 text-sm mt-2">
                    <span className="text-gray-500">VRAM: <span className="text-gray-900">4GB</span></span>
                    <span className="text-gray-500">Speed: <span className="text-gray-900">32ms</span></span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">ToonMe v2</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Beta</span>
                  </div>
                  <p className="text-sm text-gray-500">3D cartoon style</p>
                  <div className="flex gap-4 text-sm mt-2">
                    <span className="text-gray-500">VRAM: <span className="text-gray-900">6GB</span></span>
                    <span className="text-gray-500">Speed: <span className="text-gray-900">58ms</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Model Training</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">PixelArt-Fine v1.2</span>
                    <span className="text-sm text-indigo-600">Training...</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-[67%] bg-indigo-500 rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Epoch 67/100</span>
                    <span>ETA: 2h 34m</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Training Queue</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 bg-gray-50 rounded px-3">
                      <span className="text-sm">Watercolor-HD</span>
                      <span className="text-xs text-gray-500">Queued</span>
                    </div>
                    <div className="flex items-center justify-between py-2 bg-gray-50 rounded px-3">
                      <span className="text-sm">OilPaint-Pro</span>
                      <span className="text-xs text-gray-500">Queued</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
