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
  "6 month",
  "entry level",
  "l1",
  "l 1",
  "0-",
  "0 -",
];
const scrapeJobsFromSource = async (sourceUrl, techPark) => {
  try {
    const response = await axios.get(sourceUrl, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const jobList = [];
    const $ = cheerio.load(response.data);

    if (techPark === "Infopark") {
      jobList.push(
        ...$(".company-list.joblist")
          .map((index, element) => {
            const companyName = $(element)
              .find(".jobs-comp-name a")
              .text()
              .trim();
            const jobRole = $(element)
              .find(".mt5 a")
              .first()
              .clone()
              .children()
              .remove()
              .end()
              .text();
            const deadline = $(element).find(".job-date").text().trim();
            const jobLink = $(element).find(".mt5 a").attr("href");

            const isMatchingJob = fresherKeywords.some((keyword) =>
              jobRole.toLowerCase().includes(keyword.toLowerCase())
            );

            return isMatchingJob
              ? { companyName, jobRole, deadline, jobLink, techPark }
              : null;
          })
          .get()
          .filter(Boolean)
      );
    } else {
      if (response.data && response.data.last_page) {
        const totalPages = response.data.last_page;
        const pageRequests = Array.from({ length: totalPages }, (_, i) =>
          axios.get(`https://technopark.org/api/paginated-jobs?page=${i + 1}`)
        );

        const pageResponses = await Promise.all(pageRequests);
        const jobsData = pageResponses.map((res) => res.data.data).flat();

        jobList.push(
          ...jobsData
            .filter((job) => {
              const jobRole = job.job_title;
              const isMatchingJob = fresherKeywords.some((keyword) =>
                jobRole.toLowerCase().includes(keyword.toLowerCase())
              );
              return isMatchingJob;
            })
            .map((job) => ({
              companyName: job.company.company,
              jobRole: job.job_title,
              deadline: job.closing_date,
              jobLink: `https://technopark.org/job-details/${job.id}`,
              techPark,
            }))
        );
      }
    }

    return jobList;
  } catch (error) {
    throw error;
  }
};

const scrapeJobData = async () => {
  try {
    const [jobListTechnopark, jobListInfopark] = await Promise.all([
      scrapeJobsFromSource(
        "https://technopark.org/api/paginated-jobs",
        "Technopark"
      ),
      scrapeJobsFromSource(
        "https://infopark.in/companies/job-search",
        "Infopark"
      ),
    ]);

    const currentDate = new Date();

    const convertToDDMMYYYY = (date) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(date).toLocaleDateString("en-GB", options);
    };

    const convertJobList = (jobList) => {
      return jobList
        .filter((job) => !job.companyName.toLowerCase().includes("galtech"))
        .map((job) => ({
          ...job,
          deadline: convertToDDMMYYYY(job.deadline),
        }));
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
