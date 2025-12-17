import { useParams } from 'react-router-dom';
import { useState } from 'react';

export default function ArtistDetailPage() {
  const { id: _artistId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Artist ID can be used for data fetching
  console.debug('Artist ID:', _artistId);

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'prompts', name: 'Prompts' },
    { id: 'restrictions', name: 'Restrictions' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'verification', name: 'Verification' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-6">
          <img
            src="https://via.placeholder.com/96"
            alt="Artist"
            className="h-24 w-24 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Шахзода</h1>
            <p className="text-gray-500">Singer - Uzbekistan</p>
            <span className="inline-flex mt-2 rounded-full px-3 py-1 text-sm font-semibold bg-green-100 text-green-800">
              Verified
            </span>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold text-gray-900">1,500</p>
            <p className="text-sm text-gray-500">Videos Generated</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">75M UZS</p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Bio</h3>
              <p className="mt-2 text-gray-600">
                Popular Uzbek singer known for his energetic performances and
                heartfelt ballads. Active in the music industry since 2010.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                <p className="mt-1 text-lg font-semibold">Singer</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Country</h4>
                <p className="mt-1 text-lg font-semibold">Uzbekistan</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Rating</h4>
                <p className="mt-1 text-lg font-semibold">4.8 / 5.0</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Prompt Templates</h3>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm">
                Add Template
              </button>
            </div>
            <div className="space-y-4">
              {['Birthday Greeting', 'General Greeting', 'Congratulations'].map((template) => (
                <div key={template} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{template}</h4>
                    <span className="text-green-600 text-sm">Active</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Salom {'{recipient_name}'}! {'{custom_message}'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'restrictions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content Restrictions</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Allowed Topics (Whitelist)</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Birthday', 'Greeting', 'Congratulation', 'Holiday'].map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Blocked Topics (Blacklist)</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Politics', 'Religion', 'Violence', 'Adult'].map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Feature Permissions</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" checked className="rounded text-indigo-600" readOnly />
                  <span className="ml-2 text-sm">Face Quiz</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked className="rounded text-indigo-600" readOnly />
                  <span className="ml-2 text-sm">Voice Clone</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked className="rounded text-indigo-600" readOnly />
                  <span className="ml-2 text-sm">Merchandise</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12 text-gray-500">
            Analytics charts will be displayed here
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Verification Documents</h3>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Status: <span className="text-green-600 font-medium">Approved</span></p>
              <p className="text-sm text-gray-500 mt-2">Verified on: January 15, 2024</p>
              <p className="text-sm text-gray-500">Verified by: Admin User</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
