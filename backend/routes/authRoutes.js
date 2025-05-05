const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Registration route
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  ],
  authController.register
);

// Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.login
);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put(
  '/update-password',
  [
    protect,
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 }),
  ],
  authController.updatePassword
);

module.exports = router;