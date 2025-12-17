export default function ArtistVerificationPage() {
  const pendingVerifications = [
    { id: 'ver_001', artistName: 'New Artist 1', submittedAt: '2024-01-20', documents: 2 },
    { id: 'ver_002', artistName: 'New Artist 2', submittedAt: '2024-01-19', documents: 2 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Artist Verification Queue</h1>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b">
          <p className="text-sm text-gray-500">{pendingVerifications.length} pending verifications</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {pendingVerifications.map((ver) => (
            <li key={ver.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{ver.artistName}</h3>
                  <p className="text-sm text-gray-500">Submitted: {ver.submittedAt}</p>
                  <p className="text-sm text-gray-500">{ver.documents} documents attached</p>
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                    View Documents
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
