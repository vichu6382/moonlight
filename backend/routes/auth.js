const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ownerOnly = require('../middleware/ownerOnly');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], validate, authController.login);

router.post('/logout', authController.logout);

router.get('/me', auth, ownerOnly, authController.me);

router.post('/setup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], validate, authController.setup);

module.exports = router;
