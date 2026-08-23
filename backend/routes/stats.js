const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const dbGuard = require('../middleware/dbGuard');
const statsController = require('../controllers/statsController');

router.use(auth, ownerOnly, dbGuard);

router.get('/dashboard', statsController.dashboard);
router.get('/monthly/:year', statsController.monthly);
router.get('/payments', statsController.payments);
router.get('/years', statsController.years);

module.exports = router;
