import React, { useState, useEffect } from 'react';
import { suppliersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, Modal, Input, Select, Textarea, LoadingSpinner, EmptyState, Pagination } from '../components/common';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [filters, setFilters] = useState({ category: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  useEffect(() => {
    fetchSuppliers();
  }, [filters, pagination.currentPage]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getSuppliers({ 
        ...filters,
        page: pagination.currentPage,
        limit: 10 
      });
      setSuppliers(response.data.data || []);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await suppliersAPI.deleteSupplier(id);
        toast.success('Supplier deleted successfully');
        fetchSuppliers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete supplier');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-800">Supplier Management</h1>
          <p className="text-gray-600 mt-2 font-medium">Manage supplier relationships and track performance metrics</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Supplier
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="yarn">Yarn Supplier</option>
              <option value="dye">Dye & Chemical Supplier</option>
              <option value="packaging">Packaging Material</option>
              <option value="machinery">Machinery & Parts</option>
              <option value="other">Other</option>
            </Select>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ category: '' })}
                className="w-full border-green-300 text-green-600 hover:bg-green-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={BuildingOfficeIcon}
              title="No suppliers"
              description="Start by adding your first supplier"
              action={<Button onClick={handleCreate}>Add Supplier</Button>}
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Supplier</Th>
                    <Th>Category</Th>
                    <Th>Contact</Th>
                    <Th>Payment Terms</Th>
                    <Th>Performance</Th>
                    <Th>Rating</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <Td>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-xs text-gray-500">{supplier.supplierCode}</div>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant="info">{supplier.category?.toUpperCase()}</Badge>
                      </Td>
                      <Td>
                        <div>
                          <div className="text-sm">{supplier.contactPerson?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{supplier.contactPerson?.email || supplier.email}</div>
                          <div className="text-xs text-gray-500">{supplier.contactPerson?.phone || supplier.phone}</div>
                        </div>
                      </Td>
                      <Td>{supplier.paymentTerms} days</Td>
                      <Td>
                        <div className="text-sm">
                          <div>Orders: {supplier.totalOrders || 0}</div>
                          <div className="text-xs text-gray-500">
                            OTD: {supplier.onTimeDeliveryRate?.toFixed(1) || 0}%
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          {supplier.rating || 0}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier._id)}
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

      {/* Supplier Modal */}
      {showModal && (
        <SupplierModal
          supplier={selectedSupplier}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSuppliers();
          }}
        />
      )}
    </div>
  );
};

const SupplierModal = ({ supplier, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    category: supplier?.category || 'yarn',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    state: supplier?.state || '',
    pincode: supplier?.pincode || '',
    gstNo: supplier?.gstNo || '',
    paymentTerms: supplier?.paymentTerms || 30
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supplier) {
        await suppliersAPI.updateSupplier(supplier._id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await suppliersAPI.createSupplier(formData);
        toast.success('Supplier created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={supplier ? 'Edit Supplier' : 'New Supplier'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="Category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="yarn">Yarn Supplier</option>
            <option value="dye">Dye & Chemical Supplier</option>
            <option value="packaging">Packaging Material</option>
            <option value="machinery">Machinery & Parts</option>
            <option value="other">Other</option>
          </Select>
        </div>

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

        <Input
          label="Payment Terms (Days)"
          type="number"
          required
          value={formData.paymentTerms}
          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : supplier ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Suppliers;
