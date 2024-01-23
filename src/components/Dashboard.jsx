import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [jobList, setJobList] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8081/api/jobs", {});
        setJobList(response.data);
      } catch (error) {
        console.error("Error fetching job data:", error);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="container mx-auto p-4">
      {/* Job Data Table */}
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Company Name</th>
            <th className="py-2 px-4 border-b">Job Role</th>
            <th className="py-2 px-4 border-b">Deadline</th>
            <th className="py-2 px-4 border-b">Job Link</th>
            <th className="py-2 px-4 border-b">Tech Park</th>
          </tr>
        </thead>
        <tbody>
          {/* Loop through your job data to populate the table rows */}
          {jobList &&
            jobList.map((job, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b">{job.companyName}</td>
                <td className="py-2 px-4 border-b">{job.jobRole}</td>
                <td className="py-2 px-4 border-b">{job.deadline}</td>
                <td className="py-2 px-4 border-b">
                  <a
                    href={job.jobLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                  >
                    View Job
                  </a>
                </td>
                <td className="py-2 px-4 border-b">{job.techPark}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
