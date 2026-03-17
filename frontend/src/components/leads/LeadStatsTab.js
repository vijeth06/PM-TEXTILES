import React, { useState, useEffect } from 'react';
import { leadsAPI } from '../../services/api';

export default function LeadStatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const conversionRate = Number(stats?.conversionRate || 0);
  const byStatus = Array.isArray(stats?.byStatus) ? stats.byStatus : [];
  const byStatusMap = byStatus.reduce((acc, row) => {
    acc[row?._id] = Number(row?.count || 0);
    return acc;
  }, {});

  const totalLeads = Number(
    stats?.totalLeads ?? byStatus.reduce((sum, row) => sum + Number(row?.count || 0), 0)
  );
  const convertedLeads = Number(stats?.convertedLeads ?? byStatusMap.converted ?? 0);
  const activeLeads = Number(
    stats?.activeLeads ??
    ((byStatusMap.new || 0) +
      (byStatusMap.contacted || 0) +
      (byStatusMap.qualified || 0) +
      (byStatusMap.proposal_sent || 0) +
      (byStatusMap.negotiation || 0) +
      (byStatusMap.on_hold || 0))
  );

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
              <div className="mt-1 text-3xl font-semibold text-gray-900">{totalLeads}</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Converted</div>
              <div className="mt-1 text-3xl font-semibold text-green-600">{convertedLeads}</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
              <div className="mt-1 text-3xl font-semibold text-blue-600">{conversionRate.toFixed(1)}%</div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Active Leads</div>
              <div className="mt-1 text-3xl font-semibold text-purple-600">{activeLeads}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
