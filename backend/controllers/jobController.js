const asyncHandler = require("express-async-handler");
const Job = require("../model/jobModel");
const Webhook = require("../model/notificationModel");
const scrapeJobData = require("../services/scrapeService");
const cron = require("node-cron");
const axios = require("axios");

// Schedule setJobsInternal to run every hour
cron.schedule("0 * * * *", async () => {
  console.log("Running setJobs cron job");
  await setJobsInternal();
});

// Schedule deleteExpiredJobs to run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running deleteExpiredJobs cron job");
  await deleteExpiredJobs();
});

// Function to delete expired jobs
const deleteExpiredJobs = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    // Find jobs with a deadline earlier than the current date
    const expiredJobs = await Job.find({}).lean(); // Use lean() to get plain JavaScript objects

    // Filter and map jobs based on deadline
    const jobsToDelete = expiredJobs.filter((job) => {
      const [day, month, year] = job.deadline.split("/"); // Split the components
      const jobDeadline = new Date(`${year}-${month}-${day}`); // Create a Date object in the correct format
      return jobDeadline < currentDate;
    });

    console.log(`About to delete ${jobsToDelete.length} expired jobs.`);

    if (jobsToDelete.length > 0) {
      // Delete expired jobs in bulk
      const deleteResult = await Job.deleteMany({
        _id: { $in: jobsToDelete.map((job) => job._id) },
      });

      if (deleteResult.deletedCount === jobsToDelete.length) {
        console.log("Expired jobs deleted successfully.");
        return res
          .status(200)
          .json({ message: "Expired jobs deleted successfully." });
      } else {
        console.warn("Not all jobs were deleted successfully.");
        return res
          .status(500)
          .json({ error: "Not all jobs were deleted successfully." });
      }
    } else {
      console.log("No expired jobs found.");
      return res.status(404).json({ message: "No expired jobs found." });
    }
  } catch (error) {
    console.error("Error deleting expired jobs:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Function to send notifications for new jobs to all webhooks
const sendNotificationsForNewJobs = async (jobsToInsert) => {
  try {
    const webhookURLs = await Webhook.find({}).distinct("webhookURL");

    if (jobsToInsert.length > 0 && webhookURLs.length > 0) {
      const notificationPromises = webhookURLs.map(async (webhookURL) => {
        const jsonData = JSON.stringify({
          content: `New jobs added:\n${jobsToInsert
            .map(
              (job) => `[${job.companyName}: ${job.jobRole}](${job.jobLink})`
            )
            .join("\n")}`,
        });

        try {
          await axios.post(webhookURL, jsonData, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log(`Notifications sent for new jobs to ${webhookURL}`);
        } catch (error) {
          console.error(
            `Error sending notifications to ${webhookURL}: ${error.message}`
          );
          throw error; // Rethrow the error to be caught by Promise.all
        }
      });

      await Promise.all(notificationPromises);

      console.log("All notifications sent successfully.");
    } else {
      console.log("No jobs to notify or no webhook URLs available.");
    }
  } catch (error) {
    console.error("Error processing notifications:", error.message);
  }
};

// @desc Get jobs
// @route GET /api/jobs
// @access private
const getJobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find();
    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error getting jobs:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// @desc Set jobs by scraping and adding to the database
// @route POST /api/jobs
// @access private
const setJobsInternal = asyncHandler(async () => {
  try {
    console.log("Running setJobsInternal");

    const jobsFromScrape = await scrapeJobData();

    // Limit the number of jobs initially
    const maxJobsToProcess = 100;
    const limitedJobs = jobsFromScrape.slice(0, maxJobsToProcess);

    const existingJobs = await Job.find({
      jobLink: { $in: limitedJobs.map((job) => job.jobLink) },
    });

    const existingJobLinks = new Set(existingJobs.map((job) => job.jobLink));

    const jobsToInsert = limitedJobs.filter(
      (job) => !existingJobLinks.has(job.jobLink)
    );

    if (jobsToInsert.length > 0) {
      // Batch insert jobs
      const batchSize = Math.min(50, jobsToInsert.length);
      for (let i = 0; i < jobsToInsert.length; i += batchSize) {
        const batch = jobsToInsert.slice(i, i + batchSize);
        await Job.insertMany(batch);
      }

      // Send notifications for new jobs
      await sendNotificationsForNewJobs(jobsToInsert);

      console.log(`Successfully added ${jobsToInsert.length} new jobs.`);
    } else {
      console.log("No new jobs to add.");
    }
  } catch (error) {
    console.error("Error in setJobsInternal:", error);
  }
});

// @desc Set jobs route
// @route POST /api/jobs
// @access private
const setJobs = asyncHandler(async (req, res) => {
  try {
    await setJobsInternal();
    return res.status(201).json({ message: "Jobs successfully added." });
  } catch (error) {
    console.error("Error setting jobs:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// @desc Update jobs by ID
// @route PUT /api/jobs/:id
// @access private
const putJobs = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const { status } = req.body;

    if (!status || ["applied", "not interested", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (job.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized." });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found." });
    }

    return res
      .status(200)
      .json({ message: "Job status updated successfully." });
  } catch (error) {
    console.error("Error updating job:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// @desc Delete jobs by ID
// @route DELETE /api/jobs/:id
// @access private
const deleteJobs = asyncHandler(async (req, res) => {
  try {
    const jobsFromScrape = await scrapeJobData();
    const existingJobs = await Job.find();

    const scrapeData = jobsFromScrape.map((job) => ({
      title: job.jobRole,
      link: job.jobLink.trim(),
    }));

    const existingJobData = existingJobs.map((job) => ({
      title: job.jobRole,
      link: job.jobLink.trim(),
    }));

    const jobNotInScrape = existingJobData.filter((existingJob) => {
      return !scrapeData.some((scrapeJob) => {
        return (
          scrapeJob.title === existingJob.title &&
          scrapeJob.link === existingJob.link
        );
      });
    });

    const jobsToDelete = jobNotInScrape.filter((job) => {
      return !job.link.includes("technopark");
    });

    console.log("Jobs to delete:", jobsToDelete);

    // Delete jobs from the database
    if (jobsToDelete.length > 0) {
      for (const job of jobsToDelete) {
        await Job.deleteOne({
          jobRole: job.title,
          jobLink: job.link,
        });
      }

      return res.status(200).json({ message: "Jobs successfully deleted" });
    } else {
      return res.status(200).json({ message: "No jobs to delete" });
    }
  } catch (error) {
    console.error("Error deleting jobs:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = {
  getJobs,
  setJobs,
  putJobs,
  deleteJobs,
  deleteExpiredJobs,
};
