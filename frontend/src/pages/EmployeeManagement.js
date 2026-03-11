import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../services/analyticsAPI';
import toast from 'react-hot-toast';
import { 
  UserGroupIcon, 
  PlusIcon, 
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: 'all', status: 'active' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '', email: '', phone: '', department: 'production',
    designation: '', employmentType: 'permanent'
  });

  const departments = [
    { value: 'production', label: 'Production' },
    { value: 'quality', label: 'Quality' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'sales', label: 'Sales' },
    { value: 'admin', label: 'Admin' }
  ];
  const employmentTypes = [
    { value: 'permanent', label: 'Permanent' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'intern', label: 'Intern' }
  ];

  useEffect(() => {
    fetchEmployees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department !== 'all') params.department = filters.department;
      if (filters.status === 'active') params.isActive = true;
      if (filters.status === 'inactive') params.isActive = false;
      const response = await employeesAPI.getEmployees(params);
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (employeeId) => {
    try {
      await employeesAPI.markAttendance(employeeId, {
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        status: 'present'
      });
      toast.success('Attendance marked successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleAddEmployee = async () => {
    try {
      const fullName = (newEmployee.fullName || '').trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || 'NA';

      if (!firstName) {
        toast.error('Full name is required');
        return;
      }

      await employeesAPI.createEmployee({
        personalInfo: {
          firstName,
          lastName,
          email: newEmployee.email,
          contactNumber: newEmployee.phone
        },
        employmentDetails: {
          department: newEmployee.department,
          designation: newEmployee.designation,
          employmentType: newEmployee.employmentType,
          joinDate: new Date().toISOString()
        }
      });
      toast.success('Employee added successfully');
      setShowAddModal(false);
      setNewEmployee({ fullName: '', email: '', phone: '', department: 'production', designation: '', employmentType: 'permanent' });
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error.response?.data?.message || 'Failed to add employee');
    }
  };

  return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold text-gray-900">Employee Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Comprehensive employee records, attendance tracking, training, and performance management.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Department:</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All Status</option>
            </select>
          </div>
        </div>

        {/* Employee Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{employees.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Full-time</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {employees.filter(e => e.employmentDetails?.employmentType === 'permanent').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Present This Month</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {employees.filter(e => (e.attendance?.currentMonthPresent || 0) > 0).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Experience</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {employees.length > 0 
                        ? (employees.reduce((sum, e) => {
                            const joinDate = e.employmentDetails?.joinDate ? new Date(e.employmentDetails.joinDate) : null;
                            if (!joinDate || Number.isNaN(joinDate.getTime())) return sum;
                            const years = (Date.now() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                            return sum + Math.max(0, years);
                          }, 0) / employees.length).toFixed(1)
                        : 0} yrs
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading employees...</p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Employee
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Department
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Designation
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Contact
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Attendance
                        </th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {employees.map((employee) => (
                        <tr key={employee._id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                    {employee.personalInfo?.firstName?.charAt(0) || 'E'}
                                </div>
                              </div>
                              <div className="ml-4">
                                  <div className="font-medium text-gray-900">{`${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim()}</div>
                                <div className="text-gray-500">{employee.employeeCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {(employee.employmentDetails?.department || 'N/A').replace(/_/g, ' ')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {employee.employmentDetails?.designation || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>{employee.personalInfo?.email}</div>
                            <div className="text-xs">{employee.personalInfo?.contactNumber}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-xs">
                              <div className="text-green-600">Present: {employee.attendance?.totalPresent || 0}</div>
                              <div className="text-red-600">Absent: {employee.attendance?.totalAbsent || 0}</div>
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleMarkAttendance(employee._id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Mark Attendance
                            </button>
                            <button
                              onClick={() => setSelectedEmployee(employee)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAddModal(false)}></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Employee</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input type="text" value={newEmployee.fullName}
                      onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="tel" value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <select value={newEmployee.department}
                        onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                      <select value={newEmployee.employmentType}
                        onChange={(e) => setNewEmployee({...newEmployee, employmentType: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        {employmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <input type="text" value={newEmployee.designation}
                      onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={handleAddEmployee}
                    disabled={!newEmployee.fullName}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    Add Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedEmployee && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedEmployee(null)}></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Employee Details</h3>
                    <p className="text-sm text-gray-500">{selectedEmployee.employeeCode}</p>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{`${selectedEmployee.personalInfo?.firstName || ''} ${selectedEmployee.personalInfo?.lastName || ''}`.trim() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.employmentDetails?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Designation</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.employmentDetails?.designation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Employment Type</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.employmentDetails?.employmentType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.personalInfo?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.personalInfo?.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Join Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedEmployee.employmentDetails?.joinDate ? new Date(selectedEmployee.employmentDetails.joinDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Attendance Summary</p>
                    <p className="font-medium text-gray-900">
                      Present: {selectedEmployee.attendance?.totalPresent || 0}, Absent: {selectedEmployee.attendance?.totalAbsent || 0}, Leave: {selectedEmployee.attendance?.totalLeave || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
