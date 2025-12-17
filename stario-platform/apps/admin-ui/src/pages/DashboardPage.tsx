import {
  UsersIcon,
  VideoCameraIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Total Users',
    value: '24,521',
    change: '+12.5%',
    changeType: 'increase',
    icon: UsersIcon,
  },
  {
    name: 'Videos Generated',
    value: '8,234',
    change: '+23.1%',
    changeType: 'increase',
    icon: VideoCameraIcon,
  },
  {
    name: 'Revenue (UZS)',
    value: '425.6M',
    change: '+15.3%',
    changeType: 'increase',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Orders Today',
    value: '156',
    change: '-4.2%',
    changeType: 'decrease',
    icon: ShoppingCartIcon,
  },
];

const recentOrders = [
  { id: 'ORD-001', user: 'john@example.com', type: 'Video', artist: 'Шахзода', amount: 50000, status: 'completed' },
  { id: 'ORD-002', user: 'sarah@example.com', type: 'Poster', artist: 'Лола Юлдашева', amount: 25000, status: 'processing' },
  { id: 'ORD-003', user: 'mike@example.com', type: 'Merch', artist: 'Юлдуз Усмонова', amount: 150000, status: 'pending' },
  { id: 'ORD-004', user: 'anna@example.com', type: 'Video', artist: 'Севара Назархан', amount: 50000, status: 'completed' },
  { id: 'ORD-005', user: 'david@example.com', type: 'Voice', artist: 'Райхон', amount: 15000, status: 'completed' },
];

const pendingReviews = [
  { id: 'REV-001', type: 'Video', artist: 'Шахзода', flag: 'political', priority: 'high' },
  { id: 'REV-002', type: 'Text', artist: 'Лола Юлдашева', flag: 'profanity', priority: 'medium' },
  { id: 'REV-003', type: 'Video', artist: 'Севара Назархан', flag: 'nsfw', priority: 'high' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.changeType === 'increase' ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )}
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.amount.toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Reviews</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingReviews.map((review) => (
                  <tr key={review.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {review.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.flag}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          review.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {review.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">32s</p>
            <p className="text-sm text-gray-500">Avg Video Gen Time</p>
            <p className="text-xs text-green-500">Target: &lt;40s</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">3.2s</p>
            <p className="text-sm text-gray-500">Avg Poster Gen Time</p>
            <p className="text-xs text-green-500">Target: &lt;5s</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">145ms</p>
            <p className="text-sm text-gray-500">Avg Face Similarity</p>
            <p className="text-xs text-green-500">Target: &lt;200ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
