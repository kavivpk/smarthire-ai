// backend/routes/adminRoutes.js

const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getDashboardStats, getAllStudents, addAptitudeQuestion } = require("../controllers/adminController");

router.get("/stats",    protect, adminOnly, getDashboardStats);
router.get("/students", protect, adminOnly, getAllStudents);
router.post("/questions/aptitude", protect, adminOnly, addAptitudeQuestion);

module.exports = router;