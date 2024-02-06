const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    webhookURL: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Webhook", notificationSchema);
