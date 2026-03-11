import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  ClipboardDocumentListIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import { 
  Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, 
  LoadingSpinner, EmptyState, Input, Select 
} from '../components/common';
import DateRangePicker from '../components/DateRangePicker';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    user: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit
      };

      // Add filters only if they have values
      if (filters.action) queryParams.action = filters.action;
      if (filters.entity) queryParams.entity = filters.entity;
      if (filters.user) queryParams.user = filters.user;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;

      const response = await auditAPI.getAuditLogs(queryParams);
      
      if (response.data && response.data.data) {
        setLogs(response.data.data);
        setPagination({
          page: response.data.page || pagination.page,
          limit: pagination.limit,
          total: response.data.total || 0,
          pages: response.data.pages || 0
        });
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setFilters({ ...filters, startDate, endDate });
      setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity: '',
      user: '',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
      setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionBadge = (action) => {
    const variants = {
      create: 'success',
      update: 'warning',
      delete: 'danger',
      login: 'info',
      logout: 'default',
      view: 'default',
      export: 'info',
      import: 'warning'
    };
    return <Badge variant={variants[action] || 'default'}>{action.toUpperCase()}</Badge>;
  };

  const getEntityBadge = (entity) => {
    return <Badge variant="info">{entity.replace(/_/g, ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-600 mt-1">Track all system activities and changes</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Total Activities</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Period</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {filters.startDate} to {filters.endDate}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Records Shown</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{logs.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Pages</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {pagination.page} / {pagination.pages || 1}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h3>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Action"
              value={filters.action}
              onChange={(e) => {
                setFilters({ ...filters, action: e.target.value });
                 setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="view">View</option>
              <option value="export">Export</option>
              <option value="import">Import</option>
            </Select>

            <Select
              label="Entity Type"
              value={filters.entity}
              onChange={(e) => {
                setFilters({ ...filters, entity: e.target.value });
                 setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Entities</option>
              <option value="order">Orders</option>
              <option value="production">Production</option>
              <option value="inventory">Inventory</option>
              <option value="customer">Customers</option>
              <option value="supplier">Suppliers</option>
              <option value="user">Users</option>
            </Select>

            <Input
              label="User"
              placeholder="Search by username..."
              value={filters.user}
              onChange={(e) => {
                setFilters({ ...filters, user: e.target.value });
                 setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />

            <div className="col-span-1">
              <DateRangePicker
                label="Date Range"
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={handleDateChange}
                presets={false}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ClipboardDocumentListIcon}
              title="No audit logs found"
              description="Try adjusting your filters"
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Timestamp</Th>
                    <Th>User</Th>
                    <Th>Action</Th>
                    <Th>Entity</Th>
                    <Th>Description</Th>
                    <Th>IP Address</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <Td>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <div className="font-medium">{log.user?.fullName || 'System'}</div>
                          <div className="text-xs text-gray-500">@{log.user?.username || 'system'}</div>
                        </div>
                      </Td>
                      <Td>{getActionBadge(log.action)}</Td>
                      <Td>{getEntityBadge(log.entityType)}</Td>
                      <Td className="max-w-xs truncate">{log.description}</Td>
                      <Td className="text-sm text-gray-600">{log.ipAddress || 'N/A'}</Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-3 text-sm text-gray-700">
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AuditTrail;
