const Webhook = require("../model/notificationModel");
const User = require("../model/userModel");
const asyncHandler = require("express-async-handler");

// Create a new webhook
const createWebhook = asyncHandler(async (req, res) => {
  const { userId, webhookURL } = req.body;

  // Check if userId is provided
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const webhook = new Webhook({
    userId,
    webhookURL,
  });

  try {
    await webhook.save();
    res.status(201).json({ message: "Webhook created successfully", webhook });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    // Handle other errors
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const getWebhook = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Assuming that req.user contains the authenticated user information
  const webhooks = await Webhook.find({ userId });
  res.status(200).json(webhooks);
});

const putWebhook = asyncHandler(async (req, res) => {
  const { webhookId, webhookURL } = req.body;

  const webhook = await Webhook.findByIdAndUpdate(
    webhookId,
    { webhookURL },
    { new: true }
  );

  res.status(200).json({ message: "Webhook updated successfully", webhook });
});

// Delete a webhook
// Delete a webhook
const deleteWebhook = asyncHandler(async (req, res) => {
  const webhookId = req.params.id;

  const webhook = await Webhook.findByIdAndDelete(webhookId);

  if (!webhook) {
    res.status(404).json({ message: "Webhook not found" });
    return;
  }

  // Check for user
  if (!req.user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  // Make sure the logged-in user matches the webhook user
  if (!webhook.userId || webhook.userId.toString() !== req.user.id) {
    res.status(401).json({ message: "User not authorized" });
    return;
  }

  res
    .status(200)
    .json({ id: req.params.id, message: "Webhook deleted successfully" });
});

module.exports = {
  createWebhook,
  getWebhook,
  putWebhook,
  deleteWebhook,
};
