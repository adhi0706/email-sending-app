import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Upload, Trash2, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface Client {
  _id: string;
  slno: number;
  name: string;
  email: string;
  company: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await api.post('/clients/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: response.data.message || 'Successfully uploaded clients' });
      loadClients();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Failed to upload CSV',
      });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all clients?')) return;

    try {
      await api.delete('/clients');
      setMessage({ type: 'success', text: 'All clients deleted successfully' });
      loadClients();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete clients' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
              <p className="text-sm text-gray-600 mt-1">Upload and manage your email recipients</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{clients.length}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <label className="flex-1 min-w-[200px]">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50">
              <Upload className="w-5 h-5" />
              {loading ? 'Uploading...' : 'Upload CSV'}
            </div>
          </label>

          {clients.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete All
            </button>
          )}
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">CSV Format Required:</p>
          <code className="text-xs text-blue-700 block">slno,name,email,company</code>
          <p className="text-xs text-blue-600 mt-2">
            Example: 1,John Doe,john@example.com,Acme Corp
          </p>
        </div>
      </div>

      {clients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SL No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.slno}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.company}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
