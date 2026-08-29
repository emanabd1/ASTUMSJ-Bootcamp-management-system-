import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://astumsj-bootcamp-management-system.onrender.com/api";

export default function MentorStudentDetailPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/mentors/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(response.data.student);
        setAttendance(response.data.attendance || []);
        setProgress(response.data.progress || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load student details.");
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId]);

  if (loading) return <p className="text-[#a39081]">Loading student details...</p>;
  if (error) return <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">{error}</p>;
  if (!student) return <p className="text-[#a39081]">Student details are unavailable.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/mentor/dashboard" className="text-sm text-[#c89b7b] hover:underline">Back to dashboard</Link>
        <h1 className="mt-3 text-3xl font-extrabold text-[#f5efe6]">{student.fullName}</h1>
        <p className="mt-1 text-sm text-[#a39081]">Assigned student details</p>
      </div>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
        <h2 className="font-bold text-[#c89b7b]">Student Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-[#a39081]">Full name</p><p className="mt-1 font-semibold">{student.fullName || "Not available"}</p></div>
          <div><p className="text-xs text-[#a39081]">Email</p><p className="mt-1 font-semibold">{student.email || "Not available"}</p></div>
          <div><p className="text-xs text-[#a39081]">Department</p><p className="mt-1 font-semibold">{student.department || "Not available"}</p></div>
          <div><p className="text-xs text-[#a39081]">Year of study</p><p className="mt-1 font-semibold">{student.yearOfStudy || "Not available"}</p></div>
          <div><p className="text-xs text-[#a39081]">Gender</p><p className="mt-1 font-semibold">{student.gender || "Not available"}</p></div>
          <div><p className="text-xs text-[#a39081]">Status</p><p className="mt-1 font-semibold">{student.status || "Not available"}</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
        <h2 className="font-bold text-[#c89b7b]">Attendance</h2>
        {!attendance.length ? <p className="mt-3 text-sm text-[#a39081]">No attendance records.</p> : <div className="mt-3 space-y-2">{attendance.map((record) => <div key={record._id} className="flex justify-between rounded-lg border border-[#4a3b32] p-3 text-sm"><span>{new Date(record.date).toLocaleDateString()}</span><span>{record.status}</span></div>)}</div>}
      </section>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
        <h2 className="font-bold text-[#c89b7b]">Progress</h2>
        {!progress.length ? <p className="mt-3 text-sm text-[#a39081]">No progress records.</p> : <div className="mt-3 space-y-2">{progress.map((record) => <div key={record._id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-[#4a3b32] p-3 text-sm"><span>{record.topic || record.module || "Progress"}</span><span>{record.status || "Not Started"}</span></div>)}</div>}
      </section>
    </div>
  );
}
