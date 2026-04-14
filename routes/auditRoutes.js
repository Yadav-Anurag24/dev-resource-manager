const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, admin } = require('../middlewares/authMiddleware');

// GET /api/audit-log — admin-only, filterable by action, user, date range
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const { action, userId, from, to, page, limit } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalLogs: total,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
