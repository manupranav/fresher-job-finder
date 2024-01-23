const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    techPark: { type: String, required: true },
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    deadline: { type: Date, required: true },
    jobLink: { type: String, required: true },
    status: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Jobs", jobSchema);
