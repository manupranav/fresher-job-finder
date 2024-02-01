const express = require(express);
const router = express.Router();
const {
  getWebhook,
  createWebhook,
  putWebhook,
  deleteWebhook,
} = require("../controllers/notificationController");
const protect = require("../middleware/authMiddleware");
router.get("/", protect, getWebhook);

router.post("/", protect, createWebhook);

router.put("/:id", protect, putWebhook);

router.delete("/:id", protect, deleteWebhook);

module.exports = router;
