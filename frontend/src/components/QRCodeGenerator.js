import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QRCodeGenerator = ({ data, label, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(
        canvasRef.current,
        data,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) {
            console.error('QR Code generation error:', error);
            toast.error('Failed to generate QR code');
          }
        }
      );
    }
  }, [data, size]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode_${label || 'item'}_${Date.now()}.png`;
      link.click();
      toast.success('QR code downloaded!');
    }
  };

  if (!data) {
    return (
      <div className="text-center text-gray-500">
        No data to generate QR code
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
        <canvas ref={canvasRef}></canvas>
      </div>
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      <button
        onClick={handleDownload}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;
