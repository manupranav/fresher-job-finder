const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const https = require("https");
const Webhook = require("../model/notificationModel");

const fresherKeywords = [
  "fresher",
  "trainee",
  "intern",
  "junior",
  "jr",
  "entry-level",
  "graduate",
  "beginner",
  "novice",
  "apprentice",
  "rookie",
  "starter",
];

const scrapeJobsFromSource = async (sourceUrl, techPark) => {
  try {
    const response = await axios.get(sourceUrl, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const jobList = [];
    const $ = cheerio.load(response.data);

    if (techPark == "Infopark") {
      $(".company-list.joblist").each((index, element) => {
        const companyName = $(element).find(".jobs-comp-name a").text().trim();

        // Find the job role by navigating through the DOM
        const jobRole = $(element)
          .find(".mt5 a")
          .first()
          .clone() // Clone the anchor element
          .children() // Select its children (if any)
          .remove() // Remove the children
          .end() // Go back to the cloned element
          .text(); // Get the text content
        const deadline = $(element).find(".job-date").text().trim();
        const jobLink = $(element).find(".mt5 a").attr("href");

        const isMatchingJob = fresherKeywords.some((keyword) =>
          jobRole.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isMatchingJob) {
          jobList.push({
            companyName,
            jobRole,
            deadline,
            jobLink,
            techPark,
          });
        }
      });
    } else {
      if (response.data && response.data.last_page) {
        const totalPages = response.data.last_page;
        for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
          const apiUrl = `https://technopark.org/api/paginated-jobs?page=${currentPage}`;

          const pageResponse = await axios.get(apiUrl);

          if (pageResponse.data && pageResponse.data.data) {
            const jobsData = pageResponse.data.data;

            jobsData.forEach((job) => {
              const companyName = job.company.company;
              const jobRole = job.job_title;
              const deadline = job.closing_date;
              const jobLink = `https://technopark.org/job-details/${job.id}`;
              const isMatchingJob = fresherKeywords.some((keyword) =>
                jobRole.toLowerCase().includes(keyword.toLowerCase())
              );

              if (isMatchingJob) {
                jobList.push({
                  companyName,
                  jobRole,
                  deadline,
                  jobLink,
                  techPark,
                });
              }
            });
          }
        }
      }
    }

    return jobList;
  } catch (error) {
    throw error;
  }
};

const scrapeJobData = async () => {
  try {
    const jobListTechnopark = await scrapeJobsFromSource(
      "https://technopark.org/api/paginated-jobs",
      "Technopark"
    );

    const jobListInfopark = await scrapeJobsFromSource(
      "https://infopark.in/companies/job-search",
      "Infopark"
    );

    const currentDate = new Date();

    const convertToDDMMYYYY = (date) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(date).toLocaleDateString("en-GB", options);
    };

    const convertJobList = (jobList) => {
      return jobList.map((job) => {
        return {
          ...job,
          deadline: convertToDDMMYYYY(job.deadline),
        };
      });
    };

    const jobList = [
      ...convertJobList(jobListTechnopark),
      ...convertJobList(jobListInfopark),
    ];

    return jobList;
  } catch (error) {
    console.error("Error scraping job data:", error);
    return [];
  }
};

module.exports = scrapeJobData;
