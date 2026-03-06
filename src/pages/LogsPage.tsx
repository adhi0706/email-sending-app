import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Clock, CheckCircle, XCircle, Filter } from 'lucide-react';

interface EmailLog {
  _id: string;
  client_id: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
  clients: {
    name: string;
    email: string;
  } | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Fetch logs from the Express backend
      const response = await api.get('/logs', { params: { filter } });
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: logs.length,
    sent: logs.filter(log => log.status === 'sent').length,
    failed: logs.filter(log => log.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Logs</h2>
            <p className="text-sm text-gray-600 mt-1">Track all sent and failed emails</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700 mt-1">Total Emails</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-green-700 mt-1">Successfully Sent</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-700 mt-1">Failed</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'sent'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No email logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {log.clients?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.clients?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {log.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {log.error_message ? (
                        <div className="text-xs text-red-600 max-w-xs truncate">
                          {log.error_message}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
