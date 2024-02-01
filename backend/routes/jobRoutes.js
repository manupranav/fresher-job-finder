const express = require("express");
const router = express.Router();
const {
  getJobs,
  setJobs,
  putJobs,
  deleteJobs,
} = require("../controllers/jobController");

router.get("/", getJobs);

router.post("/", protect, setJobs);

router.put("/:id", protect, putJobs);

router.delete("/:id", protect, deleteJobs);

module.exports = router;
