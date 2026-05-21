const express = require("express");
const {
  getAllEntries,
  getEntryByDate,
  createEntry,
  updateEntry,
  deleteEntry
} = require("./controller");

const router = express.Router();

router
  .route("/")
  .get(getAllEntries)
  .post(createEntry);

router
  .route("/date/:date")
  .get(getEntryByDate);

router
  .route("/:id")
  .put(updateEntry)
  .delete(deleteEntry);

module.exports = router;
