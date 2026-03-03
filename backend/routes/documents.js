const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  submitForApproval,
  approveDocument,
  searchDocuments,
  deleteDocument
} = require('../controllers/documentController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getDocuments)
  .post(uploadDocument);

router.get('/search', searchDocuments);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

router.post('/:id/approve', submitForApproval);
router.put('/:id/approval/:approvalId', approveDocument);

module.exports = router;
