const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    techPark: { type: String, required: true },
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    deadline: { type: String, required: true },
    jobLink: { type: String, required: true },
    status: {
      type: String,
      default: "pending",
      enum: ["applied", "pending", "not interested"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Jobs", jobSchema);
