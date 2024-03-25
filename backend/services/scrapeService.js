const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

const fresherKeywords = [
  "l1",
  "l 1",
  " 0-",
  " 0 -",
  "(0-",
  "(0 -",
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
    } else if (techPark === "Technopark") {
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
    } else {
      try {
        const response = await axios.get(sourceUrl, {
          params: { action: "get_listings" },
        });

        if (response.data && response.data.found_jobs) {
          const html = response.data.html;

          const $ = cheerio.load(html);
          jobList.push(
            ...$(".job_listing")
              .map((index, element) => {
                const companyName = $(element)
                  .find(".company strong")
                  .text()
                  .trim();
                const jobRole = $(element).find(".position h3").text().trim();
                const datePosted = $(element)
                  .find(".date time")
                  .attr("datetime");
                const jobLink = $(element).find(".job-listing").text().trim();

                const deadline = new Date(datePosted);
                deadline.setDate(deadline.getDate() + 30);

                const isMatchingJob = fresherKeywords.some((keyword) =>
                  jobRole.toLowerCase().includes(keyword.toLowerCase())
                );

                if (isMatchingJob) {
                  return {
                    companyName,
                    jobRole,
                    jobLink,
                    deadline,
                    techPark,
                  };
                } else {
                  return null; // Skip this job if it doesn't match fresher keywords
                }
              })
              .get()
              .filter(Boolean)
          );
        }
      } catch (error) {
        console.error("Error scraping job data from cyber park:", error);
      }
    }
    return jobList;
  } catch (error) {
    throw error;
  }
};

const scrapeJobData = async () => {
  try {
    const [jobListTechnopark, jobListInfopark, jobListCyberpark] =
      await Promise.all([
        scrapeJobsFromSource(
          "https://technopark.org/api/paginated-jobs",
          "Technopark"
        ),
        scrapeJobsFromSource(
          "https://infopark.in/companies/job-search",
          "Infopark"
        ),
        scrapeJobsFromSource(
          "https://www.cyberparkkerala.org/jm-ajax/get_listings/",
          "Cyberpark"
        ),
      ]);

    const convertToDDMMYYYY = (date) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(date).toLocaleDateString("en-GB", options);
    };

    const convertJobList = (jobList) => {
      const excludedCompaniesRegex = /galtech|altos|idatalytics/i; // i flag for case-insensitive matching
      return jobList
        .filter((job) => !excludedCompaniesRegex.test(job.companyName))
        .map((job) => ({
          ...job,
          deadline: convertToDDMMYYYY(job.deadline),
        }));
    };

    const jobList = [
      ...convertJobList(jobListTechnopark),
      ...convertJobList(jobListInfopark),
      ...convertJobList(jobListCyberpark),
    ];
    console.log(jobListCyberpark);
  } catch (error) {
    console.error("Error scraping job data:", error);
    return [];
  }
};

module.exports = scrapeJobData;
