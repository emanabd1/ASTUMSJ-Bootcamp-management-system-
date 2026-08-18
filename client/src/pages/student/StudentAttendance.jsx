import React from "react";

const StudentAttendance = () => {
  // Temporary data for now — later we'll connect this to the backend
  const attendanceRecords = [
    { date: "Aug 10, 2026", status: "Present" },
    { date: "Aug 11, 2026", status: "Present" },
    { date: "Aug 12, 2026", status: "Late" },
    { date: "Aug 13, 2026", status: "Absent" },
    { date: "Aug 14, 2026", status: "Present" },
  ];

  const presentCount = attendanceRecords.filter(
    (record) => record.status === "Present"
  ).length;

  const percentage = Math.round(
    (presentCount / attendanceRecords.length) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500">
          View your attendance history and overall attendance.
        </p>
      </div>

      {/* Attendance Summary */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Attendance Percentage</p>

        <div className="mt-2 flex items-end gap-3">
          <h2 className="text-4xl font-bold text-blue-600">
            {percentage}%
          </h2>
          <span className="mb-1 text-sm text-gray-500">
            Overall attendance
          </span>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Attendance History */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-gray-800">
            Attendance History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {attendanceRecords.map((record, index) => (
                <tr
                  key={index}
                  className="border-t text-sm text-gray-700"
                >
                  <td className="px-6 py-4">{record.date}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-700"
                          : record.status === "Absent"
                          ? "bg-red-100 text-red-700"
                          : record.status === "Late"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;