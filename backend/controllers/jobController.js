const asyncHandler = require("express-async-handler");
const Job = require("../model/jobModel");
const scrapeJobData = require("../services/scrapeService");

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
const setJobs = asyncHandler(async (req, res) => {
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
    await Job.insertMany(jobsToInsert);

    res.status(201).json({ message: "Jobs successfully added." });
  } catch (error) {
    console.error("Error adding jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// @desc Update jobs by ID
// @route PUT /api/jobs/:id
// @access private
const putJobs = asyncHandler(async (req, res) => {
  // Implement update functionality based on your requirements
  res.status(200).json({ message: "Update jobs." });
});

// @desc Delete jobs by ID
// @route DELETE /api/jobs/:id
// @access private
const deleteJobs = asyncHandler(async (req, res) => {
  // Implement delete functionality based on your requirements
  res.status(200).json({ message: "Delete jobs." });
});

module.exports = {
  getJobs,
  setJobs,
  putJobs,
  deleteJobs,
};
