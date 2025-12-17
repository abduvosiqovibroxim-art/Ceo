import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Report {
  id: string;
  contentType: 'video' | 'image' | 'audio' | 'text';
  reporter: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const mockReports: Report[] = [
  { id: 'r1', contentType: 'video', reporter: 'user_12345', reason: 'Inappropriate content', status: 'pending', timestamp: '2 min ago', severity: 'high' },
  { id: 'r2', contentType: 'image', reporter: 'user_67890', reason: 'Copyright violation', status: 'pending', timestamp: '5 min ago', severity: 'medium' },
  { id: 'r3', contentType: 'audio', reporter: 'user_11111', reason: 'Unauthorized voice use', status: 'reviewed', timestamp: '12 min ago', severity: 'high' },
  { id: 'r4', contentType: 'text', reporter: 'user_22222', reason: 'Spam', status: 'dismissed', timestamp: '25 min ago', severity: 'low' },
  { id: 'r5', contentType: 'video', reporter: 'user_33333', reason: 'Deepfake misuse', status: 'actioned', timestamp: '1 hour ago', severity: 'critical' },
];

export default function ContentModerationPage() {
  const [reports] = useState<Report[]>(mockReports);
  const [selectedTab, setSelectedTab] = useState<'reports' | 'rules' | 'automation'>('reports');

  const stats = [
    { label: 'Pending Reports', value: '156', icon: '📋' },
    { label: 'Reviewed Today', value: '892', icon: '✅' },
    { label: 'Auto-Blocked', value: '234', icon: '🚫' },
    { label: 'Avg. Response', value: '4.2h', icon: '⏱️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🛡️</span> Content Moderation
              </h1>
              <p className="text-red-100 mt-1">Report management, moderation rules, automated actions</p>
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
                <p className="text-red-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['reports', 'rules', 'automation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Content Reports</h3>
              <div className="flex gap-2">
                <select className="border rounded-lg px-3 py-2 text-sm">
                  <option>All Severities</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Reviewed</option>
                  <option>Actioned</option>
                </select>
              </div>
            </div>
            <div className="divide-y">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    report.contentType === 'video' ? 'bg-purple-100' :
                    report.contentType === 'image' ? 'bg-blue-100' :
                    report.contentType === 'audio' ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    {report.contentType === 'video' ? '🎬' :
                     report.contentType === 'image' ? '🖼️' :
                     report.contentType === 'audio' ? '🎤' : '📝'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{report.reason}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.severity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Reported by {report.reporter} • {report.timestamp}
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                    report.status === 'actioned' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {report.status}
                  </span>

                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
        )}

        {selectedTab === 'rules' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Content Rules</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">NSFW Detection</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">Automatically flag explicit content</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Hate Speech Filter</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">Block hate speech and discrimination</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Copyright Check</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">Detect copyrighted material</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Spam Detection</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">Block spam and repetitive content</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Action Thresholds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto-hide threshold</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="3" />
                  <p className="text-xs text-gray-500 mt-1">Reports before auto-hiding content</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto-ban threshold</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="5" />
                  <p className="text-xs text-gray-500 mt-1">Violations before auto-banning user</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review escalation</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2" defaultValue="24" />
                  <p className="text-xs text-gray-500 mt-1">Hours before escalating to admin</p>
                </div>
                <button className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'automation' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">AI Moderation</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium">Image Classification</span>
                    <p className="text-sm text-gray-500">NSFW & violence detection</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium">Text Analysis</span>
                    <p className="text-sm text-gray-500">Hate speech & toxicity</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium">Audio Fingerprinting</span>
                    <p className="text-sm text-gray-500">Copyright detection</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium">Face Recognition</span>
                    <p className="text-sm text-gray-500">Celebrity consent check</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Automation Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Auto-approved</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-[85%] bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Flagged for review</span>
                    <span className="font-medium text-yellow-600">12%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-[12%] bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Auto-blocked</span>
                    <span className="font-medium text-red-600">3%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-[3%] bg-red-500 rounded-full"></div>
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">False positive rate</span>
                    <span className="font-bold text-green-600">0.8%</span>
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
