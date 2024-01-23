const express = require("express");
const router = express.Router();
const {
  getJobs,
  setJobs,
  putJobs,
  deleteJobs,
} = require("../controllers/jobController");

router.get("/", getJobs);

router.post("/", setJobs);

router.put("/:id", putJobs);

router.delete("/:id", deleteJobs);

module.exports = router;
