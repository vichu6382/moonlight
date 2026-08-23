const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const dbGuard = require('../middleware/dbGuard');
const activityController = require('../controllers/activityController');

router.use(auth, ownerOnly, dbGuard);

router.get('/', activityController.getAll);

module.exports = router;
