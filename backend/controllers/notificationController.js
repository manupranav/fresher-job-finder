const Webhook = require("../model/notificationModel");
const asyncHandler = require("express-async-handler");

// Create a new webhook
const createWebhook = asyncHandler(async (req, res) => {
  const { userId, webhookURL } = req.body;

  const webhook = new Webhook({
    userId,
    webhookURL,
  });

  await webhook.save();

  res.status(201).json({ message: "Webhook created successfully", webhook });
});

const getWebhook = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const webhooks = await Webhook.findById({ userId });
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
const deleteWebhook = asyncHandler(async (req, res) => {
  const webhookId = req.params.webhookId;

  const webhook = await Webhook.findByIdAndRemove(webhookId);

  if (!webhook) {
    return res.status(404).json({ message: "Webhook not found" });
  }

  res.status(200).json({ message: "Webhook deleted successfully", webhook });
});

module.exports = {
  createWebhook,
  getWebhook,
  putWebhook,
  deleteWebhook,
};
