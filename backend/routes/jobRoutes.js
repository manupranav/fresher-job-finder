const express = require("express");
const router = express.Router();
const {
  getJobs,
  setJobs,
  putJobs,
  deleteJobs,
  deleteExpiredJobs,
} = require("../controllers/jobController");

const protect = require("../middleware/authMiddleware");

router.get("/", getJobs);

router.post("/", setJobs);

router.put("/:id", protect, putJobs);

router.delete("/", deleteExpiredJobs);

router.delete("/delete", deleteJobs);

module.exports = router;
