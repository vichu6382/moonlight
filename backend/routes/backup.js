const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const dbGuard = require('../middleware/dbGuard');
const backupController = require('../controllers/backupController');

router.use(auth, ownerOnly, dbGuard);

router.get('/export', backupController.exportData);
router.post('/import', backupController.importData);
router.delete('/clear', backupController.clearData);

module.exports = router;
