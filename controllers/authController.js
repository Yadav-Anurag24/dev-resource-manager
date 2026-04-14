const User = require('../models/User');
const Resource = require('../models/Resource');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
    }

    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        user = new User({
            username,
            email,
            password,
        });

        await user.save();

        const token = generateToken(user._id, user.role);

        // Audit log — non-critical
        try { await AuditLog.create({ action: 'REGISTER', userId: user._id, username: user.username }); } catch {}

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken(user._id, user.role);

        // Audit log — non-critical
        try { await AuditLog.create({ action: 'LOGIN', userId: user._id, username: user.username }); } catch {}

        res.json({
            success: true,
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get user profile with stats
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const resourceCount = await Resource.countDocuments({ owner: user._id });
        const bookmarkCount = user.bookmarks ? user.bookmarks.length : 0;

        res.json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                resourceCount,
                bookmarkCount,
                joinDate: user._id.getTimestamp(),
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Update username
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Username must be at least 2 characters' });
        }

        if (username.trim().length > 50) {
            return res.status(400).json({ success: false, error: 'Username cannot exceed 50 characters' });
        }

        const existing = await User.findOne({ username: username.trim(), _id: { $ne: req.user._id } });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Username is already taken' });
        }

        const user = await User.findById(req.user._id);
        user.username = username.trim();
        await user.save();

        res.json({
            success: true,
            data: { id: user._id, username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword,
};
