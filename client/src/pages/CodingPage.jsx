import React, {
  useEffect,
  useState,
} from "react";

import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";

const SOURCE_HOSTS = {
  leetcode: "leetcode.com",
  codeforces: "codeforces.com",
  github: "github.com",
};

function isValidSourceUrl(
  platform,
  value
) {
  const expectedHost =
    SOURCE_HOSTS[platform];

  if (!expectedHost || !value) {
    return false;
  }

  try {
    const parsed = new URL(
      String(value).trim()
    );

    if (
      !["http:", "https:"].includes(
        parsed.protocol
      )
    ) {
      return false;
    }

    const hostname =
      parsed.hostname.toLowerCase();

    return (
      hostname === expectedHost ||
      hostname ===
        `www.${expectedHost}`
    );
  } catch {
    return false;
  }
}

export default function CodingPage() {
  const { user } = useAuth();

  const [stats, setStats] =
    useState({});

  const [challenges, setChallenges] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [form, setForm] =
    useState({
      title: "",
      platform: "leetcode",
      problemUrl: "",
      description: "",
      dueDate: "",
      assignedStudents: [],
    });

  const [activity, setActivity] =
    useState({
      platform: "leetcode",
      url: "",
      note: "",
      challenge: "",
    });

  const [msg, setMsg] =
    useState("");

  const [error, setError] =
    useState("");

  const load = async () => {
    try {
      const requests = [
        axiosInstance.get(
          "/coding/challenges"
        ),
      ];

      if (
        user?.role === "student" ||
        user?.role === "mentor"
      ) {
        requests.push(
          axiosInstance.get(
            "/coding/stats"
          )
        );
      }

      if (user?.role === "admin") {
        requests.push(
          axiosInstance.get(
            "/users?role=student"
          )
        );
      }

      const responses =
        await Promise.all(requests);

      setChallenges(
        responses[0].data
          .challenges || []
      );

      let index = 1;

      if (
        user?.role === "student" ||
        user?.role === "mentor"
      ) {
        setStats(
          responses[index].data.stats ||
            {}
        );

        index += 1;
      }

      if (user?.role === "admin") {
        setStudents(
          responses[index].data
            .users || []
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load coding data."
      );
    }
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  /*
   * ADMIN RELEASE PRACTICE
   */
  const create = async (event) => {
    event.preventDefault();

    setMsg("");
    setError("");

    if (!form.title.trim()) {
      setError(
        "Challenge title is required."
      );
      return;
    }

    if (
      !isValidSourceUrl(
        form.platform,
        form.problemUrl
      )
    ) {
      setError(
        `Invalid URL. A ${form.platform} practice must use a ${SOURCE_HOSTS[form.platform]} URL.`
      );
      return;
    }

    if (
      form.assignedStudents.length ===
      0
    ) {
      setError(
        "Select at least one student."
      );
      return;
    }

    try {
      await axiosInstance.post(
        "/coding/challenges",
        {
          ...form,

          title:
            form.title.trim(),

          problemUrl:
            form.problemUrl.trim(),

          description:
            form.description.trim(),
        }
      );

      setMsg(
        "Coding practice released successfully."
      );

      setForm({
        title: "",
        platform: "leetcode",
        problemUrl: "",
        description: "",
        dueDate: "",
        assignedStudents: [],
      });

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not release coding practice."
      );
    }
  };

  /*
   * STUDENT RECORD ACTIVITY
   */
  const submit = async (event) => {
    event.preventDefault();

    setMsg("");
    setError("");

    if (
      !isValidSourceUrl(
        activity.platform,
        activity.url
      )
    ) {
      setError(
        `Invalid URL. A ${activity.platform} activity must use a ${SOURCE_HOSTS[activity.platform]} URL.`
      );
      return;
    }

    try {
      await axiosInstance.post(
        "/coding/activity",
        {
          ...activity,
          url: activity.url.trim(),
        }
      );

      setMsg(
        "Coding activity recorded."
      );

      setActivity({
        ...activity,
        url: "",
        note: "",
      });

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not record activity."
      );
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold">
          Coding Practice
        </h1>

        <p className="text-xs text-[#a39081]">
          Release source-verified coding
          practices and track student
          activity.
        </p>
      </div>

      {msg && (
        <p className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">
          {msg}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {/* 
        STREAKS ARE ONLY SHOWN TO STUDENTS.
        ADMIN DOES NOT SEE STREAK CARDS.
      */}
      {user?.role ===
        "student" && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "leetcode",
            "codeforces",
            "github",
          ].map((platform) => (
            <div
              key={platform}
              className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"
            >
              <p className="text-xs uppercase text-[#a39081]">
                {platform}
              </p>

              <p className="text-3xl font-bold text-[#c89b7b]">
                {stats[user._id]?.[
                  platform
                ]?.streak || 0}{" "}
                days
              </p>

              <p className="text-xs text-[#a39081]">
                {stats[user._id]?.[
                  platform
                ]?.count || 0}{" "}
                recorded activities
              </p>
            </div>
          ))}
        </div>
      )}

      {/* STUDENT ACTIVITY */}
      {user?.role ===
        "student" && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6"
        >
          <h2 className="font-bold">
            Record Completed Problem /
            Activity
          </h2>

          <select
            className={field}
            value={
              activity.platform
            }
            onChange={(event) =>
              setActivity({
                ...activity,
                platform:
                  event.target
                    .value,
                url: "",
              })
            }
          >
            <option value="leetcode">
              LeetCode
            </option>

            <option value="codeforces">
              Codeforces
            </option>

            <option value="github">
              GitHub
            </option>
          </select>

          <input
            required
            type="url"
            className={field}
            placeholder={`Must be a ${SOURCE_HOSTS[activity.platform]} URL`}
            value={activity.url}
            onChange={(event) =>
              setActivity({
                ...activity,
                url: event.target
                  .value,
              })
            }
          />

          <textarea
            className={field}
            placeholder="Notes (optional)"
            value={activity.note}
            onChange={(event) =>
              setActivity({
                ...activity,
                note: event.target
                  .value,
              })
            }
          />

          <button className="rounded-xl bg-[#c89b7b] px-5 py-2 text-xs font-bold text-[#1e1713]">
            Record Activity
          </button>
        </form>
      )}

      {/* ADMIN RELEASE PRACTICE */}
      {user?.role ===
        "admin" && (
        <form
          onSubmit={create}
          className="space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6"
        >
          <h2 className="font-bold">
            Release Coding Practice
          </h2>

          <p className="text-xs text-[#a39081]">
            The URL must belong to the
            selected question source.
          </p>

          <input
            required
            className={field}
            placeholder="Challenge title"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title:
                  event.target
                    .value,
              })
            }
          />

          <select
            className={field}
            value={form.platform}
            onChange={(event) =>
              setForm({
                ...form,
                platform:
                  event.target
                    .value,
                problemUrl: "",
              })
            }
          >
            <option value="leetcode">
              LeetCode
            </option>

            <option value="codeforces">
              Codeforces
            </option>

            <option value="github">
              GitHub
            </option>
          </select>

          <input
            required
            type="url"
            className={field}
            placeholder={`Question URL — ${SOURCE_HOSTS[form.platform]}`}
            value={
              form.problemUrl
            }
            onChange={(event) =>
              setForm({
                ...form,
                problemUrl:
                  event.target
                    .value,
              })
            }
          />

          <textarea
            className={field}
            placeholder="Description"
            value={
              form.description
            }
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.target
                    .value,
              })
            }
          />

          <input
            type="datetime-local"
            className={field}
            value={
              form.dueDate
            }
            onChange={(event) =>
              setForm({
                ...form,
                dueDate:
                  event.target
                    .value,
              })
            }
          />

          <select
            multiple
            required
            className={`${field} h-40`}
            value={
              form.assignedStudents
            }
            onChange={(event) =>
              setForm({
                ...form,
                assignedStudents:
                  [
                    ...event.target
                      .selectedOptions,
                  ].map(
                    (option) =>
                      option.value
                  ),
              })
            }
          >
            {students.map(
              (student) => (
                <option
                  key={
                    student._id
                  }
                  value={
                    student._id
                  }
                >
                  {student.fullName} —{" "}
                  {student.email}
                </option>
              )
            )}
          </select>

          <button className="rounded-xl bg-[#c89b7b] px-5 py-2 text-xs font-bold text-[#1e1713]">
            Release Practice
          </button>
        </form>
      )}

      {/* PRACTICE LIST */}
      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <h2 className="font-bold">
          Assigned Problems
        </h2>

        <div className="mt-4 space-y-3">
          {challenges.length ===
          0 ? (
            <p className="text-sm text-[#a39081]">
              No coding practices yet.
            </p>
          ) : (
            challenges.map(
              (challenge) => (
                <div
                  key={
                    challenge._id
                  }
                  className="rounded-xl border border-[#4a3b32] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <b>
                      {
                        challenge.title
                      }
                    </b>

                    <span className="rounded-full bg-[#2d231d] px-2 py-1 text-[10px] uppercase text-[#c89b7b]">
                      {
                        challenge.platform
                      }
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#a39081]">
                    {challenge.description ||
                      "No description provided."}
                  </p>

                  {challenge.problemUrl && (
                    <a
                      href={
                        challenge.problemUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-[#c89b7b] underline"
                    >
                      Open problem
                    </a>
                  )}
                </div>
              )
            )
          )}
        </div>
      </section>
    </div>
  );
}