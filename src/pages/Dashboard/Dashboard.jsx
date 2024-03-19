import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const Dashboard = () => {
  const [jobList, setJobList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {}, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://fresher-job-finder.vercel.app/api/jobs",
          {}
        );

        // Sort jobs based on createdAt time in descending order
        const sortedJobs = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setJobList(sortedJobs);
      } catch (error) {
        console.error("Error fetching job data:", error);
      }
    };

    fetchData();
  }, []);

  // Function to check if a job was created in the last 24 hours
  const isJobNew = (createdAt) => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return new Date(createdAt) > twentyFourHoursAgo;
  };

  const getToday = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB");
    return formattedDate;
  };

  // Filter job list based on search term and filter
  const filteredJobs = jobList.filter((job) => {
    const isMatch =
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.techPark.toLowerCase().includes(searchTerm.toLowerCase());

    return isMatch && (!filter || job.deadline === filter);
  });

  return (
    <>
      <div>
        <section className="heading text-center">
          <h1 className="font-semibold">
            Welcome,{" "}
            {user ? (
              user.name.split(" ")[0].toLowerCase()
            ) : (
              <span className="text-sm lowercase text-gray-600">
                Create an account to get instant job notifications.
              </span>
            )}
          </h1>
          <p className="text-gray-600 text-2xl">Job Dashboard</p>
        </section>

        <div className="mx-auto max-w-screen-lg bg-white p-4 border rounded-lg shadow-lg">
          {/* Search Bar */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company name, job role or techpark"
            className="bg-gray-100 text-gray-700 rounded-lg block w-full px-4 py-2 mb-4"
          />

          {/* Job List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 border rounded-lg overflow-hidden">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-tl-lg">
                    Sl No
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Company Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Job Role
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Deadline
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Job Link
                  </th>
                  <th scope="col" className="px-6 py-3 rounded-tr-lg">
                    Tech Park
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, index) => (
                  <tr className="bg-white" key={job.id}>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
