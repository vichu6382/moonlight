const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const dbGuard = require('../middleware/dbGuard');
const settingsController = require('../controllers/settingsController');

router.use(auth, ownerOnly, dbGuard);

router.get('/', settingsController.get);
router.put('/', settingsController.update);
router.post('/reset', settingsController.reset);

module.exports = router;
