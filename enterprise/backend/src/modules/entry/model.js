const mongoose = require("mongoose");

const entryRowSchema = new mongoose.Schema({
  from: { type: String, default: "" },
  to: { type: String, default: "" },
  grNo: { type: String, default: "" },
  consignor: { type: String, default: "" },
  consignee: { type: String, default: "" },
  contents: { type: String, default: "" },
  freight: { type: String, default: "" },
  challanNo: { type: String, default: "" },
  deliveryReceiptNo: { type: String, default: "" },
  dateOfDelivery: { type: String, default: "" }
});

const entryRegisterSchema = new mongoose.Schema({
  pageNo: {
    type: String,
    default: ""
  },
  dateSearch: {
    type: String,
    default: ""
  },
  entries: [entryRowSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model("EntryRegister", entryRegisterSchema);
