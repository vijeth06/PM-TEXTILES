import React, { useState, useEffect } from 'react';
import { ordersAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useOrderUpdates } from '../hooks/useRealTimeUpdates';
import { PlusIcon, TruckIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, Modal, Input, Select, LoadingSpinner, EmptyState, Pagination } from '../components/common';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Real-time order updates
  useOrderUpdates((data) => {
    console.log('Real-time order update:', data);
    fetchOrders();
    
    // Show appropriate notifications
    if (data.type === 'order_created') {
      toast.success(`New order created: ${data.orderNo}`);
    } else if (data.type === 'order_updated') {
      toast.info(`Order ${data.orderNo} updated`);
    } else if (data.type === 'order_dispatched') {
      toast.success(`Order ${data.orderNo} dispatched`);
    }
  });

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrders({ 
        ...filters, 
        page: pagination.currentPage,
        limit: 10 
      });
      setOrders(response.data.data);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setModalType('create');
    setShowModal(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setModalType('view');
    setShowModal(true);
  };

  const handleDispatch = (order) => {
    setSelectedOrder(order);
    setModalType('dispatch');
    setShowModal(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersAPI.deleteOrder(id);
        toast.success('Order deleted successfully');
        fetchOrders();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'default',
      confirmed: 'info',
      in_production: 'warning',
      packed: 'primary',
      dispatched: 'success',
      delivered: 'success',
      cancelled: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'default',
      normal: 'info',
      high: 'warning',
      urgent: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Track customer orders and dispatch</p>
        </div>
        <Button onClick={handleCreateOrder} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_production">In Production</option>
              <option value="packed">Packed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </Select>

            <Select
              label="Priority"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: '', priority: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={PlusIcon}
              title="No orders"
              description="Start by creating a new customer order"
              action={<Button onClick={handleCreateOrder}>Create Order</Button>}
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Order No</Th>
                    <Th>Customer</Th>
                    <Th>Order Date</Th>
                    <Th>Promise Date</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <Td>
                        <span className="font-medium">{order.orderNo}</span>
                      </Td>
                      <Td>
                        <div>
                          <div className="font-medium">{order.customer?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{order.customerOrderNo}</div>
                        </div>
                      </Td>
                      <Td>{new Date(order.orderDate).toLocaleDateString()}</Td>
                      <Td>
                        <span className={order.isDelayed ? 'text-red-600 font-medium' : ''}>
                          {new Date(order.promiseDate).toLocaleDateString()}
                        </span>
                      </Td>
                      <Td>
                        <div>
                          <div className="font-medium">₹{order.totalAmount?.toLocaleString() || 0}</div>
                          <div className="text-xs text-gray-500">Paid: ₹{order.paidAmount || 0}</div>
                        </div>
                      </Td>
                      <Td>{getStatusBadge(order.status)}</Td>
                      <Td>{getPriorityBadge(order.priority)}</Td>
                      <Td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {order.status === 'packed' && (
                            <button
                              onClick={() => handleDispatch(order)}
                              className="text-green-600 hover:text-green-800"
                              title="Dispatch"
                            >
                              <TruckIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
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

      {/* Modals */}
      {showModal && modalType === 'create' && (
        <CreateOrderModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchOrders();
          }}
        />
      )}
      {showModal && modalType === 'dispatch' && (
        <DispatchModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

const CreateOrderModal = ({ onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer: '',
    customerOrderNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    promiseDate: '',
    priority: 'normal',
    items: [{
      sku: '',
      productName: '',
      orderedQty: '',
      uom: 'kg',
      unitPrice: '',
      discount: 0,
      taxPercent: 18
    }]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getCustomers();
      setCustomers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ordersAPI.createOrder(formData);
      toast.success('Order created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        sku: '',
        productName: '',
        orderedQty: '',
        uom: 'kg',
        unitPrice: '',
        discount: 0,
        taxPercent: 18
      }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create New Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Customer"
            required
            value={formData.customer}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name} ({customer.customerCode})
              </option>
            ))}
          </Select>

          <Input
            label="Customer Order No"
            required
            value={formData.customerOrderNo}
            onChange={(e) => setFormData({ ...formData, customerOrderNo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Order Date"
            type="date"
            required
            value={formData.orderDate}
            onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
          />
          <Input
            label="Promise Date"
            type="date"
            required
            value={formData.promiseDate}
            onChange={(e) => setFormData({ ...formData, promiseDate: e.target.value })}
          />
          <Select
            label="Priority"
            required
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Order Items</h3>
            <Button type="button" size="sm" onClick={addItem}>Add Item</Button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-6 gap-2 mb-2">
              <Input
                placeholder="SKU"
                required
                value={item.sku}
                onChange={(e) => updateItem(index, 'sku', e.target.value)}
              />
              <Input
                placeholder="Product Name"
                required
                value={item.productName}
                onChange={(e) => updateItem(index, 'productName', e.target.value)}
              />
              <Input
                placeholder="Qty"
                type="number"
                required
                value={item.orderedQty}
                onChange={(e) => updateItem(index, 'orderedQty', e.target.value)}
              />
              <Select
                value={item.uom}
                onChange={(e) => updateItem(index, 'uom', e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="mtr">mtr</option>
                <option value="pcs">pcs</option>
              </Select>
              <Input
                placeholder="Price"
                type="number"
                required
                value={item.unitPrice}
                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
              />
              <Input
                placeholder="Disc %"
                type="number"
                value={item.discount}
                onChange={(e) => updateItem(index, 'discount', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const DispatchModal = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    transportMode: 'road',
    carrierName: '',
    vehicleNo: '',
    driverName: '',
    driverContact: '',
    awbNo: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ordersAPI.dispatchOrder(order._id, formData);
      toast.success('Order dispatched successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to dispatch order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Dispatch Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-800">
            <strong>Order No:</strong> {order.orderNo} | <strong>Customer:</strong> {order.customer?.name}
          </p>
        </div>

        <Select
          label="Transport Mode"
          required
          value={formData.transportMode}
          onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
        >
          <option value="road">Road</option>
          <option value="rail">Rail</option>
          <option value="air">Air</option>
          <option value="sea">Sea</option>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Carrier Name"
            required
            value={formData.carrierName}
            onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
          />
          <Input
            label="Vehicle Number"
            required
            value={formData.vehicleNo}
            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Driver Name"
            required
            value={formData.driverName}
            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
          />
          <Input
            label="Driver Contact"
            required
            value={formData.driverContact}
            onChange={(e) => setFormData({ ...formData, driverContact: e.target.value })}
          />
        </div>

        <Input
          label="AWB/LR Number"
          required
          value={formData.awbNo}
          onChange={(e) => setFormData({ ...formData, awbNo: e.target.value })}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Dispatching...' : 'Dispatch Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Orders;
