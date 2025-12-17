import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  status: 'active' | 'low_stock' | 'out_of_stock';
}

const mockProducts: Product[] = [
  { id: 'p1', name: 'Artist T-Shirt', category: 'Apparel', price: 29.99, stock: 245, sales: 1892, status: 'active' },
  { id: 'p2', name: 'Concert Poster', category: 'Prints', price: 15.99, stock: 89, sales: 3450, status: 'active' },
  { id: 'p3', name: 'Album Vinyl', category: 'Music', price: 34.99, stock: 12, sales: 567, status: 'low_stock' },
  { id: 'p4', name: 'Phone Case', category: 'Accessories', price: 19.99, stock: 0, sales: 2100, status: 'out_of_stock' },
  { id: 'p5', name: 'Hoodie', category: 'Apparel', price: 49.99, stock: 156, sales: 890, status: 'active' },
];

export default function MerchVersePage() {
  const [products] = useState<Product[]>(mockProducts);
  const [selectedTab, setSelectedTab] = useState<'products' | 'orders' | 'fulfillment'>('products');

  const stats = [
    { label: 'Total Revenue', value: '$245K', icon: '💰' },
    { label: 'Orders Today', value: '892', icon: '📦' },
    { label: 'Active Products', value: '156', icon: '🛍️' },
    { label: 'Pending Shipments', value: '45', icon: '🚚' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🛍️</span> MerchVerse Subsystem
              </h1>
              <p className="text-emerald-100 mt-1">E-commerce, inventory, order management, fulfillment</p>
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
                <p className="text-emerald-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['products', 'orders', 'fulfillment'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {selectedTab === 'products' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Product Inventory</h3>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                + Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 font-medium">${product.price}</td>
                      <td className="px-6 py-4">{product.stock}</td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">{product.sales}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' :
                          product.status === 'low_stock' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'orders' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h3 className="font-bold text-gray-900">Recent Orders</h3>
              </div>
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                      #{i}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Order #ORD-{1000 + i}</div>
                      <div className="text-sm text-gray-500">user_{12345 + i} • 2 items • ${(29.99 * i).toFixed(2)}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      i <= 2 ? 'bg-yellow-100 text-yellow-700' :
                      i <= 4 ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {i <= 2 ? 'Processing' : i <= 4 ? 'Shipped' : 'Delivered'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Order Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-bold text-yellow-600">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processing</span>
                    <span className="font-bold text-blue-600">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Shipped</span>
                    <span className="font-bold text-purple-600">128</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Delivered</span>
                    <span className="font-bold text-green-600">892</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Stripe</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Payme</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Click</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'fulfillment' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Shipping Partners</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">DHL Express</span>
                    <p className="text-sm text-gray-500">International shipping</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">Uzbekistan Post</span>
                    <p className="text-sm text-gray-500">Local delivery</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">Yandex Delivery</span>
                    <p className="text-sm text-gray-500">Same-day delivery</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Warehouse Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Capacity Used</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full w-[67%] bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">1,245</div>
                    <p className="text-sm text-gray-500">Total SKUs</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">45</div>
                    <p className="text-sm text-gray-500">Low Stock Items</p>
                  </div>
                </div>
                <button className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                  Generate Restock Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
