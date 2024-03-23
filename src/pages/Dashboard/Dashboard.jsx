import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Spinner from "../../components/Spinner";

const Dashboard = () => {
  const [jobList, setJobList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://fresher-job-finder.vercel.app/api/jobs"
        );
        const sortedJobs = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setJobList(sortedJobs);
      } catch (error) {
        console.error("Error fetching job data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getToday = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB");
    return formattedDate;
  };

  const isJobNew = (createdAt) => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return new Date(createdAt) > twentyFourHoursAgo;
  };

  const filteredJobs = useMemo(() => {
    return jobList.filter((job) => {
      const isMatch =
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.techPark.toLowerCase().includes(searchTerm.toLowerCase());
      return isMatch && (!filter || job.deadline === filter);
    });
  }, [jobList, searchTerm, filter]);

  return (
    <div className="mx-auto max-w-screen-lg">
      <header className="heading text-center">
        <h1 className="font-semibold">
          Welcome,{" "}
          {user ? (
            user.name.split(" ")[0].toLowerCase()
          ) : (
            <div>
              <span className="text-sm text-gray-700">
                Create an account to get instant job notifications. Contribute
                at{" "}
              </span>
              <span className="">
                <a
                  href="https://github.com/manupranav/fresher-job-finder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-800 text-lg hover:underline visited:text-purple-700 focus:underline font-semibold"
                >
                  GitHub
                </a>
              </span>
            </div>
          )}
        </h1>
        <h2 className="text-gray-700 text-2xl mt-7">JOB DASHBOARD</h2>
      </header>

      <div className="bg-white border p-3 rounded-lg shadow-lg">
        {/* Search Bar */}
        <label htmlFor="search" className="sr-only">
          Search:
        </label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by company name, job role, or techpark"
          className="bg-gray-100 text-gray-700 rounded-lg block w-full px-4 py-2 mb-4"
        />

        {/* Job List */}
        <div className="overflow-x-auto">
          {loading ? (
            <Spinner />
          ) : (
            <table className="w-full text-sm text-left text-gray-700 border rounded-lg overflow-hidden">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Sl No</th>
                  <th className="px-6 py-3">Company Name</th>
                  <th className="px-6 py-3">Job Role</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3">Job Link</th>
                  <th className="px-6 py-3 rounded-tr-lg">Tech Park</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, index) => (
                  <tr key={job._id} className="bg-white">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">{job.companyName}</td>
                    <td className="py-2 px-4">
                      {job.jobRole}{" "}
                      {getToday() === job.deadline ? (
                        <span
                          className="new-indicator"
                          style={{
                            background: "red",
                            borderRadius: "50%",
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            marginLeft: "5px",
                          }}
                        ></span>
                      ) : isJobNew(job.createdAt) ? (
                        <span
                          className="new-indicator"
                          style={{
                            background: "green",
                            borderRadius: "50%",
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            marginLeft: "5px",
                          }}
                        ></span>
                      ) : null}
                    </td>
                    <td className="py-2 px-4">{job.deadline}</td>
                    <td className="py-2 px-4">
                      <a
                        href={job.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 visited:text-gray-700 hover:underline focus:underline"
                      >
                        View Job
                      </a>
                    </td>
                    <td className="py-2 px-4">{job.techPark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
