import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../services/analyticsAPI';
import Layout from '../components/Layout';
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: 'all', status: 'active' });

  const departments = ['Production', 'Quality', 'Maintenance', 'Sales', 'Accounts', 'HR', 'Admin'];
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary'];

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department !== 'all') params.department = filters.department;
      if (filters.status) params.employmentStatus = filters.status;
      const response = await employeesAPI.getEmployees(params);
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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
      window.alert('Attendance marked successfully!');
      fetchEmployees();
    } catch (error) {
      console.error('Error marking attendance:', error);
      window.alert('Failed to mark attendance');
    }
  };

  return (
    <Layout>
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
                <option key={dept} value={dept}>{dept}</option>
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
                      {employees.filter(e => e.employmentDetails?.employmentType === 'Full-time').length}
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Present Today</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {employees.filter(e => e.attendance?.present > 0).length}
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
                        ? (employees.reduce((sum, e) => sum + (e.experience || 0), 0) / employees.length).toFixed(1)
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
                                  {employee.personalInfo?.fullName?.charAt(0) || 'E'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{employee.personalInfo?.fullName}</div>
                                <div className="text-gray-500">{employee.employeeCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {employee.employmentDetails?.department || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {employee.employmentDetails?.designation || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>{employee.personalInfo?.email}</div>
                            <div className="text-xs">{employee.personalInfo?.phone}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-xs">
                              <div className="text-green-600">Present: {employee.attendance?.present || 0}</div>
                              <div className="text-red-600">Absent: {employee.attendance?.absent || 0}</div>
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleMarkAttendance(employee._id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Mark Attendance
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
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
      </div>
    </Layout>
  );
}
