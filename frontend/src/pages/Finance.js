import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BanknotesIcon, DocumentTextIcon, ShoppingBagIcon, ChartPieIcon,
  PlusIcon, CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline';
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
  const [invoices, setInvoices] = useState([
    {
      _id: '1',
      invoiceNo: 'INV-2026-001',
      customerName: 'ABC Traders',
      invoiceDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
      amount: 125000,
      paidAmount: 75000,
      status: 'partial'
    },
    {
      _id: '2',
      invoiceNo: 'INV-2026-002',
      customerName: 'XYZ Industries',
      invoiceDate: new Date('2026-01-03'),
      dueDate: new Date('2026-02-02'),
      amount: 85000,
      paidAmount: 0,
      status: 'pending'
    }
  ]);
  const [showModal, setShowModal] = useState(false);

  const getStatusBadge = (status) => {
    const variants = {
      paid: 'success',
      partial: 'warning',
      pending: 'default',
      overdue: 'danger'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 mr-6">
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Invoices</div>
              <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-blue-900">
                ₹{invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Paid</div>
              <div className="text-2xl font-bold text-green-900">
                ₹{invoices.reduce((sum, inv) => sum + inv.paidAmount, 0).toLocaleString()}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-red-900">
                ₹{invoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0).toLocaleString()}
              </div>
            </CardBody>
          </Card>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>Invoice No</Th>
                <Th>Customer</Th>
                <Th>Invoice Date</Th>
                <Th>Due Date</Th>
                <Th>Amount</Th>
                <Th>Paid</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <Td className="font-medium">{invoice.invoiceNo}</Td>
                  <Td>{invoice.customerName}</Td>
                  <Td>{invoice.invoiceDate.toLocaleDateString()}</Td>
                  <Td>{invoice.dueDate.toLocaleDateString()}</Td>
                  <Td className="font-medium">₹{invoice.amount.toLocaleString()}</Td>
                  <Td className="text-green-600">₹{invoice.paidAmount.toLocaleString()}</Td>
                  <Td className="text-red-600">
                    ₹{(invoice.amount - invoice.paidAmount).toLocaleString()}
                  </Td>
                  <Td>{getStatusBadge(invoice.status)}</Td>
                  <Td>
                    <Button variant="outline" size="sm">View</Button>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {showModal && (
        <InvoiceModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

const InvoiceModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 0, rate: 0, amount: 0 }],
    taxRate: 18,
    notes: ''
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 0, rate: 0, amount: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * formData.taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Invoice created successfully');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Invoice" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          />
          <Input
            label="Invoice Date"
            type="date"
            required
            value={formData.invoiceDate}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
          />
          <Input
            label="Due Date"
            type="date"
            required
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <Input
            label="Tax Rate (%)"
            type="number"
            value={formData.taxRate}
            onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Line Items</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Amount"
                    value={item.amount.toFixed(2)}
                    disabled
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax ({formData.taxRate}%):</span>
            <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Textarea
          label="Notes"
          rows="2"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Invoice</Button>
        </div>
      </form>
    </Modal>
  );
};

const PaymentsTab = () => {
  const [payments] = useState([
    {
      _id: '1',
      paymentNo: 'PAY-001',
      invoiceNo: 'INV-2026-001',
      customerName: 'ABC Traders',
      paymentDate: new Date('2026-01-15'),
      amount: 75000,
      mode: 'bank_transfer',
      status: 'completed'
    }
  ]);

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>Payment No</Th>
                <Th>Invoice No</Th>
                <Th>Customer</Th>
                <Th>Payment Date</Th>
                <Th>Amount</Th>
                <Th>Mode</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <Td className="font-medium">{payment.paymentNo}</Td>
                  <Td>{payment.invoiceNo}</Td>
                  <Td>{payment.customerName}</Td>
                  <Td>{payment.paymentDate.toLocaleDateString()}</Td>
                  <Td className="font-medium text-green-600">₹{payment.amount.toLocaleString()}</Td>
                  <Td className="capitalize">{payment.mode.replace('_', ' ')}</Td>
                  <Td>
                    <Badge variant="success">COMPLETED</Badge>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

const PurchaseOrdersTab = () => {
  const [orders] = useState([
    {
      _id: '1',
      poNo: 'PO-2026-001',
      supplierName: 'Yarn Suppliers Ltd',
      poDate: new Date('2026-01-02'),
      deliveryDate: new Date('2026-01-20'),
      amount: 250000,
      status: 'pending'
    }
  ]);

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <Thead>
              <tr>
                <Th>PO No</Th>
                <Th>Supplier</Th>
                <Th>PO Date</Th>
                <Th>Delivery Date</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <Td className="font-medium">{order.poNo}</Td>
                  <Td>{order.supplierName}</Td>
                  <Td>{order.poDate.toLocaleDateString()}</Td>
                  <Td>{order.deliveryDate.toLocaleDateString()}</Td>
                  <Td className="font-medium">₹{order.amount.toLocaleString()}</Td>
                  <Td>
                    <Badge variant="warning">PENDING</Badge>
                  </Td>
                  <Td>
                    <Button variant="outline" size="sm">View</Button>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

const FinancialReportsTab = () => {
  const [reportType, setReportType] = useState('');

  const reports = [
    { value: 'pl', label: 'Profit & Loss Statement' },
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'cashflow', label: 'Cash Flow Statement' },
    { value: 'ar_aging', label: 'Accounts Receivable Aging' },
    { value: 'ap_aging', label: 'Accounts Payable Aging' }
  ];

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
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="">Select Report</option>
              {reports.map(report => (
                <option key={report.value} value={report.value}>{report.label}</option>
              ))}
            </Select>
            <Input
              label="From Date"
              type="date"
            />
            <Input
              label="To Date"
              type="date"
            />
          </div>
          <div className="mt-4">
            <Button>Generate Report</Button>
          </div>
        </CardBody>
      </Card>

      {reportType === 'pl' && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Statement</h3>
            <p className="text-sm text-gray-600">For the period: January 2026</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Revenue</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales Revenue</span>
                    <span className="font-medium">₹12,50,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Revenue</span>
                    <span className="font-bold">₹12,50,000</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Cost of Goods Sold</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raw Materials</span>
                    <span className="font-medium">₹5,00,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor</span>
                    <span className="font-medium">₹2,00,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total COGS</span>
                    <span className="font-bold">₹7,00,000</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Gross Profit</span>
                  <span className="font-bold text-green-600">₹5,50,000</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Operating Expenses</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salaries</span>
                    <span className="font-medium">₹1,50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilities</span>
                    <span className="font-medium">₹50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maintenance</span>
                    <span className="font-medium">₹30,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Operating Expenses</span>
                    <span className="font-bold">₹2,30,000</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-t-4 border-blue-500">
                <div className="flex justify-between text-xl">
                  <span className="font-bold">Net Profit</span>
                  <span className="font-bold text-blue-600">₹3,20,000</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Profit Margin: 25.6%
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default Finance;