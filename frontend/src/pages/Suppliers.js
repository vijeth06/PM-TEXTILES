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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <option value="chemical">Chemicals</option>
              <option value="consumables">Consumables & Packaging</option>
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
                          <div className="text-xs text-gray-500">{supplier.code}</div>
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
                      <Td>{supplier.paymentTerms?.replace(/_/g, ' ') || 'credit'}</Td>
                      <Td>
                        <div className="text-sm">
                          <div>Orders: {supplier.performanceMetrics?.totalOrders || 0}</div>
                          <div className="text-xs text-gray-500">
                            OTD: {supplier.otdPercent || 0}%
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          {supplier.performanceMetrics?.rating || 0}
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
    contactName: supplier?.contactPerson?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    addressLine1: supplier?.address?.line1 || '',
    addressLine2: supplier?.address?.line2 || '',
    city: supplier?.address?.city || '',
    state: supplier?.address?.state || '',
    pincode: supplier?.address?.pincode || '',
    gstin: supplier?.gstin || '',
    creditPeriod: supplier?.creditPeriod || 30,
    paymentTerms: supplier?.paymentTerms || 'credit'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        contactPerson: {
          name: formData.contactName,
          email: formData.email,
          phone: formData.phone
        },
        email: formData.email,
        phone: formData.phone,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India'
        },
        gstin: formData.gstin,
        creditPeriod: Number(formData.creditPeriod || 0),
        paymentTerms: formData.paymentTerms
      };

      if (supplier) {
        await suppliersAPI.updateSupplier(supplier._id, payload);
        toast.success('Supplier updated successfully');
      } else {
        await suppliersAPI.createSupplier(payload);
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
            <option value="chemical">Chemicals</option>
            <option value="consumables">Consumables & Packaging</option>
            <option value="machinery">Machinery & Parts</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact Person"
            required
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
          />
        </div>

        <Textarea
          label="Address Line 1"
          required
          value={formData.addressLine1}
          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
        />

        <Input
          label="Address Line 2"
          value={formData.addressLine2}
          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
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
          value={formData.creditPeriod}
          onChange={(e) => setFormData({ ...formData, creditPeriod: e.target.value })}
        />

        <Select
          label="Payment Mode"
          required
          value={formData.paymentTerms}
          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
        >
          <option value="advance">Advance</option>
          <option value="cod">COD</option>
          <option value="credit">Credit</option>
          <option value="partial_advance">Partial Advance</option>
        </Select>

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
