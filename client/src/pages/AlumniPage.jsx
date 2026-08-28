import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function AlumniPage() {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    axiosInstance
      .get("/community")
      .then((response) =>
        setHighlights(response.data.highlights || [])
      )
      .catch(() => {});
  }, []);

  const alumni = highlights.filter(
    (item) => item.category === "alumni"
  );

  const hallOfFame = highlights.filter(
    (item) => item.category === "hall_of_fame"
  );

  return (
    <main className="min-h-screen bg-[#f5f9ff] px-6 py-12 text-[#0b1f3a] sm:px-10">
      <div className="mx-auto max-w-5xl">

        <Link
          to="/"
          className="text-sm font-bold text-[#1d4ed8] hover:text-[#0b1f3a]"
        >
          Back to ASTU MSJ
        </Link>

        {/* Header */}
        <header className="py-20">
          <p className="text-xs uppercase tracking-[0.3em] text-[#2563eb]">
            Beyond the bootcamp
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#0b1f3a] sm:text-6xl">
            Alumni & Hall of Fame
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#334e68]">
            A public celebration of graduates, achievements, and
            community members who have successfully completed the
            ASTU MSJ Summer Bootcamp.
          </p>
        </header>

        {/* Hall of Fame */}
        <section
          className="grid gap-5 md:grid-cols-3"
          aria-label="Hall of Fame"
        >
          {hallOfFame.length ? (
            hallOfFame.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl bg-[#0b1f3a] p-6 text-white shadow-lg"
              >
                <p className="text-xs uppercase tracking-widest text-[#60a5fa]">
                  Hall of Fame
                </p>

                <h2 className="mt-3 text-xl font-bold">
                  {item.name}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#dbeafe]">
                  {item.detail}
                </p>

                {item.achievement && (
                  <p className="mt-3 text-xs font-semibold text-[#93c5fd]">
                    {item.achievement}
                  </p>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-2xl bg-[#0b1f3a] p-6 text-white md:col-span-3">
              <p className="text-sm text-[#dbeafe]">
                Hall of Fame highlights will appear here after admin
                approval.
              </p>
            </div>
          )}
        </section>

        {/* Alumni Community */}
        <section className="mt-10">
          <h2 className="text-3xl font-bold text-[#0b1f3a]">
            Alumni Community
          </h2>

          <p className="mt-2 text-sm text-[#334e68]">
            Meet graduates who have completed the bootcamp and
            continue to be part of the ASTU MSJ Alumni community.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {alumni.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-[#bfdbfe] bg-white p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563eb] text-xl font-bold text-white">
                  {item.name.charAt(0)}
                </div>

                <h2 className="mt-5 font-bold text-[#0b1f3a]">
                  {item.name}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                  {item.detail}
                </p>

                {item.cohort && (
                  <p className="mt-3 text-xs font-semibold text-[#2563eb]">
                    Cohort {item.cohort}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Application */}
        <p className="mt-12 text-sm text-[#334e68]">
          Interested in joining the next chapter?{" "}
          <Link
            to="/signup"
            className="font-bold text-[#1d4ed8] underline hover:text-[#0b1f3a]"
          >
            Start your application.
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-20 -mx-6 bg-[#0b1f3a] px-6 py-12 text-center text-white sm:-mx-10 sm:px-10">
        <p className="font-semibold">
          Driven by Faith, Empowered by Knowledge.
        </p>

        <p className="mt-3 text-xs text-[#bfdbfe]">
          © 2026 ASTU MSJ Summer Bootcamp. All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}