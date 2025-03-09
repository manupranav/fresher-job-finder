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

    // Handle Infopark by scraping all pages
    if (techPark === "Infopark") {
      // Load the first page to determine the total number of pages
      let $ = cheerio.load(response.data);

      // Find pagination links (the <a> tags within the <ul class="pagination">)
      const paginationLinks = $("ul.pagination li.page-item a");

      let totalPages = 1;
      if (paginationLinks.length > 0) {
        // Extract the page numbers, filter out non-numeric values, and get the maximum
        totalPages = Math.max(
          ...paginationLinks
            .map((i, el) => parseInt($(el).text().trim()))
            .get()
            .filter((num) => !isNaN(num))
        );
      }

      // Build the list of page URLs
      const pageUrls = [];
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1) {
          pageUrls.push(sourceUrl);
        } else {
          pageUrls.push(`${sourceUrl}?page=${i}`);
        }
      }

      // Request all pages in parallel
      const pageRequests = pageUrls.map((url) =>
        axios.get(url, {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        })
      );
      const pageResponses = await Promise.all(pageRequests);

      // Process each page's content
      pageResponses.forEach((pageResponse) => {
        const $$ = cheerio.load(pageResponse.data);
        const jobs = $$("#job-list tbody tr")
          .map((index, element) => {
            const jobRole = $$(element).find("td.head").text().trim();
            const companyName = $$(element).find("td.date").text().trim();
            const deadline = $$(element).find("td:nth-child(3)").text().trim();
            const jobLink = $$(element).find("td.btn-sec a").attr("href");

            const isMatchingJob = fresherKeywords.some((keyword) =>
              jobRole.toLowerCase().includes(keyword.toLowerCase())
            );

            return isMatchingJob
              ? { companyName, jobRole, deadline, jobLink, techPark }
              : null;
          })
          .get()
          .filter(Boolean);

        jobList.push(...jobs);
      });
    } else if (techPark === "Technopark") {
      // Existing Technopark code...
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
      // Fallback scraping for other tech parks
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
                  return null;
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

    const convertToDDMMYYYY = (date) => {
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Date(date).toLocaleDateString("en-GB", options);
    };

    const convertJobList = (jobList) => {
      const excludedCompaniesRegex = /(galtech|altos|idatalytics|mashuptech)/i;
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
    ];
    return jobList;
  } catch (error) {
    console.error("Error scraping job data:", error);
    return [];
  }
};

module.exports = scrapeJobData;
