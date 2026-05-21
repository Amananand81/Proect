const EntryRegister = require("./model");

/**
 * Get all Entry Registers
 */
exports.getAllEntries = async (req, res) => {
  try {
    const records = await EntryRegister.find().sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

/**
 * Get Entry Register by Date search
 */
exports.getEntryByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await EntryRegister.findOne({ dateSearch: date });
    if (!record) {
      return res.status(404).json({ success: false, message: "No register found for this date", data: null });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

/**
 * Create a new Entry Register
 */
exports.createEntry = async (req, res) => {
  try {
    const newRecord = await EntryRegister.create(req.body);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(400).json({ success: false, error: "Bad Request", message: error.message });
  }
};

/**
 * Update an existing Entry Register
 */
exports.updateEntry = async (req, res) => {
  try {
    console.log('Update Request ID:', req.params.id);
    const { id } = req.params;
    const updatedRecord = await EntryRegister.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(400).json({ success: false, error: "Bad Request", message: error.message });
  }
};

/**
 * Delete an Entry Register
 */
exports.deleteEntry = async (req, res) => {
  try {
    const deletedRecord = await EntryRegister.findByIdAndDelete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};
