import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Job {
  id: string;
  type: 'face_swap' | 'lip_sync' | 'full_body';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  user: string;
  createdAt: string;
  duration: string;
}

const mockJobs: Job[] = [
  { id: 'job_001', type: 'face_swap', status: 'processing', progress: 67, user: 'user_12345', createdAt: '2 min ago', duration: '00:45' },
  { id: 'job_002', type: 'lip_sync', status: 'queued', progress: 0, user: 'user_67890', createdAt: '5 min ago', duration: '01:20' },
  { id: 'job_003', type: 'full_body', status: 'completed', progress: 100, user: 'user_11111', createdAt: '12 min ago', duration: '02:15' },
  { id: 'job_004', type: 'face_swap', status: 'failed', progress: 45, user: 'user_22222', createdAt: '18 min ago', duration: '00:30' },
  { id: 'job_005', type: 'lip_sync', status: 'processing', progress: 23, user: 'user_33333', createdAt: '25 min ago', duration: '01:45' },
];

export default function DeepFakePipelinePage() {
  const [jobs] = useState<Job[]>(mockJobs);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'queue' | 'models'>('overview');

  const stats = [
    { label: 'Active Jobs', value: '24', icon: '⚡' },
    { label: 'Queue Size', value: '156', icon: '📋' },
    { label: 'Completed Today', value: '1,892', icon: '✅' },
    { label: 'Avg. Processing', value: '2.4s', icon: '⏱️' },
  ];

  const gpuNodes = [
    { id: 'GPU-01', model: 'A100 80GB', utilization: 87, memory: 72, status: 'active', jobs: 4 },
    { id: 'GPU-02', model: 'A100 80GB', utilization: 92, memory: 85, status: 'active', jobs: 5 },
    { id: 'GPU-03', model: 'A100 40GB', utilization: 45, memory: 38, status: 'active', jobs: 2 },
    { id: 'GPU-04', model: 'A100 40GB', utilization: 0, memory: 0, status: 'idle', jobs: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🎬</span> DeepFake Video Pipeline
              </h1>
              <p className="text-purple-100 mt-1">Face swap, lip sync, video generation engine</p>
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
                <p className="text-purple-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'queue', 'models'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* GPU Cluster Status */}
            <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">GPU Cluster Status</h3>
              <div className="space-y-4">
                {gpuNodes.map((node) => (
                  <div key={node.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${node.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium">{node.id}</span>
                        <span className="text-sm text-gray-500">{node.model}</span>
                      </div>
                      <span className="text-sm text-gray-500">{node.jobs} jobs</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">GPU Utilization</span>
                          <span className="font-medium">{node.utilization}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-full rounded-full ${node.utilization > 80 ? 'bg-red-500' : node.utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${node.utilization}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Memory</span>
                          <span className="font-medium">{node.memory}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-full rounded-full ${node.memory > 80 ? 'bg-red-500' : node.memory > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${node.memory}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Config */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Pipeline Config</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max Resolution</span>
                    <span className="font-medium">1080p</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max Duration</span>
                    <span className="font-medium">5 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">FPS</span>
                    <span className="font-medium">30</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Batch Size</span>
                    <span className="font-medium">8</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Active Models</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">FaceSwap v3.2</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">LipSync v2.1</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">BodyMotion v1.8</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">EnhanceNet v4.0</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Beta</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'queue' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="font-bold text-gray-900">Processing Queue</h3>
            </div>
            <div className="divide-y">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    job.type === 'face_swap' ? 'bg-purple-100' :
                    job.type === 'lip_sync' ? 'bg-blue-100' : 'bg-pink-100'
                  }`}>
                    {job.type === 'face_swap' ? '🎭' : job.type === 'lip_sync' ? '👄' : '🕺'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{job.id}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{job.type.replace('_', ' ')}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.user} • {job.createdAt} • {job.duration}
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <div className="w-32">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                      </div>
                    </div>
                  )}

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'completed' ? 'bg-green-100 text-green-700' :
                    job.status === 'failed' ? 'bg-red-100 text-red-700' :
                    job.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {job.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'models' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Face Swap Models</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">FaceSwap v3.2</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Production</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">High-quality face replacement with expression transfer</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500">Accuracy: <span className="text-gray-900">98.5%</span></span>
                    <span className="text-gray-500">Speed: <span className="text-gray-900">2.1s/frame</span></span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">FaceSwap v4.0-beta</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Testing</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Next-gen model with improved edge cases</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500">Accuracy: <span className="text-gray-900">99.1%</span></span>
                    <span className="text-gray-500">Speed: <span className="text-gray-900">1.8s/frame</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Lip Sync Models</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">LipSync v2.1</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Production</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Audio-driven lip movement synthesis</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500">Sync Score: <span className="text-gray-900">96.2%</span></span>
                    <span className="text-gray-500">Languages: <span className="text-gray-900">12</span></span>
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
