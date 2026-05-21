const Shipment = require('./model');
const sendResponse = require('../../utils/response');

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
};

// Helper: Generate Unique Consignment Number
async function generateUniqueConsignmentNumber() {
  const lastShipment = await Shipment.findOne({
    consignmentNumber: /^SKRT\d+$/
  }).sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastShipment?.consignmentNumber) {
    const lastNumber = parseInt(lastShipment.consignmentNumber.replace("SKRT", ""), 10);
    nextNumber = lastNumber + 1;
  }

  let consignmentNumber = `SKRT${String(nextNumber).padStart(6, "0")}`;

  // Direct check for safety
  while (await Shipment.exists({ consignmentNumber })) {
    nextNumber++;
    consignmentNumber = `SKRT${String(nextNumber).padStart(6, "0")}`;
  }

  return consignmentNumber;
}

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private/Operator
exports.createShipment = async (req, res) => {
  try {
    const {
      consignmentNumber,
      toBranch,
      consignor,
      consignee,
      bookedAt,
      ewayParta,
      invoiceNumber,
      invoiceValue,
      description,
      quantity,
      packageType,
      privateNumber,
      actualWeight,
      chargedWeight,
      rateType,
      rate,
      paymentMode,
      hamali,
      stationaryCharge,
      miscellaneousCharge,
      status,
      vehicleNumber,
      outgoingStatus
    } = req.body;

    const computedTotalFreight = parseNumber(chargedWeight) * parseNumber(rate);
    const computedTotalPayable = computedTotalFreight + parseNumber(hamali) + parseNumber(stationaryCharge) + parseNumber(miscellaneousCharge);

    // Generate unique consignment number (Backend is source of truth)
    const generatedConsignmentNumber = await generateUniqueConsignmentNumber();
    console.log("Incoming shipment payload:", req.body);
    console.log("Generated unique consignmentNumber:", generatedConsignmentNumber);

    const shipment = await Shipment.create({
      consignmentNumber: generatedConsignmentNumber,
      toBranch,
      consignor,
      consignee,
      bookedAt: bookedAt ? new Date(bookedAt) : Date.now(),
      ewayParta: ewayParta || '',
      invoiceNumber: invoiceNumber || '',
      invoiceValue: parseNumber(invoiceValue),
      description,
      quantity: parseNumber(quantity),
      packageType,
      privateNumber,
      actualWeight: parseNumber(actualWeight),
      chargedWeight: parseNumber(chargedWeight),
      rateType,
      rate: parseNumber(rate),
      paymentMode,
      hamali: parseNumber(hamali),
      stationaryCharge: parseNumber(stationaryCharge),
      miscellaneousCharge: parseNumber(miscellaneousCharge),
      totalFreight: computedTotalFreight,
      totalPayable: computedTotalPayable,
      status: status || 'Booked',
      vehicleNumber: vehicleNumber || '',
      outgoingStatus: outgoingStatus || 'Pending',
      updatedAt: Date.now()
    });

    return sendResponse(res, 201, true, 'Shipment created successfully', shipment);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// @desc    Get next available consignment number
// @route   GET /api/shipments/next-number
// @access  Private
exports.getNextNumber = async (req, res) => {
  try {
    const consignmentNumber = await generateUniqueConsignmentNumber();
    return sendResponse(res, 200, true, 'Next number generated', { consignmentNumber });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private
exports.getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, true, 'Shipments fetched successfully', shipments);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Get single shipment
// @route   GET /api/shipments/:id
// @access  Private
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (shipment) {
      return sendResponse(res, 200, true, 'Shipment fetched successfully', shipment);
    } else {
      return sendResponse(res, 404, false, 'Shipment not found');
    }
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Update shipment
// @route   PUT /api/shipments/:id
// @access  Private/Operator
exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return sendResponse(res, 404, false, 'Shipment not found');
    }

    const {
      consignmentNumber,
      toBranch,
      consignor,
      consignee,
      bookedAt,
      ewayParta,
      invoiceNumber,
      invoiceValue,
      description,
      quantity,
      packageType,
      privateNumber,
      actualWeight,
      chargedWeight,
      rateType,
      rate,
      paymentMode,
      hamali,
      stationaryCharge,
      miscellaneousCharge,
      status,
      vehicleNumber,
      outgoingStatus
    } = req.body;

    shipment.consignmentNumber = consignmentNumber || shipment.consignmentNumber;
    shipment.toBranch = toBranch || shipment.toBranch;
    shipment.consignor = consignor || shipment.consignor;
    shipment.consignee = consignee || shipment.consignee;
    shipment.bookedAt = bookedAt ? new Date(bookedAt) : shipment.bookedAt;
    shipment.ewayParta = ewayParta || shipment.ewayParta;
    shipment.invoiceNumber = invoiceNumber || shipment.invoiceNumber;
    shipment.invoiceValue = parseNumber(invoiceValue) || shipment.invoiceValue;
    shipment.description = description || shipment.description;
    shipment.quantity = parseNumber(quantity) || shipment.quantity;
    shipment.packageType = packageType || shipment.packageType;
    shipment.privateNumber = privateNumber || shipment.privateNumber;
    shipment.actualWeight = parseNumber(actualWeight) || shipment.actualWeight;
    shipment.chargedWeight = parseNumber(chargedWeight) || shipment.chargedWeight;
    shipment.rateType = rateType || shipment.rateType;
    shipment.rate = parseNumber(rate) || shipment.rate;
    shipment.paymentMode = paymentMode || shipment.paymentMode;
    shipment.hamali = parseNumber(hamali) || shipment.hamali;
    shipment.stationaryCharge = parseNumber(stationaryCharge) || shipment.stationaryCharge;
    shipment.miscellaneousCharge = parseNumber(miscellaneousCharge) || shipment.miscellaneousCharge;

    shipment.totalFreight = shipment.chargedWeight * shipment.rate;
    shipment.totalPayable = shipment.totalFreight + shipment.hamali + shipment.stationaryCharge + shipment.miscellaneousCharge;
    shipment.status = status || shipment.status;
    
    // Explicitly update these tracking fields if provided
    if (vehicleNumber !== undefined) shipment.vehicleNumber = vehicleNumber;
    if (outgoingStatus !== undefined) shipment.outgoingStatus = outgoingStatus;
    
    shipment.updatedAt = Date.now();

    const updatedShipment = await shipment.save();
    return sendResponse(res, 200, true, 'Shipment updated successfully', updatedShipment);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Delete shipment
// @route   DELETE /api/shipments/:id
// @access  Private/Operator
exports.deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return sendResponse(res, 404, false, 'Shipment not found');
    }
    await shipment.remove();
    return sendResponse(res, 200, true, 'Shipment deleted successfully', null);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Update shipment status
// @route   PATCH /api/shipments/:id/status
// @access  Private/Operator
exports.updateStatus = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (shipment) {
      shipment.status = req.body.status || shipment.status;
      shipment.updatedAt = Date.now();
      const updatedShipment = await shipment.save();
      return sendResponse(res, 200, true, 'Status updated successfully', updatedShipment);
    } else {
      return sendResponse(res, 404, false, 'Shipment not found');
    }
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
