import React, { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, Modal, Input, Select, Textarea, LoadingSpinner, EmptyState, Pagination } from '../components/common';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, pagination.currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getCustomers({ 
        search: searchTerm,
        page: pagination.currentPage,
        limit: 10 
      });
      setCustomers(response.data.data || []);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersAPI.deleteCustomer(id);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customer master data and relationships</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <Input
            placeholder="Search by name, code, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={UserIcon}
              title="No customers"
              description="Start by adding your first customer"
              action={<Button onClick={handleCreate}>Add Customer</Button>}
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Customer</Th>
                    <Th>Contact</Th>
                    <Th>Credit Limit</Th>
                    <Th>Outstanding</Th>
                    <Th>Payment Terms</Th>
                    <Th>Rating</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <Td>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.customerCode}</div>
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <div className="text-sm">{customer.contactPerson?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{customer.contactPerson?.email || customer.email}</div>
                          <div className="text-xs text-gray-500">{customer.contactPerson?.phone || customer.phone}</div>
                        </div>
                      </Td>
                      <Td>₹{customer.creditLimit?.toLocaleString() || 0}</Td>
                      <Td>
                        <span className={customer.outstandingBalance > customer.creditLimit ? 'text-red-600 font-medium' : ''}>
                          ₹{customer.outstandingBalance?.toLocaleString() || 0}
                        </span>
                      </Td>
                      <Td>{customer.paymentTerms} days</Td>
                      <Td>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          {customer.rating || 0}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer._id)}
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
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination({ ...pagination, currentPage: page })}
              />
            </>
          )}
        </CardBody>
      </Card>

      {/* Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
};

const CustomerModal = ({ customer, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    contactPerson: customer?.contactPerson || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    gstNo: customer?.gstNo || '',
    creditLimit: customer?.creditLimit || '',
    paymentTerms: customer?.paymentTerms || 30
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer) {
        await customersAPI.updateCustomer(customer._id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customersAPI.createCustomer(formData);
        toast.success('Customer created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={customer ? 'Edit Customer' : 'New Customer'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Company Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact Person"
            required
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="GST Number"
            value={formData.gstNo}
            onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
          />
        </div>

        <Textarea
          label="Address"
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="State"
            required
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
          <Input
            label="Pincode"
            required
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Credit Limit (₹)"
            type="number"
            required
            value={formData.creditLimit}
            onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
          />
          <Input
            label="Payment Terms (Days)"
            type="number"
            required
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Customers;
