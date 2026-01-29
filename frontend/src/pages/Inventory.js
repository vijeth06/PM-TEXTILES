import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useInventoryUpdates } from '../hooks/useRealTimeUpdates';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, AdjustmentsHorizontalIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, Modal, Input, Select, LoadingSpinner, EmptyState, Alert, Pagination } from '../components/common';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({ itemType: '', status: '', location: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Real-time inventory updates
  useInventoryUpdates((data) => {
    console.log('Real-time inventory update received:', data);
    // Refresh inventory when updates occur
    fetchInventory();
    
    // Show toast notification based on update type
    if (data.type === 'material_received') {
      toast.success(`Material received: ${data.itemCode} (${data.quantity})`);
    } else if (data.type === 'material_issued') {
      toast.info(`Material issued: ${data.itemCode} (${data.quantity})`);
    } else if (data.type === 'inventory_adjusted') {
      toast.info(`Inventory adjusted: ${data.itemCode}`);
    }
    
    // Update alerts if present
    if (data.alerts) {
      setAlerts(data.alerts);
    }
  });

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, [filters, pagination.currentPage]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getInventory({ 
        ...filters, 
        page: pagination.currentPage,
        limit: 10 
      });
      setInventory(response.data.data);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1
      });
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await inventoryAPI.getAlerts();
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch alerts');
    }
  };

  const handleIssue = (item) => {
    setSelectedItem(item);
    setModalType('issue');
    setShowModal(true);
  };

  const handleReceive = () => {
    setSelectedItem(null);
    setModalType('receive');
    setShowModal(true);
  };

  const handleAdjust = (item) => {
    setSelectedItem(item);
    setModalType('adjust');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: 'success',
      reserved: 'warning',
      quarantine: 'danger',
      expired: 'danger',
      scrapped: 'default'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage stock levels with FIFO</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleReceive} variant="success" className="flex items-center">
            <ArrowDownIcon className="h-5 w-5 mr-2" />
            Receive Material
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert
          type="warning"
          message={
            <div>
              <div className="font-medium flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                {alerts.length} Item(s) Need Reordering
              </div>
              <div className="text-sm mt-2">
                {alerts.slice(0, 3).map((alert, idx) => (
                  <div key={idx}>{alert.itemName} - Available: {alert.availableQty} (Reorder at: {alert.reorderPoint})</div>
                ))}
              </div>
            </div>
          }
        />
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Item Type"
              value={filters.itemType}
              onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="RawMaterial">Raw Material</option>
              <option value="SemiFinishedGood">Semi-Finished Good</option>
              <option value="FinishedGood">Finished Good</option>
            </Select>

            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="quarantine">Quarantine</option>
              <option value="expired">Expired</option>
            </Select>

            <Input
              label="Location"
              placeholder="e.g., Main Warehouse"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ itemType: '', status: '', location: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : inventory.length === 0 ? (
            <EmptyState
              icon={PlusIcon}
              title="No inventory items"
              description="Start by receiving materials from suppliers"
              action={<Button onClick={handleReceive}>Receive Material</Button>}
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Item</Th>
                    <Th>Type</Th>
                    <Th>Batch No</Th>
                    <Th>On Hand</Th>
                    <Th>Reserved</Th>
                    <Th>Available</Th>
                    <Th>Location</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {inventory.map((item) => (
                    <tr key={item._id}>
                      <Td>
                        <div>
                          <div className="font-medium">{item.itemName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{item.sku || item.itemCode}</div>
                        </div>
                      </Td>
                      <Td>{item.itemType || 'N/A'}</Td>
                      <Td><span className="font-mono text-xs">{item.batchNo}</span></Td>
                      <Td>{item.quantityOnHand} {item.uom}</Td>
                      <Td>{item.quantityReserved} {item.uom}</Td>
                      <Td>
                        <span className={item.quantityAvailable < 100 ? 'text-red-600 font-medium' : ''}>
                          {item.quantityAvailable} {item.uom}
                        </span>
                      </Td>
                      <Td>
                        <div className="text-sm">
                          <div>{item.location?.warehouse || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{item.location?.zone}</div>
                        </div>
                      </Td>
                      <Td>{getStatusBadge(item.status)}</Td>
                      <Td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleIssue(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Issue Material"
                            disabled={item.quantityAvailable <= 0}
                          >
                            <ArrowUpIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleAdjust(item)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Adjust Inventory"
                          >
                            <AdjustmentsHorizontalIcon className="h-5 w-5" />
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
      {showModal && modalType === 'issue' && (
        <IssueMaterialModal
          item={selectedItem}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchInventory();
          }}
        />
      )}
      {showModal && modalType === 'receive' && (
        <ReceiveMaterialModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchInventory();
          }}
        />
      )}
      {showModal && modalType === 'adjust' && (
        <AdjustInventoryModal
          item={selectedItem}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
};

const IssueMaterialModal = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemId: item._id,
    quantity: '',
    purpose: 'production',
    issuedTo: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await inventoryAPI.issueMaterial(formData);
      toast.success('Material issued successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to issue material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Issue Material (FIFO)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-800">
            <strong>Available:</strong> {item.quantityAvailable} {item.uom} | <strong>Batch:</strong> {item.batchNo}
          </p>
        </div>

        <Input
          label="Quantity to Issue"
          type="number"
          required
          max={item.quantityAvailable}
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
        />

        <Select
          label="Purpose"
          required
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        >
          <option value="production">Production</option>
          <option value="maintenance">Maintenance</option>
          <option value="quality_testing">Quality Testing</option>
          <option value="other">Other</option>
        </Select>

        <Input
          label="Issued To"
          required
          placeholder="e.g., Production Manager"
          value={formData.issuedTo}
          onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
        />

        <Input
          label="Remarks"
          placeholder="Optional notes"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Issuing...' : 'Issue Material'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ReceiveMaterialModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemType: 'RawMaterial',
    itemCode: '',
    itemName: '',
    batchNo: '',
    quantity: '',
    uom: 'kg',
    location: {
      warehouse: 'Main Warehouse',
      zone: 'A',
      row: '1',
      rack: '1'
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await inventoryAPI.receiveMaterial(formData);
      toast.success('Material received successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to receive material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Receive Material" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Item Type"
          required
          value={formData.itemType}
          onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
        >
          <option value="RawMaterial">Raw Material</option>
          <option value="SemiFinishedGood">Semi-Finished Good</option>
          <option value="FinishedGood">Finished Good</option>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Item Code"
            required
            value={formData.itemCode}
            onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
          />
          <Input
            label="Item Name"
            required
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Batch No"
            required
            value={formData.batchNo}
            onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
          />
          <Input
            label="Quantity"
            type="number"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
          <Select
            label="UOM"
            required
            value={formData.uom}
            onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
          >
            <option value="kg">Kilograms</option>
            <option value="mtr">Meters</option>
            <option value="pcs">Pieces</option>
          </Select>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Warehouse"
            value={formData.location.warehouse}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location, warehouse: e.target.value }
            })}
          />
          <Input
            label="Zone"
            value={formData.location.zone}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location, zone: e.target.value }
            })}
          />
          <Input
            label="Row"
            value={formData.location.row}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location, row: e.target.value }
            })}
          />
          <Input
            label="Rack"
            value={formData.location.rack}
            onChange={(e) => setFormData({
              ...formData,
              location: { ...formData.location, rack: e.target.value }
            })}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Receiving...' : 'Receive Material'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const AdjustInventoryModal = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    adjustmentType: 'add',
    quantity: '',
    reason: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await inventoryAPI.adjustInventory(item._id, formData);
      toast.success('Inventory adjusted successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Adjust Inventory">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-800">
            <strong>Current Stock:</strong> {item.quantityOnHand} {item.uom}
          </p>
        </div>

        <Select
          label="Adjustment Type"
          required
          value={formData.adjustmentType}
          onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
        >
          <option value="add">Add Stock</option>
          <option value="remove">Remove Stock</option>
        </Select>

        <Input
          label="Quantity"
          type="number"
          required
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
        />

        <Select
          label="Reason"
          required
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        >
          <option value="">Select reason</option>
          <option value="physical_count">Physical Count Adjustment</option>
          <option value="damage">Damaged Stock</option>
          <option value="return">Return from Production</option>
          <option value="correction">Data Correction</option>
          <option value="other">Other</option>
        </Select>

        <Input
          label="Remarks"
          required
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adjusting...' : 'Adjust Inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Inventory;
