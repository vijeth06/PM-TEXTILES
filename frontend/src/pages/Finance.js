import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BanknotesIcon, DocumentTextIcon, ShoppingBagIcon, ChartPieIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { inventoryAPI, itemsAPI, suppliersAPI, ordersAPI, paymentsAPI } from '../services/api';
import { 
  Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, 
  Modal, Input, Select, Textarea, LoadingSpinner 
} from '../components/common';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('invoices');

  const tabs = [
    { id: 'invoices', name: 'Invoices', icon: DocumentTextIcon },
    { id: 'payments', name: 'Payments', icon: BanknotesIcon },
    { id: 'purchases', name: 'Purchase Orders', icon: ShoppingBagIcon },
    { id: 'reports', name: 'Financial Reports', icon: ChartPieIcon }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
        <p className="text-gray-600 mt-1">Manage invoices, payments, and financial reports</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
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
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'purchases' && <PurchaseOrdersTab />}
        {activeTab === 'reports' && <FinancialReportsTab />}
      </div>
    </div>
  );
};

const InvoicesTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, paid: 0, outstanding: 0 });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrders({ limit: 100 });
      const orderData = response.data.data || [];
      setOrders(orderData);
      const total = orderData.reduce((sum, o) => sum + (o.totalValue || 0), 0);
      const paid = orderData.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
      setSummary({ total, paid, outstanding: total - paid, count: orderData.length });
    } catch (error) {
      toast.error('Failed to fetch invoice data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { paid: 'success', partial: 'warning', unpaid: 'default', overdue: 'danger' };
    return <Badge variant={variants[status] || 'default'}>{(status || 'unpaid').toUpperCase()}</Badge>;
  };

  if (loading) return <div className="py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 mr-6">
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">{summary.count}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-2xl font-bold text-blue-900">₹{summary.total.toLocaleString()}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Advance Received</div>
              <div className="text-2xl font-bold text-green-900">₹{summary.paid.toLocaleString()}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-red-900">₹{summary.outstanding.toLocaleString()}</div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>Order No</Th>
                <Th>Customer</Th>
                <Th>Order Date</Th>
                <Th>Promise Date</Th>
                <Th>Total Value</Th>
                <Th>Advance</Th>
                <Th>Balance</Th>
                <Th>Payment Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <Td className="font-medium">{order.orderNo}</Td>
                  <Td>{order.customerId?.name || order.customerName}</Td>
                  <Td>{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</Td>
                  <Td>{order.promiseDate ? new Date(order.promiseDate).toLocaleDateString() : '-'}</Td>
                  <Td className="font-medium">₹{(order.totalValue || 0).toLocaleString()}</Td>
                  <Td className="text-green-600">₹{(order.advanceAmount || 0).toLocaleString()}</Td>
                  <Td className="text-red-600">₹{(order.balanceAmount || (order.totalValue - (order.advanceAmount || 0))).toLocaleString()}</Td>
                  <Td>{getStatusBadge(order.paymentStatus)}</Td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><Td colSpan={8} className="text-center text-gray-500 py-8">No orders found</Td></tr>
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getPayments();
      setPayments(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getOrders({ limit: 100 });
      setOrders(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const handleRecordPayment = () => {
    fetchOrders();
    setShowModal(true);
  };

  if (loading) return <div className="py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-6">
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Payments</div>
              <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Amount Received</div>
              <div className="text-2xl font-bold text-green-900">
                ₹{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Completed Payments</div>
              <div className="text-2xl font-bold text-blue-900">
                {payments.filter(p => p.status === 'completed').length}
              </div>
            </CardBody>
          </Card>
        </div>
        <Button onClick={handleRecordPayment} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Payment Date</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Reference</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <Td className="font-medium">{payment.order?.orderNo || '-'}</Td>
                  <Td>{payment.order?.customerId?.name || payment.order?.customerName || '-'}</Td>
                  <Td>{new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</Td>
                  <Td className="font-medium text-green-600">₹{(payment.amount || 0).toLocaleString()}</Td>
                  <Td className="capitalize">{(payment.paymentMethod || '-').replace(/_/g, ' ')}</Td>
                  <Td>{payment.transactionId || payment.reference || '-'}</Td>
                  <Td>
                    <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                      {(payment.status || 'pending').toUpperCase()}
                    </Badge>
                  </Td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><Td colSpan={7} className="text-center text-gray-500 py-8">No payments recorded yet</Td></tr>
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {showModal && (
        <RecordPaymentModal
          orders={orders}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPayments();
          }}
        />
      )}
    </>
  );
};

const RecordPaymentModal = ({ orders, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    order: '',
    amount: '',
    paymentMethod: 'bank_transfer',
    transactionId: '',
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.order || !formData.amount) {
      toast.error('Order and amount are required');
      return;
    }
    setLoading(true);
    try {
      await paymentsAPI.createPayment({
        ...formData,
        amount: Number(formData.amount)
      });
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedOrder = orders.find(o => o._id === formData.order);

  return (
    <Modal isOpen={true} onClose={onClose} title="Record Payment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Order"
          required
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: e.target.value })}
        >
          <option value="">Select Order</option>
          {orders.map(order => (
            <option key={order._id} value={order._id}>
              {order.orderNo} - {order.customerName || order.customerId?.name} (₹{order.totalValue?.toLocaleString()})
            </option>
          ))}
        </Select>

        {selectedOrder && (
          <div className="bg-blue-50 p-3 rounded text-sm">
            <p><strong>Order Value:</strong> ₹{selectedOrder.totalValue?.toLocaleString()}</p>
            <p><strong>Balance:</strong> ₹{(selectedOrder.balanceAmount || selectedOrder.totalValue - (selectedOrder.advanceAmount || 0))?.toLocaleString()}</p>
            <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus || 'unpaid'}</p>
          </div>
        )}

        <Input
          label="Amount (₹)"
          type="number"
          required
          min="1"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />

        <Select
          label="Payment Method"
          required
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Credit / Debit Card</option>
          <option value="credit">Credit (Post-pay)</option>
        </Select>

        <Input
          label="Transaction ID / Reference"
          value={formData.transactionId}
          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const PurchaseOrdersTab = () => {
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const [createForm, setCreateForm] = useState({
    supplierId: '',
    category: 'yarn',
    expectedDeliveryDate: '',
    items: [
      { materialId: '', quantity: '', uom: 'kg', ratePerUnit: '', taxPercent: 0, description: '' }
    ],
    remarks: ''
  });

  const [receiveForm, setReceiveForm] = useState({
    receiveDate: '',
    invoiceNo: '',
    remarks: '',
    warehouse: 'Main Warehouse',
    rack: '',
    bin: '',
    items: []
  });

  const computeTotals = useCallback((items) => {
    const normalized = items.map((it) => {
      const quantity = Number(it.quantity || 0);
      const ratePerUnit = Number(it.ratePerUnit || 0);
      const taxPercent = Number(it.taxPercent || 0);

      const lineSubTotal = quantity * ratePerUnit;
      const lineTax = (lineSubTotal * taxPercent) / 100;
      const totalAmount = lineSubTotal + lineTax;

      return {
        ...it,
        quantity,
        ratePerUnit,
        taxPercent,
        totalAmount
      };
    });

    const subTotal = normalized.reduce((sum, it) => sum + (it.quantity * it.ratePerUnit), 0);
    const taxAmount = normalized.reduce((sum, it) => sum + ((it.quantity * it.ratePerUnit * it.taxPercent) / 100), 0);
    const totalAmount = subTotal + taxAmount;

    return { normalized, subTotal, taxAmount, totalAmount };
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getPurchaseOrders({ page: 1, limit: 50 });
      setPurchaseOrders(res.data.data || []);
    } catch (e) {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await suppliersAPI.getSuppliers({ page: 1, limit: 200 });
      setSuppliers(res.data.data || []);
    } catch (e) {
      toast.error('Failed to fetch suppliers');
    }
  }, []);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const res = await itemsAPI.getItems({ type: 'RawMaterial', page: 1, limit: 500 });
      setRawMaterials(res.data.data || []);
    } catch (e) {
      toast.error('Failed to fetch raw materials');
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchRawMaterials();
  }, [fetchPurchaseOrders, fetchSuppliers, fetchRawMaterials]);

  const supplierById = useMemo(() => {
    const map = new Map();
    for (const s of suppliers) map.set(String(s._id), s);
    return map;
  }, [suppliers]);

  const rawMaterialById = useMemo(() => {
    const map = new Map();
    for (const m of rawMaterials) map.set(String(m._id), m);
    return map;
  }, [rawMaterials]);

  const getStatusBadge = (status) => {
    const map = {
      draft: 'default',
      sent: 'info',
      confirmed: 'warning',
      partial: 'warning',
      received: 'success',
      cancelled: 'danger'
    };
    const variant = map[status] || 'default';
    return <Badge variant={variant}>{String(status || '').toUpperCase()}</Badge>;
  };

  const openCreate = () => {
    setCreateForm({
      supplierId: '',
      category: 'yarn',
      expectedDeliveryDate: '',
      items: [{ materialId: '', quantity: '', uom: 'kg', ratePerUnit: '', taxPercent: 0, description: '' }],
      remarks: ''
    });
    setShowCreateModal(true);
  };

  const addCreateItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { materialId: '', quantity: '', uom: 'kg', ratePerUnit: '', taxPercent: 0, description: '' }]
    }));
  };

  const updateCreateItem = (idx, patch) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    }));
  };

  const createPurchaseOrder = async () => {
    try {
      if (!createForm.supplierId) return toast.error('Supplier is required');
      if (!createForm.expectedDeliveryDate) return toast.error('Expected delivery date is required');

      const { normalized, subTotal, taxAmount, totalAmount } = computeTotals(createForm.items);

      for (const it of normalized) {
        if (!it.materialId) return toast.error('Select a raw material for each item');
        if (!it.quantity || it.quantity <= 0) return toast.error('Quantity must be > 0');
        if (!it.uom) return toast.error('UOM is required');
        if (it.ratePerUnit < 0) return toast.error('Rate must be valid');
      }

      const itemsPayload = normalized.map((it) => {
        const m = rawMaterialById.get(String(it.materialId));
        return {
          materialId: it.materialId,
          materialCode: m?.code || m?.itemCode || m?.materialCode || '',
          materialName: m?.name || m?.itemName || m?.materialName || 'Raw Material',
          description: it.description || '',
          quantity: it.quantity,
          uom: it.uom,
          ratePerUnit: it.ratePerUnit,
          taxPercent: it.taxPercent,
          totalAmount: it.totalAmount
        };
      });

      await inventoryAPI.createPurchaseOrder({
        supplierId: createForm.supplierId,
        category: createForm.category,
        expectedDeliveryDate: createForm.expectedDeliveryDate,
        items: itemsPayload,
        subTotal,
        taxAmount,
        otherCharges: 0,
        totalAmount,
        remarks: createForm.remarks
      });

      toast.success('Purchase order created');
      setShowCreateModal(false);
      fetchPurchaseOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const openReceive = (po) => {
    setSelectedPO(po);
    setReceiveForm({
      receiveDate: '',
      invoiceNo: '',
      remarks: '',
      warehouse: 'Main Warehouse',
      rack: '',
      bin: '',
      items: (po.items || []).map((it) => ({
        itemId: it._id,
        materialName: it.materialName,
        pendingQuantity: Math.max(0, Number(it.quantity || 0) - Number(it.receivedQuantity || 0)),
        quantity: 0,
        batchNo: '',
        barcode: '',
        qualityStatus: 'approved'
      }))
    });
    setShowReceiveModal(true);
  };

  const updateReceiveItem = (idx, patch) => {
    setReceiveForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    }));
  };

  const receiveMaterials = async () => {
    try {
      if (!selectedPO?._id) return;

      const payloadItems = receiveForm.items
        .map((it) => ({
          itemId: it.itemId,
          quantity: Number(it.quantity || 0),
          batchNo: it.batchNo || undefined,
          barcode: it.barcode || undefined,
          qualityStatus: it.qualityStatus || 'approved'
        }))
        .filter((it) => it.quantity > 0);

      if (payloadItems.length === 0) return toast.error('Enter received quantity for at least one item');

      await inventoryAPI.receiveMaterials(selectedPO._id, {
        items: payloadItems,
        receiveDate: receiveForm.receiveDate || undefined,
        invoiceNo: receiveForm.invoiceNo || undefined,
        remarks: receiveForm.remarks || undefined,
        warehouse: receiveForm.warehouse,
        rack: receiveForm.rack,
        bin: receiveForm.bin
      });

      toast.success('Materials received and inventory updated');
      setShowReceiveModal(false);
      setSelectedPO(null);
      fetchPurchaseOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to receive materials');
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button className="flex items-center" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>PO No</Th>
                  <Th>Supplier</Th>
                  <Th>PO Date</Th>
                  <Th>Expected Delivery</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <Td className="font-medium">{po.poNumber}</Td>
                    <Td>{po.supplierName || supplierById.get(String(po.supplierId?._id || po.supplierId))?.name || '-'}</Td>
                    <Td>{po.poDate ? new Date(po.poDate).toLocaleDateString() : '-'}</Td>
                    <Td>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '-'}</Td>
                    <Td className="font-medium">₹{Number(po.totalAmount || 0).toLocaleString()}</Td>
                    <Td>{getStatusBadge(po.status)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openReceive(po)} disabled={po.status === 'cancelled' || po.status === 'received'}>
                          Receive
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create PO */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Purchase Order"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Supplier"
              value={createForm.supplierId}
              onChange={(e) => setCreateForm((p) => ({ ...p, supplierId: e.target.value }))}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </Select>

            <Select
              label="Category"
              value={createForm.category}
              onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="yarn">Yarn</option>
              <option value="dye">Dye</option>
              <option value="chemical">Chemical</option>
              <option value="machinery">Machinery</option>
              <option value="consumables">Consumables</option>
              <option value="other">Other</option>
            </Select>

            <Input
              label="Expected Delivery"
              type="date"
              value={createForm.expectedDeliveryDate}
              onChange={(e) => setCreateForm((p) => ({ ...p, expectedDeliveryDate: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-medium text-gray-900">Items</div>
              <Button variant="outline" size="sm" onClick={addCreateItem}>Add Item</Button>
            </div>

            {createForm.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <Select
                  label="Raw Material"
                  value={it.materialId}
                  onChange={(e) => updateCreateItem(idx, { materialId: e.target.value })}
                >
                  <option value="">Select</option>
                  {rawMaterials.map((m) => (
                    <option key={m._id} value={m._id}>{m.name || m.itemName || m.code || m.itemCode}</option>
                  ))}
                </Select>

                <Input
                  label="Qty"
                  type="number"
                  value={it.quantity}
                  onChange={(e) => updateCreateItem(idx, { quantity: e.target.value })}
                />

                <Select
                  label="UOM"
                  value={it.uom}
                  onChange={(e) => updateCreateItem(idx, { uom: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="ltr">ltr</option>
                  <option value="mtr">mtr</option>
                  <option value="pcs">pcs</option>
                  <option value="roll">roll</option>
                </Select>

                <Input
                  label="Rate"
                  type="number"
                  value={it.ratePerUnit}
                  onChange={(e) => updateCreateItem(idx, { ratePerUnit: e.target.value })}
                />

                <Input
                  label="Tax %"
                  type="number"
                  value={it.taxPercent}
                  onChange={(e) => updateCreateItem(idx, { taxPercent: e.target.value })}
                />

                <Input
                  label="Description"
                  value={it.description}
                  onChange={(e) => updateCreateItem(idx, { description: e.target.value })}
                />
              </div>
            ))}
          </div>

          <Textarea
            label="Remarks"
            value={createForm.remarks}
            onChange={(e) => setCreateForm((p) => ({ ...p, remarks: e.target.value }))}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={createPurchaseOrder}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Receive PO */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title={selectedPO ? `Receive Materials - ${selectedPO.poNumber}` : 'Receive Materials'}
        size="lg"
      >
        {!selectedPO ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Receive Date"
                type="date"
                value={receiveForm.receiveDate}
                onChange={(e) => setReceiveForm((p) => ({ ...p, receiveDate: e.target.value }))}
              />
              <Input
                label="Invoice/GRN No"
                value={receiveForm.invoiceNo}
                onChange={(e) => setReceiveForm((p) => ({ ...p, invoiceNo: e.target.value }))}
              />
              <Input
                label="Warehouse"
                value={receiveForm.warehouse}
                onChange={(e) => setReceiveForm((p) => ({ ...p, warehouse: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Rack"
                value={receiveForm.rack}
                onChange={(e) => setReceiveForm((p) => ({ ...p, rack: e.target.value }))}
              />
              <Input
                label="Bin"
                value={receiveForm.bin}
                onChange={(e) => setReceiveForm((p) => ({ ...p, bin: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <div className="font-medium text-gray-900">Items to receive</div>
              {receiveForm.items.map((it, idx) => (
                <div key={it.itemId} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <Input label="Material" value={it.materialName} disabled />
                  <Input label="Pending" value={it.pendingQuantity} disabled />
                  <Input
                    label="Receive Qty"
                    type="number"
                    value={it.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value || 0);
                      const safe = Math.min(Math.max(0, val), Number(it.pendingQuantity || 0));
                      updateReceiveItem(idx, { quantity: safe });
                    }}
                  />
                  <Input label="Batch No (optional)" value={it.batchNo} onChange={(e) => updateReceiveItem(idx, { batchNo: e.target.value })} />
                  <Input label="Barcode (optional)" value={it.barcode} onChange={(e) => updateReceiveItem(idx, { barcode: e.target.value })} />
                  <Select label="Quality" value={it.qualityStatus} onChange={(e) => updateReceiveItem(idx, { qualityStatus: e.target.value })}>
                    <option value="approved">approved</option>
                    <option value="pending">pending</option>
                    <option value="rejected">rejected</option>
                  </Select>
                </div>
              ))}
            </div>

            <Textarea
              label="Remarks"
              value={receiveForm.remarks}
              onChange={(e) => setReceiveForm((p) => ({ ...p, remarks: e.target.value }))}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReceiveModal(false)}>Cancel</Button>
              <Button onClick={receiveMaterials}>Receive</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

const FinancialReportsTab = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reports = [
    { value: 'pl', label: 'Profit & Loss Summary' },
    { value: 'ar_aging', label: 'Accounts Receivable (Order Payments)' },
    { value: 'inventory_value', label: 'Inventory Valuation' }
  ];

  const generateReport = async () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }
    setLoading(true);
    try {
      let data = {};
      if (reportType === 'pl') {
        const dateParams = {
          ...(dateRange.from && { startDate: dateRange.from }),
          ...(dateRange.to && { endDate: dateRange.to })
        };
        const [ordersRes, paymentsRes] = await Promise.all([
          ordersAPI.getOrders({ limit: 500, ...dateParams }),
          paymentsAPI.getPayments({ ...dateParams })
        ]);
        const orders = ordersRes.data.data || [];
        const payments = paymentsRes.data.data || [];
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
        const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        data = { totalRevenue, totalPaymentsReceived, orders: orders.length, payments: payments.length };
      } else if (reportType === 'ar_aging') {
        const response = await ordersAPI.getOrders({
          limit: 500,
          ...(dateRange.from && { startDate: dateRange.from }),
          ...(dateRange.to && { endDate: dateRange.to })
        });
        const orders = response.data.data || [];
        const unpaid = orders.filter(o => o.paymentStatus !== 'paid');
        data = { unpaidOrders: unpaid };
      } else if (reportType === 'inventory_value') {
        const response = await inventoryAPI.getInventory({ limit: 500 });
        data = { inventory: response.data.data || [], totals: response.data.totals || [] };
      }
      setReportData({ type: reportType, ...data });
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Generate Financial Report</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setReportData(null); }}
            >
              <option value="">Select Report</option>
              {reports.map(report => (
                <option key={report.value} value={report.value}>{report.label}</option>
              ))}
            </Select>
            <Input label="From Date" type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
            <Input label="To Date" type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
          </div>
          <div className="mt-4">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {reportData && reportData.type === 'pl' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Summary</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Order Revenue</p>
                  <p className="text-2xl font-bold text-green-700">₹{reportData.totalRevenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{reportData.orders} orders</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Payments Received</p>
                  <p className="text-2xl font-bold text-blue-700">₹{reportData.totalPaymentsReceived?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{reportData.payments} payments</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Outstanding Receivables</span>
                  <span className="font-bold text-red-600">₹{(reportData.totalRevenue - reportData.totalPaymentsReceived).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {reportData && reportData.type === 'ar_aging' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Accounts Receivable</h3>
            <p className="text-sm text-gray-600">{reportData.unpaidOrders?.length || 0} unpaid orders</p>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <Thead>
                <tr>
                  <Th>Order No</Th>
                  <Th>Customer</Th>
                  <Th>Total Value</Th>
                  <Th>Advance</Th>
                  <Th>Balance Due</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {(reportData.unpaidOrders || []).map(order => (
                  <tr key={order._id}>
                    <Td className="font-medium">{order.orderNo}</Td>
                    <Td>{order.customerId?.name || order.customerName}</Td>
                    <Td>₹{(order.totalValue || 0).toLocaleString()}</Td>
                    <Td className="text-green-600">₹{(order.advanceAmount || 0).toLocaleString()}</Td>
                    <Td className="text-red-600 font-medium">₹{((order.totalValue || 0) - (order.advanceAmount || 0)).toLocaleString()}</Td>
                    <Td><Badge variant={order.paymentStatus === 'partial' ? 'warning' : 'default'}>{(order.paymentStatus || 'unpaid').toUpperCase()}</Badge></Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {reportData && reportData.type === 'inventory_value' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Inventory Valuation</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(reportData.totals || []).map((t, i) => (
                <div key={i} className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{t._id || 'Unknown'}</p>
                  <p className="text-xl font-bold text-blue-700">₹{(t.totalValue || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Qty: {(t.totalQty || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default Finance;