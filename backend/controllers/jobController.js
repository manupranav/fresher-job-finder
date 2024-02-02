const asyncHandler = require("express-async-handler");
const Job = require("../model/jobModel");
const Webhook = require("../model/notificationModel");
const User = require("../model/UserModel");
const scrapeJobData = require("../services/scrapeService");
const protect = require("../middleware/authMiddleware");
const cron = require("node-cron");
const axios = require("axios");

// Schedule the setJobs function to run every hour
cron.schedule("0 * * * *", async () => {
  console.log("Running setJobs cron job");
  await setJobsInternal();
});

// @desc Get jobs
// @route GET /api/jobs
// @access private
const getJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find();
  res.status(200).json(jobs);
});

// @desc Set jobs by scraping and adding to the database
// @route POST /api/jobs
// @access private
const setJobsInternal = async () => {
  try {
    // Scrape job data
    const jobsFromScrape = await scrapeJobData();
    const uniqueJobs = await Promise.all(
      jobsFromScrape.map(async (job) => {
        // Check if a job with the same criteria already exists in the database
        const existingJob = await Job.findOneAndUpdate(
          {
            techPark: job.techPark,
            companyName: job.companyName,
            jobRole: job.jobRole,
            deadline: job.deadline,
            jobLink: job.jobLink,
          },
          { $addToSet: { tags: { $each: job.tags } } }, // Adjust this based on your schema
          { upsert: true, new: true }
        );

        if (existingJob) {
          // Job already exists, do not insert it
          return null;
        }

        // Job does not exist, return the job for insertion
        return job;
      })
    );

    // Filter out null values (jobs that already existed)
    const jobsToInsert = uniqueJobs.filter((job) => job !== null);

    // Insert scraped jobs into the database
    const insertedJobs = await Job.insertMany(jobsToInsert);

    // Notify interested users for each newly inserted job
    insertedJobs.forEach(async (job) => {
      const interestedWebhooks = await Webhook.find({ userId: job.user });

      interestedWebhooks.forEach(async (webhook) => {
        const notificationMessage = {
          content: `A new job has been added: ${job.companyName} - ${job.jobRole}`,
        };

        try {
          await axios.post(webhook.webhookURL, notificationMessage);
        } catch (error) {
          console.error("Error sending Discord notification:", error);
        }
      });
    });

    console.log("Jobs successfully added.");
  } catch (error) {
    console.error("Error adding jobs:", error);
  }
};

// @desc Set jobs route
// @route POST /api/jobs
// @access private
const setJobs = asyncHandler(async (req, res) => {
  await setJobsInternal();
  res.status(201).json({ message: "Jobs successfully added." });
});

// @desc Update jobs by ID
// @route PUT /api/jobs/:id
// @access private
const putJobs = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  const { status } = req.body;

  if (!status || ["applied", "not intrested", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }

  if (!job) {
    res.status(400);
    throw new Error("Job not found");
  }
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  if (goal.user.toString() !== user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  try {
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $set: { status } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }
    res.status(200).json({ message: "Job status updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// @desc Delete jobs by ID
// @route DELETE /api/jobs/:id
// @access private
const deleteJobs = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Delete jobs." });
});

module.exports = {
  getJobs,
  setJobs,
  putJobs,
  deleteJobs,
};
