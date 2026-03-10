import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Get available cameras on mount
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
      }
    }).catch(err => {
      console.error("Error getting cameras:", err);
    });

    return () => {
      stopScanning();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    try {
      setPermissionError(null);
      setScanning(true); // Set scanning to true first so the element renders
      
      // Wait for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      // Get the camera ID (prefer back camera)
      let cameraId;
      if (cameras.length > 0) {
        const backCamera = cameras.find(cam => 
          cam.label && cam.label.toLowerCase().includes('back')
        );
        cameraId = backCamera ? backCamera.id : cameras[0].id;
      } else {
        cameraId = { facingMode: "environment" };
      }

      // Start scanning with comprehensive barcode support
      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 300, height: 200 },
          aspectRatio: 1.5
        },
        onScanSuccess,
        onScanError
      );

      toast.success('Camera started! Point at a barcode to scan');
    } catch (error) {
      console.error("Failed to start scanning:", error);
      setScanning(false); // Reset scanning state on error
      
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission')) {
        const errorMsg = 'Camera access denied. Please allow camera access in your browser settings.';
        setPermissionError(errorMsg);
        toast.error(errorMsg);
      } else if (error.name === 'NotFoundError') {
        const errorMsg = 'No camera found on this device.';
        setPermissionError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = 'Failed to start camera: ' + (error.message || 'Unknown error');
        setPermissionError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    toast.success('Barcode scanned successfully!');
    
    if (onScan) {
      onScan(decodedText);
    }
    
    stopScanning();
  };

  const onScanError = (errorMessage) => {
    // Ignore scan errors (they happen frequently while scanning)
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (error) {
        console.error("Failed to stop scanner:", error);
      }
    }
    setScanning(false);
  };

  const handleClose = async () => {
    await stopScanning();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Scan Barcode/QR Code
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {!scanning ? (
            <div className="text-center">
              <CameraIcon className="mx-auto h-24 w-24 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-6">
                Click the button below to start scanning barcodes or QR codes
              </p>
              {permissionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{permissionError}</p>
                </div>
              )}
              <button
                onClick={startScanning}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Start Scanning
              </button>
            </div>
          ) : (
            <div>
              <div id="qr-reader" style={{ width: '100%' }}></div>
              <button
                onClick={stopScanning}
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Stop Scanning
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-sm text-gray-600">
            <strong>Instructions:</strong>
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside mt-2 space-y-1">
            <li>Allow camera access when prompted</li>
            <li>Hold the barcode/QR code steady in front of the camera</li>
            <li>Make sure the code is well-lit and in focus</li>
            <li>Supports QR codes and all standard barcodes (EAN, UPC, Code128, etc.)</li>
            <li>The scan will happen automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
