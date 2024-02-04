const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    webhookURL: { type: String, require: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Webhook", notificationSchema);
