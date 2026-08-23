const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const dbGuard = require('../middleware/dbGuard');
const customerController = require('../controllers/customerController');

router.use(auth, ownerOnly, dbGuard);

router.get('/', customerController.getAll);

module.exports = router;
