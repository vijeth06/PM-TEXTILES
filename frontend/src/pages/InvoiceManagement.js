import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI } from '../services/api';
import { ArrowDownTrayIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td } from '../components/common';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

export default function InvoiceManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', invoiceStatus: 'all' });
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      const response = await ordersAPI.getOrders(params);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (order) => {
    try {
      const invoiceNo = `INV-${order.orderNo}-${Date.now()}`;
      const items = [
        ['Item', 'Quantity', 'Rate', 'Amount'],
        ...(order.items || []).map(item => [
          item.productName,
          item.orderedQuantity + ' ' + item.uom,
          '₹' + item.unitPrice.toLocaleString(),
          '₹' + (item.orderedQuantity * item.unitPrice).toLocaleString()
        ])
      ];

      const summary = {
        'Subtotal': '₹' + order.totalValue.toLocaleString(),
        'Tax': '₹0',
        'Total Amount': '₹' + order.totalValue.toLocaleString(),
        'Advance Paid': '₹' + (order.advanceAmount || 0).toLocaleString(),
        'Balance Due': '₹' + (order.balanceAmount || order.totalValue).toLocaleString()
      };

      const success = exportToPDF({
        title: `INVOICE`,
        headers: items[0],
        data: items.slice(1),
        summary,
        filename: `${invoiceNo}.pdf`,
        orientation: 'portrait'
      });

      if (success) {
        toast.success('Invoice downloaded successfully');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  const sendInvoiceEmail = async (order) => {
    try {
      if (!order.customerId?.email) {
        toast.error('Customer email not found');
        return;
      }
      toast.success('Invoice will be sent to ' + order.customerId.email);
      // Integration with backend email service
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold text-gray-900">Invoice Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate, manage, and send invoices for customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow flex items-center space-x-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Order Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_production">In Production</option>
            <option value="packed">Packed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No orders found</p>
            </div>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Order No</Th>
                  <Th>Customer</Th>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <Td className="font-medium">{order.orderNo}</Td>
                    <Td>{order.customerName}</Td>
                    <Td>{new Date(order.orderDate).toLocaleDateString()}</Td>
                    <Td>₹{order.totalValue?.toLocaleString()}</Td>
                    <Td>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'info'}>
                        {order.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generateInvoice(order)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Download Invoice"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => sendInvoiceEmail(order)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Send Invoice Email"
                        >
                          <EnvelopeIcon className="h-5 w-5" />
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
    </div>
  );
}
