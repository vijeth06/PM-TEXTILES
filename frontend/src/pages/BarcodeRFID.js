import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../services/api';
import BarcodeScanner from '../components/BarcodeScanner';
import { QrCodeIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function BarcodeRFID() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const lookup = async (code) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await inventoryAPI.lookupBatch(code.trim());
      const item = res.data.data || res.data;
      setResult(item);
      setHistory(prev => [{ code: code.trim(), item, timestamp: new Date() }, ...prev.slice(0, 9)]);
      toast.success('Item found');
    } catch (err) {
      const msg = err.response?.data?.message || 'Item not found';
      toast.error(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (code) => {
    setScannerOpen(false);
    setManualCode(code);
    lookup(code);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    lookup(manualCode);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Barcode / RFID Tracking</h1>
        <p className="mt-2 text-sm text-gray-700">Scan barcodes or QR codes to instantly look up inventory items and batch details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Camera Scan */}
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <QrCodeIcon className="h-12 w-12 mx-auto text-indigo-500 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">Camera Scan</h3>
            <p className="text-sm text-gray-500 mb-4">Use your device camera to scan a barcode or QR code</p>
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <QrCodeIcon className="h-5 w-5" />
              Open Scanner
            </button>
          </div>

          {/* Manual Entry */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Manual Entry</h3>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Enter barcode / batch code..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <MagnifyingGlassIcon className="h-4 w-4" />}
              </button>
            </form>
          </div>

          {/* Scan History */}
          {history.length > 0 && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Scans</h3>
              <ul className="space-y-1">
                {history.map((entry, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-xs text-gray-600 py-1 border-b last:border-0 cursor-pointer hover:text-indigo-600"
                    onClick={() => { setManualCode(entry.code); setResult(entry.item); }}
                  >
                    <span className="font-mono">{entry.code}</span>
                    <span className="text-gray-400">{entry.timestamp.toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
              <p className="mt-2 text-sm text-gray-500">Looking up item...</p>
            </div>
          ) : result ? (
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{result.name || result.itemName || result.batchNumber || 'Item Details'}</h2>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${result.quantity <= (result.reorderLevel || 0) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {result.quantity <= (result.reorderLevel || 0) ? 'Low Stock' : 'In Stock'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Item Code / Batch', value: result.itemCode || result.batchNumber || result.lotNumber || '—' },
                  { label: 'Category / Type', value: result.category || result.type || result.itemType || '—' },
                  { label: 'Current Quantity', value: result.quantity !== undefined ? `${result.quantity} ${result.unit || ''}` : '—' },
                  { label: 'Reorder Level', value: result.reorderLevel !== undefined ? `${result.reorderLevel} ${result.unit || ''}` : '—' },
                  { label: 'Location / Warehouse', value: result.location || result.warehouse || result.storageLocation || '—' },
                  { label: 'Supplier', value: result.supplier?.name || result.supplierName || '—' },
                  { label: 'Last Updated', value: result.updatedAt ? new Date(result.updatedAt).toLocaleString() : '—' },
                  { label: 'Expiry Date', value: result.expiryDate ? new Date(result.expiryDate).toLocaleDateString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {result.description && (
                <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  {result.description}
                </div>
              )}

              {/* Movement history if present */}
              {result.movements && result.movements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Movements</h4>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border text-xs">Date</th>
                        <th className="text-left p-2 border text-xs">Type</th>
                        <th className="text-right p-2 border text-xs">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.movements.slice(0, 5).map((m, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 border text-xs">{new Date(m.date || m.timestamp).toLocaleDateString()}</td>
                          <td className="p-2 border text-xs capitalize">{m.type}</td>
                          <td className={`p-2 border text-xs text-right font-medium ${m.type === 'issue' ? 'text-red-600' : 'text-green-600'}`}>{m.type === 'issue' ? '-' : '+'}{m.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center text-gray-400">
              <QrCodeIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-base font-medium">No item scanned yet</p>
              <p className="text-sm mt-1">Use the camera scanner or enter a barcode/batch code manually</p>
            </div>
          )}
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
