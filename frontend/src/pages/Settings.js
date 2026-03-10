import React, { useState, useEffect } from 'react';
import { authAPI, usersAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  UserIcon, KeyIcon, Cog6ToothIcon, UsersIcon, PlusIcon, PencilIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { 
  Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, 
  Modal, Input, Select, LoadingSpinner, EmptyState 
} from '../components/common';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: UserIcon },
    { id: 'password', name: 'Change Password', icon: KeyIcon },
    { id: 'users', name: 'User Management', icon: UsersIcon, adminOnly: true },
    { id: 'system', name: 'System Settings', icon: Cog6ToothIcon, adminOnly: true }
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || user?.role === 'admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and system preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'password' && <PasswordTab />}
        {activeTab === 'users' && user?.role === 'admin' && <UserManagementTab />}
        {activeTab === 'system' && user?.role === 'admin' && <SystemSettingsTab />}
      </div>
    </div>
  );
};

const ProfileTab = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    username: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      setUserData({
        fullName: user.fullName || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || ''
      });
    }
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{userData.fullName}</h3>
              <p className="text-gray-600">{userData.email}</p>
              <Badge variant="info" className="mt-2">{userData.role?.toUpperCase()}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="text-gray-900">{userData.fullName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="text-gray-900">{userData.username}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="text-gray-900">{userData.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="text-gray-900 capitalize">{userData.role?.replace(/_/g, ' ')}</div>
            </div>
          </div>

          {user?.permissions && user.permissions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission, idx) => (
                  <Badge key={idx} variant="default">
                    {permission.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {user?.lastLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
              <div className="text-gray-900">
                {new Date(user.lastLogin).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const PasswordTab = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await authAPI.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            required
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          />

          <Input
            label="New Password"
            type="password"
            required
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            help="Must be at least 6 characters"
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};

const UserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      production_manager: 'warning',
      store_manager: 'info',
      sales_executive: 'success',
      qa_inspector: 'default',
      management: 'info'
    };
    return <Badge variant={variants[role] || 'default'}>{role?.replace(/_/g, ' ').toUpperCase()}</Badge>;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600">Manage system users and their permissions</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New User
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users"
              description="Start by adding a new user"
              action={<Button onClick={handleCreate}>Add User</Button>}
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>User</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Last Login</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <Td>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>{getRoleBadge(user.role)}</Td>
                    <Td>
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </Td>
                    <Td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchUsers();
          }}
        />
      )}
    </>
  );
};

const UserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    password: '',
    role: user?.role || 'sales_executive',
    permissions: user?.permissions || [],
    isActive: user?.isActive !== undefined ? user.isActive : true
  });
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'production_manager', label: 'Production Manager' },
    { value: 'store_manager', label: 'Store Manager' },
    { value: 'sales_executive', label: 'Sales Executive' },
    { value: 'qa_inspector', label: 'QA Inspector' },
    { value: 'management', label: 'Management' }
  ];

  const permissionOptions = [
    'view_production', 'manage_production',
    'view_inventory', 'manage_inventory',
    'view_orders', 'manage_orders',
    'view_suppliers', 'manage_suppliers',
    'view_customers', 'manage_customers',
    'view_reports', 'manage_users', 'system_admin'
  ];

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Submitting user form with data:', formData);

    try {
      if (user) {
        await usersAPI.updateUser(user._id, formData);
        toast.success('User updated successfully');
      } else {
        console.log('Creating new user...');
        const response = await usersAPI.createUser(formData);
        console.log('User creation response:', response);
        toast.success('User created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('User operation failed:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Operation failed';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorDetails = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        toast.error(`${errorMessage} - ${errorDetails}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={user ? 'Edit User' : 'Create User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
          <Input
            label="Username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={!!user}
          />
        </div>

        <Input
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        {!user && (
          <Input
            label="Password"
            type="password"
            required={!user}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            help="Minimum 6 characters"
          />
        )}

        <Select
          label="Role"
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          {roleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
            {permissionOptions.map(permission => (
              <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission)}
                  onChange={() => handlePermissionToggle(permission)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {permission.replace(/_/g, ' ').toUpperCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Active User</span>
        </label>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : user ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const SystemSettingsTab = () => {
  const [settings, setSettings] = useState({
    companyName: 'PM Textiles',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    fiscalYearStart: '04',
    autoBackup: true,
    emailNotifications: true,
    lowStockThreshold: 20,
    criticalStockThreshold: 10
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getSettings();
        if (response.data?.data) {
          setSettings(prev => ({ ...prev, ...response.data.data }));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await settingsAPI.updateSettings(settings);
      toast.success('System settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            />

            <Select
              label="Timezone"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New York (EST)</option>
            </Select>

            <Select
              label="Date Format"
              value={settings.dateFormat}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </Select>

            <Select
              label="Currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            >
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </Select>

            <Select
              label="Fiscal Year Start Month"
              value={settings.fiscalYearStart}
              onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
            >
              <option value="01">January</option>
              <option value="04">April</option>
              <option value="07">July</option>
              <option value="10">October</option>
            </Select>

            <Input
              label="Low Stock Threshold (%)"
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })}
            />

            <Input
              label="Critical Stock Threshold (%)"
              type="number"
              value={settings.criticalStockThreshold}
              onChange={(e) => setSettings({ ...settings, criticalStockThreshold: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Automatic Daily Backup</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Email Notifications</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default Settings;
