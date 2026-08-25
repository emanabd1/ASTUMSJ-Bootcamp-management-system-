import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";

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

export default function ChatbotWidget() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "guest";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: `Hi! I am your ${ROLE_LABELS[role].toLowerCase()}. Ask me about the bootcamp or choose a question below.` },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const ask = (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-question`, from: "user", text: trimmedQuestion },
      { id: `${Date.now()}-answer`, from: "bot", text: findAnswer(trimmedQuestion, role) },
    ]);
    setInput("");
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
                <p className={`max-w-[88%] break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.from === "user" ? "rounded-br-sm bg-[#c89b7b] text-[#1e1713]" : "rounded-bl-sm bg-[#2d231d] text-[#f5efe6]"}`}>
                  {message.text}
                </p>
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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question..." aria-label="Ask the chatbot a question" className="min-w-0 flex-1 rounded-lg border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] outline-none placeholder:text-[#806b5d] focus:border-[#c89b7b]" />
              <button type="submit" className="rounded-lg bg-[#c89b7b] px-3 py-2 text-sm font-bold text-[#1e1713] hover:brightness-110" aria-label="Send question">Send</button>
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
