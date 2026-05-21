const Shipment = require('../shipments/model');
const sendResponse = require('../../utils/response');

// Helper: Map outgoingStatus to timeline steps
const generateTimeline = (status) => {
  const allSteps = [
    { id: 'assigned', title: 'Vehicle Assigned' },
    { id: 'picked', title: 'Shipment Picked from Warehouse' },
    { id: 'hub', title: 'Reached Hub' },
    { id: 'dispatched', title: 'Dispatched' },
    { id: 'transit', title: 'In Transit' },
    { id: 'out-for-delivery', title: 'Out for Delivery' },
    { id: 'delivered', title: 'Delivered' }
  ];

  const statusMap = {
    'Pending': 0,
    'Loaded': 1,
    'Dispatched': 3, 
    'In Transit': 4,
    'Arrived at Branch': 5,
    'Out for Delivery': 5,
    'Delivered': 6
  };

  const currentIndex = statusMap[status] !== undefined ? statusMap[status] : -1;

  return allSteps.map((step, index) => {
    let stepStatus = 'pending';
    let time = index <= currentIndex ? 'Today' : '-'; // Placeholder

    if (index < currentIndex) {
      stepStatus = 'completed';
    } else if (index === currentIndex) {
      stepStatus = status === 'Delivered' ? 'completed' : 'active';
    }

    return {
      ...step,
      status: stepStatus,
      time: stepStatus === 'pending' ? '-' : 'Today',
      location: 'Logistics Hub' // Fallback
    };
  });
};

const buildLiveTrackingData = async () => {
  const shipments = await Shipment.find({
    vehicleNumber: { $exists: true, $ne: '' }
  }).sort({ updatedAt: -1 });

  return shipments.map(shipment => {
    const status = shipment.outgoingStatus || 'Pending';
    
    // Logic for top-level status
    let trackingStatus = 'idle';
    if (['Pending', 'Loaded'].includes(status)) trackingStatus = 'idle';
    else if (['Delivered', 'Cancelled'].includes(status)) trackingStatus = 'offline';
    else trackingStatus = 'active';

    return {
      _id: shipment._id,
      consignmentNumber: shipment.consignmentNumber,
      vehicleNumber: shipment.vehicleNumber,
      driverName: "Not Assigned", // Fallback
      driverPhone: "-", // Fallback
      type: "Transport Vehicle", // Fallback
      status: trackingStatus,
      statusLabel: status,
      currentLocation: { 
        lat: 25.3500, 
        lng: 74.6330, 
        address: status === 'Pending' ? (shipment.toBranch || "Warehouse") : "In Transit" 
      },
      lastUpdate: shipment.updatedAt || shipment.createdAt,
      distance: status === 'Delivered' ? '0 km' : 'Calculating...',
      shipment: {
        lrNo: shipment.consignmentNumber,
        origin: "Main Warehouse", // Placeholder if not in model
        destination: shipment.toBranch || "Destination",
        sender: shipment.consignor?.name || "-",
        receiver: shipment.consignee?.name || "-",
        cargoType: shipment.packageType || "Goods",
        packages: shipment.quantity || 0,
        weight: `${shipment.chargedWeight || 0} kg`,
        value: `₹${(shipment.totalFreight || 0).toLocaleString()}`,
        challanNo: `CHL-${shipment.consignmentNumber.slice(-6)}`
      },
      trackingHistory: generateTimeline(status)
    };
  });
};

exports.getAllLocations = async (req, res) => {
  try {
    const data = await buildLiveTrackingData();
    return sendResponse(res, 200, true, 'Tracking data fetched successfully', data);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

exports.getVehicleLocation = async (req, res) => {
  try {
    const data = await buildLiveTrackingData();
    const vehicle = data.find(v => v._id.toString() === req.params.vehicleId || v.vehicleNumber === req.params.vehicleId);
    if (!vehicle) {
      return sendResponse(res, 404, false, 'No tracking data found');
    }
    return sendResponse(res, 200, true, 'Vehicle tracking fetched successfully', vehicle);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

exports.updateLocation = async (req, res) => {
  return sendResponse(res, 200, true, 'Location updates are currently driven by shipment status updates.');
};
