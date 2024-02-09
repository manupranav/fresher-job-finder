const asyncHandler = require("express-async-handler");
const Job = require("../model/jobModel");
const Webhook = require("../model/notificationModel");
const scrapeJobData = require("../services/scrapeService");
const cron = require("node-cron");
const axios = require("axios");

// Schedule the setJobs function to run every hour
cron.schedule("* * * * *", async () => {
  console.log("Running setJobs cron job");
  await setJobsInternal();
});
// Schedule the function to run every day at midnight
cron.schedule("* * * * *", async () => {
  console.log("Running deleteExpiredJobs cron job");
  await deleteExpiredJobs();
});
// Function to delete expired jobs
const deleteExpiredJobs = async () => {
  try {
    const currentDate = new Date();
    const batchSize = 100; // Adjust the batch size as needed
    let skip = 0;

    while (true) {
      const expiredJobs = await Job.find({})
        .sort({ deadline: 1 }) // Sorting by deadline may help in batch processing
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (expiredJobs.length === 0) {
        // No more jobs to process
        break;
      }

      const jobsToDelete = expiredJobs.filter((job) => {
        const [day, month, year] = job.deadline.split("/");
        const jobDeadline = new Date(`${year}-${month}-${day}`);
        return jobDeadline < currentDate;
      });

      console.log(`About to delete ${jobsToDelete.length} expired jobs.`);

      if (jobsToDelete.length > 0) {
        const deleteResult = await Job.deleteMany({
          _id: { $in: jobsToDelete.map((job) => job._id) },
        });

        if (deleteResult.deletedCount === jobsToDelete.length) {
          console.log("Expired jobs deleted successfully.");
        } else {
          console.warn("Not all jobs were deleted successfully.");
        }
      } else {
        console.log("No expired jobs found.");
      }

      skip += batchSize;
    }
  } catch (error) {
    console.error("Error deleting expired jobs:", error.message);
  }
};

// Function to send notifications for new jobs to all webhooks
const sendNotificationsForNewJobs = async (jobsToInsert) => {
  try {
    const webhookURLs = await Webhook.find({}).distinct("webhookURL");

    if (jobsToInsert.length > 0 && webhookURLs.length > 0) {
      for (const webhookURL of webhookURLs) {
        const notificationData = {
          webhookURL,
          message: `New jobs added:\n${jobsToInsert
            .map((job) => `${job.companyName}: ${job.jobRole}`)
            .join("\n")}`,
        };

        try {
          await axios.post(webhookURL, notificationData);
          console.log(
            `Notifications sent for new jobs to ${webhookURL}:`,
            jobsToInsert
          );
        } catch (error) {
          console.error(
            `Error sending notifications to ${webhookURL}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("Error processing notifications:", error.message);
  }
};

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
    const jobsFromScrape = await scrapeJobData();

    // Limit the number of jobs initially
    const maxJobsToProcess = 50;
    const limitedJobs = jobsFromScrape.slice(0, maxJobsToProcess);

    const uniqueJobs = await Promise.all(
      limitedJobs.map(async (job) => {
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

    const batchSize = 10;
    for (let i = 0; i < jobsToInsert.length; i += batchSize) {
      const batch = jobsToInsert.slice(i, i + batchSize);
      await Job.insertMany(batch);
    }

    await sendNotificationsForNewJobs(jobsToInsert);

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

  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  if (job.user.toString() !== req.user.id) {
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
  deleteExpiredJobs,
};
