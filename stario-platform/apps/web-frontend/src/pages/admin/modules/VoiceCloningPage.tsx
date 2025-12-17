import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface VoiceModel {
  id: string;
  name: string;
  artist: string;
  language: string;
  samples: number;
  quality: number;
  status: 'active' | 'training' | 'pending';
  createdAt: string;
}

const mockVoices: VoiceModel[] = [
  { id: 'v1', name: 'Shahzoda Voice', artist: 'Шахзода', language: 'Uzbek', samples: 245, quality: 98, status: 'active', createdAt: '2024-01-15' },
  { id: 'v2', name: 'Lola Voice', artist: 'Лола Юлдашева', language: 'Uzbek', samples: 189, quality: 96, status: 'active', createdAt: '2024-01-12' },
  { id: 'v3', name: 'Yulduz Voice', artist: 'Юлдуз Усмонова', language: 'Uzbek', samples: 312, quality: 99, status: 'active', createdAt: '2024-01-10' },
  { id: 'v4', name: 'Ozoda Voice', artist: 'Озода Нурсаидова', language: 'Uzbek', samples: 156, quality: 94, status: 'training', createdAt: '2024-01-18' },
  { id: 'v5', name: 'Rayhon Voice', artist: 'Райхон', language: 'Uzbek', samples: 78, quality: 0, status: 'pending', createdAt: '2024-01-20' },
];

export default function VoiceCloningPage() {
  const [voices] = useState<VoiceModel[]>(mockVoices);
  const [selectedTab, setSelectedTab] = useState<'voices' | 'tts' | 'settings'>('voices');

  const stats = [
    { label: 'Voice Models', value: '156', icon: '🎤' },
    { label: 'TTS Requests/Day', value: '45.2K', icon: '🔊' },
    { label: 'Avg. Quality Score', value: '97.2%', icon: '⭐' },
    { label: 'Languages', value: '12', icon: '🌍' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🎤</span> Voice Cloning / TTS
              </h1>
              <p className="text-pink-100 mt-1">Voice model training, text-to-speech synthesis</p>
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
                <p className="text-pink-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['voices', 'tts', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'tts' ? 'TTS Engine' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'voices' && (
          <div className="space-y-6">
            {/* Voice Models Grid */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Voice Models</h3>
                <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors">
                  + New Voice Model
                </button>
              </div>
              <div className="divide-y">
                {voices.map((voice, index) => (
                  <motion.div
                    key={voice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {voice.artist.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{voice.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          voice.status === 'active' ? 'bg-green-100 text-green-700' :
                          voice.status === 'training' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {voice.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {voice.artist} • {voice.language} • {voice.samples} samples
                      </div>
                    </div>

                    {voice.status !== 'pending' && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">{voice.quality}%</div>
                        <p className="text-xs text-gray-500">Quality</p>
                      </div>
                    )}

                    {voice.status === 'training' && (
                      <div className="w-32">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Training</span>
                          <span className="font-medium">67%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-full bg-yellow-500 rounded-full w-2/3" />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'tts' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">TTS Demo</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Voice</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option>Shahzoda Voice</option>
                    <option>Lola Voice</option>
                    <option>Yulduz Voice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text to Speak</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 h-32"
                    placeholder="Enter text to convert to speech..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
                    <input type="range" className="w-full" min="0.5" max="2" step="0.1" defaultValue="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pitch</label>
                    <input type="range" className="w-full" min="0.5" max="2" step="0.1" defaultValue="1" />
                  </div>
                </div>
                <button className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors">
                  Generate Speech
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Engine Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Workers</span>
                    <span className="font-bold text-gray-900">8 / 12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Queue Size</span>
                    <span className="font-bold text-gray-900">234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Latency</span>
                    <span className="font-bold text-green-600">124ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache Hit Rate</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Supported Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {['Uzbek', 'Russian', 'English', 'Turkish', 'Kazakh', 'Korean', 'Chinese', 'Arabic', 'Persian', 'Hindi', 'Spanish', 'French'].map((lang) => (
                    <span key={lang} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                      {lang}
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
              <h3 className="font-bold text-gray-900 mb-4">Training Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Training Samples</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Training Epochs</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality Threshold</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="90" />
                </div>
                <button className="w-full py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (req/min)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Audio Length (sec)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option>MP3</option>
                    <option>WAV</option>
                    <option>OGG</option>
                  </select>
                </div>
                <button className="w-full py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors">
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
