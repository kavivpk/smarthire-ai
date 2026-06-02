// backend/routes/adminRoutes.js

const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getDashboardStats, getAllStudents } = require("../controllers/adminController");

router.get("/stats",    protect, adminOnly, getDashboardStats);
router.get("/students", protect, adminOnly, getAllStudents);

module.exports = router;