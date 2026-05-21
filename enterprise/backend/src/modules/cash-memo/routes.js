const express = require('express');
const router = express.Router();
const {
  createCashMemo,
  getCashMemos,
  getCashMemoById,
  updateCashMemo,
  deleteCashMemo
} = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

router.route('/')
  .post(protect, createCashMemo)
  .get(protect, getCashMemos);

router.route('/:id')
  .get(protect, getCashMemoById)
  .put(protect, updateCashMemo)
  .delete(protect, deleteCashMemo);

module.exports = router;
