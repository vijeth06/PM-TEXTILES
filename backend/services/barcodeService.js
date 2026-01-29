const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

// Generate QR Code
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate Barcode
const generateBarcode = async (value, format = 'code128') => {
  try {
    const png = await bwipjs.toBuffer({
      bcid: format,
      text: value,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center'
    });
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
};

// Generate unique SKU
const generateSKU = (category, name) => {
  const prefix = category.substring(0, 3).toUpperCase();
  const nameCode = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${nameCode}-${timestamp}`;
};

module.exports = {
  generateQRCode,
  generateBarcode,
  generateSKU
};
