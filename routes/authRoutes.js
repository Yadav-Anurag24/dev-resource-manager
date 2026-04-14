const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 6 or more characters'
        ).isLength({ min: 6 }),
    ],
    registerUser
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    loginUser
);

// @route   GET api/auth/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT api/auth/profile
// @desc    Update username
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   PUT api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, changePassword);

module.exports = router;
