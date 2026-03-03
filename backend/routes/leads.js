const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLead,
  updateLead,
  addFollowUp,
  createQuotationFromLead,
  convertToCustomer,
  markLeadAsLost,
  getLeadStats,
  deleteLead
} = require('../controllers/leadController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.get('/stats', getLeadStats);

router.route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(authorize('admin'), deleteLead);

router.post('/:id/followup', addFollowUp);
router.post('/:id/quotation', createQuotationFromLead);
router.post('/:id/convert', authorize('admin', 'sales_executive', 'management'), convertToCustomer);
router.put('/:id/lost', markLeadAsLost);

module.exports = router;
