import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import axiosInstance from "../api/axiosInstance";

const ROLE_LABELS = {
  admin: "Admin guide",
  mentor: "Mentor guide",
  student: "Student guide",
  guest: "Bootcamp guide",
};

const QUICK_QUESTIONS = {
  guest: ["What is BMS?", "What are the tracks?", "How do I join?"],
  student: ["Where are my assignments?", "How is attendance tracked?", "How do I submit work?"],
  mentor: ["How do I manage sessions?", "How do I grade work?", "How do I post resources?"],
  admin: ["What can admins manage?", "How do I manage users?", "How do I create a session?"],
};

const GUEST_ANSWERS = [
  {
    terms: ["what is bms", "what is this", "about", "platform"],
    answer: "BMS is the ASTU MSJ Bootcamp Management System. It brings learning tracks, sessions, assignments, attendance, announcements, resources, and progress into one place.",
  },
  {
    terms: ["track", "course", "learn", "program"],
    answer: "The bootcamp currently offers Web Development, Competitive Programming, and Mobile Development. Each track combines guided lessons, practice, projects, and mentorship.",
  },
  {
    terms: ["join", "register", "sign up", "signup", "application", "eligib"],
    answer: "Use the Join Now or Start Your Application button to create an account. You will need a laptop, a stable internet connection, and a passion for learning.",
  },
  {
    terms: ["free", "cost", "price", "fee"],
    answer: "The ASTU MSJ Bootcamp is a community initiative and is free for eligible students.",
  },
  {
    terms: ["contact", "email", "support", "help"],
    answer: "For direct support, contact astumsjbootcamp2026@gmail.com. You can also sign in to use the tools available for your role.",
  },
];

const ROLE_ANSWERS = {
  student: [
    { terms: ["assignment", "task", "work"], answer: "Students can find assignments from their dashboard or Assignments page. Open a task to read its instructions, attach your solution when required, and submit it before the deadline." },
    { terms: ["attendance", "present", "join session"], answer: "Open your session and join it during the scheduled time. The system records your presence and shows your attendance status in the Attendance area." },
    { terms: ["submit", "submission", "github", "solution"], answer: "Open the relevant assignment, choose your submission method, add your text, GitHub link, or files, then submit. You can resubmit when a reviewer requests changes." },
    { terms: ["resource", "material", "file"], answer: "Session resources are available from Sessions or the student Resources page. Students can open links and download files shared by admins and mentors." },
    { terms: ["announcement", "notice"], answer: "Check the Announcements page and your notifications for bootcamp updates, session changes, and important deadlines." },
    { terms: ["advice", "study", "improve", "stuck", "learn"], answer: "Break your work into small steps, read the assignment carefully, test your solution often, and ask your mentor for feedback when you are stuck. Keep your submissions and attendance up to date." },
  ],
  mentor: [
    { terms: ["session", "manage session", "class"], answer: "Mentors can open their assigned sessions, review session details, take attendance for assigned learners, create tasks, and support their mentees." },
    { terms: ["grade", "review", "submission", "feedback"], answer: "Open an assignment from your mentor area, review submissions from your assigned learners, enter a score and feedback, then save the grade or request a resubmission." },
    { terms: ["resource", "upload", "material", "file"], answer: "Mentors can upload resources to sessions they manage. You can edit or delete only resources that you uploaded; admin-owned resources remain protected." },
    { terms: ["attendance", "present", "late"], answer: "Use the session Attendance area to record Present, Absent, Late, or Excused status for students assigned to you." },
    { terms: ["assignment", "task", "create"], answer: "Mentors can create assignments for their assigned students from the mentor assignments area or from an assigned session." },
    { terms: ["advice", "support", "help learner", "help student"], answer: "Give learners clear expectations, useful feedback, and manageable next steps. Use assignments, sessions, attendance, and announcements to keep your assigned learners supported." },
  ],
  admin: [
    { terms: ["user", "account", "approve", "manage users", "student information", "student info", "student record"], answer: "Admins can review approved student accounts, roles, status, and available progress information from Admin User Management. Handle student data only through authorized admin pages." },
    { terms: ["session", "create session", "class"], answer: "Admins can create and edit sessions, assign them to batches, set Google Meet links and times, manage resources, and review session attendance." },
    { terms: ["batch", "cohort", "group"], answer: "Use Admin Batches to organize students and mentors into cohorts, view batch membership, and keep session access aligned with each batch." },
    { terms: ["resource", "upload", "material"], answer: "Admins can add, edit, and delete resources in sessions. Admin-owned resources cannot be changed or removed by mentors." },
    { terms: ["attendance", "report", "monitor"], answer: "Admins can review and manage attendance across the bootcamp from the Admin Attendance area." },
    { terms: ["assignment", "task", "submission", "grade"], answer: "Admins can oversee assignments and submissions across the bootcamp. Mentors handle learner feedback and grading within their assigned scope." },
  ],
};

const MENTOR_PRIVATE_TERMS = ["student name", "student email", "student phone", "student profile", "student record", "all students", "other student", "private student", "student information", "student info"];

function findAnswer(question, role) {
  const normalizedQuestion = question.toLowerCase().trim();
  if (role === "mentor" && MENTOR_PRIVATE_TERMS.some((term) => normalizedQuestion.includes(term))) {
    return "I can explain mentor workflows, but I cannot provide private student records or information about learners outside your assigned scope. Use the authorized mentor pages for your assigned learners.";
  }

  if (role === "guest") {
    const match = GUEST_ANSWERS.find(({ terms }) => terms.some((term) => normalizedQuestion.includes(term)));
    return match?.answer || "I can answer general questions about the ASTU MSJ Bootcamp, tracks, registration, requirements, and support. Sign in to get guidance for your role too.";
  }

  const roleAnswers = ROLE_ANSWERS[role] || [];
  const match = roleAnswers.find(({ terms }) => terms.some((term) => normalizedQuestion.includes(term)));

  return match?.answer || `I can answer only ${ROLE_LABELS[role].toLowerCase()} questions. Try asking about your authorized ${role} tools and workflow.`;
}

function dateText(value) {
  return value ? new Date(value).toLocaleDateString() : "No date";
}

function answerFromData(question, role, roleData) {
  const normalizedQuestion = question.toLowerCase().trim();
  if (normalizedQuestion.includes("password")) {
    return "I cannot view, reveal, or change passwords. Use Settings or Forgot Password to manage your password securely.";
  }

  if (role === "student") {
    const dashboard = roleData?.dashboard;
    const assignments = dashboard?.assignments || [];
    const deadlines = assignments.filter((item) => !item.submission || item.submission.status === "resubmission_requested").sort((a, b) => new Date(a.assignment.deadline) - new Date(b.assignment.deadline));
    const graded = (dashboard?.assignments || []).filter((item) => item.submission?.status === "graded");
    if (normalizedQuestion.includes("grade") || normalizedQuestion.includes("mark") || normalizedQuestion.includes("score")) {
      if (!graded.length) return "You do not have graded submissions yet. Check Assignments for work awaiting review.";
      return `Your average grade is ${dashboard.averageGrade || 0}%. ${graded.map((item) => `${item.assignment.title}: ${item.submission.score}/${item.assignment.maximumScore}`).join("; ")}.`;
    }
    if (normalizedQuestion.includes("deadline") || normalizedQuestion.includes("due") || normalizedQuestion.includes("task")) {
      return deadlines.length ? `Your upcoming tasks are: ${deadlines.slice(0, 6).map((item) => `${item.assignment.title} due ${dateText(item.assignment.deadline)}`).join("; ")}.` : "You have no outstanding task deadlines.";
    }
    if (normalizedQuestion.includes("progress")) return `Your tracked progress is ${dashboard.completedTopics || 0} of ${dashboard.totalTopics || 0} topics completed (${dashboard.totalTopics ? Math.round((dashboard.completedTopics / dashboard.totalTopics) * 100) : 0}%).`;
    if (normalizedQuestion.includes("announcement") || normalizedQuestion.includes("notice")) return dashboard.announcements?.length ? `Latest announcements: ${dashboard.announcements.slice(0, 5).map((item) => `${item.title} (${dateText(item.publishDate)})`).join("; ")}.` : "There are no current announcements for you.";
  }

  if (role === "mentor") {
    const students = roleData?.dashboard?.assignedStudents || [];
    const student = students.find((item) => normalizedQuestion.includes(item.fullName.toLowerCase()));
    if (student && (normalizedQuestion.includes("progress") || normalizedQuestion.includes("attendance") || normalizedQuestion.includes("risk") || normalizedQuestion.includes("student"))) {
      return `${student.fullName}: attendance ${student.attendancePercentage}%, progress ${student.progressCompleted}/${student.progressTotal} topics completed${student.atRisk ? ", currently at risk" : ", currently on track"}.`;
    }
    if (normalizedQuestion.includes("at risk") || normalizedQuestion.includes("risk")) return students.filter((item) => item.atRisk).length ? `Learners needing attention: ${students.filter((item) => item.atRisk).map((item) => item.fullName).join(", ")}.` : "No assigned learners are currently marked at risk.";
    if (normalizedQuestion.includes("daily plan") || normalizedQuestion.includes("today") || normalizedQuestion.includes("plan")) return `Daily plan: review ${roleData.dashboard.pendingGrading?.length || 0} pending submissions, check attendance for ${students.length} assigned learners, follow up with learners needing support, and review your upcoming sessions.`;
    if (normalizedQuestion.includes("announcement")) return roleData.dashboard.announcements?.length ? `Your latest announcements are: ${roleData.dashboard.announcements.map((item) => item.title).join(", ")}.` : "You have not posted any announcements yet.";
  }

  if (role === "admin") {
    const users = roleData?.users || [];
    const batches = roleData?.batches || [];
    const student = users.find((item) => item.role === "student" && normalizedQuestion.includes(item.fullName.toLowerCase()));
    if (student) {
      const progress = (roleData.progress || []).filter((item) => String(item.student?._id || item.student) === String(student._id));
      const attendance = (roleData.attendance || []).filter((item) => String(item.student?._id || item.student) === String(student._id));
      const completed = progress.filter((item) => item.status === "Completed").length;
      const present = attendance.filter((item) => item.status === "Present").length;
      return `${student.fullName} is an active ${student.role}. Progress: ${completed}/${progress.length} topics completed. Attendance: ${attendance.length ? Math.round((present / attendance.length) * 100) : 0}%. Assigned mentor: ${student.mentor?.fullName || "none"}.`;
    }
    if (normalizedQuestion.includes("batch") || normalizedQuestion.includes("cohort")) return batches.length ? `Batches: ${batches.map((item) => `${item.name} (${item.status}, ${item.students?.length || 0} students, ${item.mentors?.length || 0} mentors)`).join("; ")}.` : "No batches are currently available.";
    if (normalizedQuestion.includes("mentor")) return `There are ${users.filter((item) => item.role === "mentor").length} mentors and ${users.filter((item) => item.role === "student").length} students in the user records.`;
    if (normalizedQuestion.includes("at risk") || normalizedQuestion.includes("risk")) return roleData.atRisk?.length ? `Students currently needing attention: ${roleData.atRisk.join(", ")}.` : "No at-risk students were identified from the current progress and attendance records.";
    if (normalizedQuestion.includes("achievement")) return "Student achievement status is calculated from submissions, completed topics, coding activity, and attendance. Open a student report to inspect their current progress.";
  }

  return findAnswer(question, role);
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "guest";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [roleData, setRoleData] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: `Hi! I am your ${ROLE_LABELS[role].toLowerCase()}. Ask me about the bootcamp or choose a question below.` },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    setSelectedFile(null);
    if (role === "guest") {
      setMessages([{ id: `guest-${Date.now()}`, from: "bot", text: `Hi! I am your ${ROLE_LABELS[role].toLowerCase()}. Ask me about the bootcamp or choose a question below.` }]);
      return undefined;
    }
    axiosInstance.get("/chat/history").then((response) => {
      if (!active) return;
      const history = response.data.messages || [];
      setMessages(history.length ? history : [{ id: `welcome-${Date.now()}`, from: "bot", text: `Hi! I am your ${ROLE_LABELS[role].toLowerCase()}. Ask me about the bootcamp or choose a question below.` }]);
    }).catch(() => {
      if (active) setMessages([{ id: `welcome-${Date.now()}`, from: "bot", text: `Hi! I am your ${ROLE_LABELS[role].toLowerCase()}. Ask me about the bootcamp or choose a question below.` }]);
    });
    return () => { active = false; };
  }, [role, user?._id]);

  useEffect(() => {
    if (role === "guest") {
      return;
    }
    const requests = [axiosInstance.get("/sessions"), axiosInstance.get("/assignments"), axiosInstance.get("/announcements")];
    if (role === "student") requests.push(axiosInstance.get("/students/dashboard"));
    if (role === "mentor") requests.push(axiosInstance.get("/mentors/dashboard"));
    if (role === "admin") requests.push(axiosInstance.get("/users"), axiosInstance.get("/batches"), axiosInstance.get("/progress"), axiosInstance.get("/attendance"));
    Promise.all(requests).then((responses) => {
      const nextData = { sessions: responses[0].data.sessions || [], assignments: responses[1].data.assignments || [], announcements: responses[2].data.announcements || [] };
      if (role === "student") nextData.dashboard = responses[3].data.dashboard;
      if (role === "mentor") nextData.dashboard = responses[3].data.dashboard;
      if (role === "admin") {
        nextData.users = responses[3].data.users || [];
        nextData.batches = responses[4].data.batches || [];
        nextData.progress = responses[5].data.progress || [];
        nextData.attendance = responses[6].data.attendance || [];
        const progressByStudent = new Map();
        nextData.progress.forEach((item) => { const id = String(item.student?._id || item.student); progressByStudent.set(id, [...(progressByStudent.get(id) || []), item]); });
        const attendanceByStudent = new Map();
        nextData.attendance.forEach((item) => { const id = String(item.student?._id || item.student); attendanceByStudent.set(id, [...(attendanceByStudent.get(id) || []), item]); });
        nextData.atRisk = nextData.users.filter((item) => item.role === "student").filter((item) => { const progress = progressByStudent.get(String(item._id)) || []; const attendance = attendanceByStudent.get(String(item._id)) || []; const completed = progress.filter((entry) => entry.status === "Completed").length; const present = attendance.filter((entry) => entry.status === "Present").length; return (progress.length > 0 && completed / progress.length < 0.5) || (attendance.length > 0 && present / attendance.length < 0.75); }).map((item) => item.fullName);
      }
      setRoleData(nextData);
    }).catch(() => setRoleData(null));
  }, [role]);

  const dataLoading = role !== "guest" && !roleData;

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const ask = async (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || sending) return;
    setSending(true);
    const fileForQuestion = role === "student" ? selectedFile : null;
    setMessages((current) => [...current, { id: `${Date.now()}-question`, from: "user", text: trimmedQuestion, fileName: fileForQuestion?.name || "" }]);
    setInput("");
    setSelectedFile(null);
    try {
      const formData = new FormData();
      formData.append("question", trimmedQuestion);
      formData.append("context", JSON.stringify({ role, data: roleData }));
      if (fileForQuestion) formData.append("file", fileForQuestion);
      const response = await axiosInstance.post("/chat/message", formData);
      setMessages(response.data.messages || []);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-answer`, from: "bot", text: answerFromData(trimmedQuestion, role, roleData) }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section className="flex h-[min(620px,calc(100vh-120px))] w-[min(380px,calc(100vw-2rem))] min-w-0 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#c89b7b]/40 bg-[#1e1713] text-[#f5efe6] shadow-2xl shadow-black/40" aria-label="ASTU MSJ chatbot">
          <header className="flex items-center justify-between border-b border-[#4a3b32] bg-[#2a1f19] px-4 py-3">
            <div>
              <p className="text-sm font-bold">ASTU MSJ Guide</p>
              <p className="text-[11px] text-[#c89b7b]">{ROLE_LABELS[role]}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#a39081] hover:bg-[#3a2e26] hover:text-[#f5efe6]" aria-label="Close chatbot">×</button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.from === "user" ? "rounded-br-sm bg-[#c89b7b] text-[#1e1713]" : "rounded-bl-sm bg-[#2d231d] text-[#f5efe6]"}`}>
                  <p className="break-words">{message.text}</p>
                  {message.fileName && <p className="mt-1 break-all text-[10px] opacity-70">Attached: {message.fileName}</p>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#4a3b32] p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {(QUICK_QUESTIONS[role] || QUICK_QUESTIONS.guest).map((question) => (
                <button key={question} type="button" onClick={() => ask(question)} className="shrink-0 rounded-full border border-[#6e5748] px-2.5 py-1.5 text-[11px] text-[#d8b493] hover:border-[#c89b7b] hover:bg-[#2d231d]">{question}</button>
              ))}
            </div>
            {selectedFile && <p className="mb-2 truncate text-[11px] text-[#d8b493]">File: {selectedFile.name}</p>}
            <form onSubmit={handleSubmit} className="flex gap-2">
              {role === "student" && <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#4a3b32] text-lg text-[#d8b493] hover:bg-[#2d231d]" title="Ask about a file">
                <span aria-hidden="true">📎</span>
                <input type="file" accept=".pdf,.txt,.md,.doc,.docx" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
              </label>}
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question..." aria-label="Ask the chatbot a question" className="min-w-0 flex-1 rounded-lg border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] outline-none placeholder:text-[#806b5d] focus:border-[#c89b7b]" />
              <button type="submit" disabled={dataLoading || sending} className="rounded-lg bg-[#c89b7b] px-3 py-2 text-sm font-bold text-[#1e1713] hover:brightness-110 disabled:cursor-wait disabled:opacity-60" aria-label="Send question">{dataLoading || sending ? "..." : "Send"}</button>
            </form>
          </div>
        </section>
      )}

      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c89b7b]/60 bg-[#2c1a11] text-2xl shadow-xl shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#3b2519]" aria-expanded={open} aria-label={open ? "Close chatbot" : "Open chatbot"} title={open ? "Close chatbot" : "Open chatbot"}>
        <span aria-hidden="true">🤖</span>
      </button>
    </div>
  );
}
