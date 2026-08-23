const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const dbGuard = require('../middleware/dbGuard');
const invoiceController = require('../controllers/invoiceController');

router.use(auth, ownerOnly, dbGuard);

router.get('/sequence', invoiceController.getSequence);
router.get('/search', invoiceController.search);
router.get('/', invoiceController.getAll);
router.get('/:id', invoiceController.getById);
router.post('/', invoiceController.create);
router.put('/:id', invoiceController.update);
router.delete('/:id', invoiceController.remove);

module.exports = router;
