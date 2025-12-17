import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  user: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'payme' | 'click';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  timestamp: string;
}

const mockTransactions: Transaction[] = [
  { id: 'txn_001', user: 'user_12345', amount: 29.99, currency: 'USD', provider: 'stripe', status: 'completed', timestamp: '2 min ago' },
  { id: 'txn_002', user: 'user_67890', amount: 150000, currency: 'UZS', provider: 'payme', status: 'completed', timestamp: '5 min ago' },
  { id: 'txn_003', user: 'user_11111', amount: 89000, currency: 'UZS', provider: 'click', status: 'pending', timestamp: '8 min ago' },
  { id: 'txn_004', user: 'user_22222', amount: 49.99, currency: 'USD', provider: 'stripe', status: 'failed', timestamp: '15 min ago' },
  { id: 'txn_005', user: 'user_33333', amount: 19.99, currency: 'USD', provider: 'stripe', status: 'refunded', timestamp: '25 min ago' },
];

export default function BillingPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions' | 'providers'>('overview');

  const stats = [
    { label: 'Total Revenue', value: '$1.2M', icon: '💰' },
    { label: 'Today', value: '$12.5K', icon: '📈' },
    { label: 'Transactions', value: '45.2K', icon: '💳' },
    { label: 'Avg. Order', value: '$34.50', icon: '🧾' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>💳</span> Billing System
              </h1>
              <p className="text-yellow-100 mt-1">Stripe, Payme, Click integration & payment management</p>
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
                <p className="text-yellow-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'transactions', 'providers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Revenue Chart Placeholder */}
            <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Revenue Overview</h3>
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {[65, 45, 78, 52, 89, 67, 92, 58, 84, 71, 95, 82].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-yellow-500 to-orange-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-500">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Distribution */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Stripe</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-[65%] bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Payme</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-[25%] bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Click</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-[10%] bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Refund Rate</span>
                    <span className="font-bold text-yellow-600">1.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chargebacks</span>
                    <span className="font-bold text-red-600">0.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Recent Transactions</h3>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
                Export CSV
              </button>
            </div>
            <div className="divide-y">
              {transactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.provider === 'stripe' ? 'bg-purple-100' :
                    txn.provider === 'payme' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {txn.provider === 'stripe' ? '💳' : txn.provider === 'payme' ? '📱' : '📲'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{txn.id}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{txn.user}</span>
                    </div>
                    <div className="text-sm text-gray-500">{txn.timestamp}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {txn.currency === 'USD' ? '$' : ''}{txn.amount.toLocaleString()} {txn.currency === 'UZS' ? 'UZS' : ''}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{txn.provider}</div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                    txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    txn.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {txn.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'providers' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Stripe */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Stripe</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Connected</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mode</span>
                  <span className="font-medium">Live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currencies</span>
                  <span className="font-medium">USD, EUR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Webhook</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-purple-100 text-purple-600 rounded-lg font-medium hover:bg-purple-200 transition-colors">
                Configure
              </button>
            </div>

            {/* Payme */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Payme</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Connected</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mode</span>
                  <span className="font-medium">Live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currency</span>
                  <span className="font-medium">UZS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Callback</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                Configure
              </button>
            </div>

            {/* Click */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📲</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Click</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Connected</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mode</span>
                  <span className="font-medium">Live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currency</span>
                  <span className="font-medium">UZS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Callback</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-green-100 text-green-600 rounded-lg font-medium hover:bg-green-200 transition-colors">
                Configure
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
