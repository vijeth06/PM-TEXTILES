import React, { useState, useEffect } from 'react';
import { leadsAPI } from '../../services/analyticsAPI';

export default function LeadStatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await leadsAPI.getLeadStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Lead Statistics</h2>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Total Leads</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalLeads || 0}</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Converted</div>
              <div className="mt-1 text-3xl font-semibold text-green-600">{stats.convertedLeads || 0}</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
              <div className="mt-1 text-3xl font-semibold text-blue-600">{stats.conversionRate?.toFixed(1) || 0}%</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Active Leads</div>
              <div className="mt-1 text-3xl font-semibold text-purple-600">{stats.activeLeads || 0}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
