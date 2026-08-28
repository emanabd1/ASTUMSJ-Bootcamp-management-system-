import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences';
import ThemeToggle from '../components/ThemeToggle';

const TRACKS = [
  {
    title: 'Web Development',
    description:
      'Learn to build full-stack applications with HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB — the same stack this platform is built on.',
    icon: '🌐',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    title: 'Competitive Programming',
    description:
      'Sharpen algorithmic thinking and problem-solving through structured practice sheets, timed contests, and curated Codeforces/LeetCode challenges.',
    icon: '🧮',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Mobile Development',
    description:
      'Explore building cross-platform mobile apps, from UI fundamentals to connecting with real backend APIs.',
    icon: '📱',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

const MENTORS = [
  {
    name: 'Web Development Mentors',
    focus: 'Full-Stack (MERN)',
    bio: 'Experienced student mentors guiding learners through frontend, backend, and deployment best practices.',
  },
  {
    name: 'Competitive Programming Mentors',
    focus: 'Algorithms & Data Structures',
    bio: 'Active competitive programmers who help students build problem-solving speed and accuracy.',
  },
  {
    name: 'Mobile Development Mentors',
    focus: 'Cross-Platform Apps',
    bio: 'Mentors focused on helping students design and ship their first mobile applications.',
  },
];

const METRICS = [
  { label: 'Tracks', target: 3, suffix: '' },
  { label: 'Success Rate', target: 92, suffix: '%' },
  { label: 'Alumni Network', target: 150, suffix: '+' },
];

function useCountUp(target, active) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame;
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);
  return value;
}

function Metric({ label, target, suffix }) {
  const value = useCountUp(target, true);
  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold text-white sm:text-4xl">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-xs uppercase tracking-widest text-[#A0AEC0]">{label}</p>
    </div>
  );
}

const LandingPage = () => {
  const { preferences, updatePreferences, t } = usePreferences();

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--body)]">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ASTU MSJ Logo" className="h-10 w-10 rounded-full border-2 border-[var(--accent-solid)] object-cover" />
          <span className="text-xl font-bold tracking-tight text-[var(--heading)]">ASTU MSJ</span>
        </div>
        <div className="hidden gap-8 font-medium text-[var(--body)] md:flex">
          <a href="#about" className="hover:text-[var(--accent-solid)]">{t('about')}</a>
          <a href="#tracks" className="hover:text-[var(--accent-solid)]">{t('tracks')}</a>
          <a href="#mentors" className="hover:text-[var(--accent-solid)]">{t('mentors')}</a>
          <a href="#faq" className="hover:text-[var(--accent-solid)]">{t('faq')}</a>
          <Link to="/alumni" className="hover:text-[var(--accent-solid)]">{t('alumni')}</Link>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="landing-language">{t('language')}</label>
          <select
            id="landing-language"
            value={preferences.language}
            onChange={(event) => updatePreferences({ language: event.target.value })}
            className="max-w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-xs text-[var(--body)] outline-none"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
            <option value="om">Oromiffa</option>
            <option value="so">Af-Soomaali</option>
            <option value="ar">العربية</option>
          </select>
          <ThemeToggle />
          <Link to="/login" className="hidden px-3 py-2 text-sm font-medium text-[var(--body)] hover:text-[var(--accent-solid)] sm:block">{t('login')}</Link>
          <Link to="/signup" className="btn-cta rounded-lg px-5 py-2 text-sm font-bold shadow-md transition hover:brightness-110">{t('join')}</Link>
        </div>
      </nav>

      {/* 1. Hero Section — permanently the dark navy/gold "brand" hero, per the reference design */}
      <header className="relative overflow-hidden bg-[#0B111E] px-6 py-28 text-center">
        <div className="hero-glow left-1/4 top-0 h-72 w-72 bg-[#E28743] opacity-20" />
        <div className="hero-glow right-1/4 bottom-0 h-72 w-72 bg-[#EEA47F] opacity-10" />

        <div className="relative">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Step Bold, <span className="bg-gradient-to-r from-[#E28743] to-[#EEA47F] bg-clip-text text-transparent">Stay Iconic</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#A0AEC0]">
            The ASTU MSJ Summer Bootcamp is designed to transform beginners into full-stack developers.
            Join a community of builders and start your journey today.
          </p>
          <p className="mt-2 text-sm italic text-[#A0AEC0]">Driven by Faith, Empowered by Knowledge.</p>

          <Link
            to="/signup"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-[#E28743] to-[#EEA47F] px-10 py-4 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105"
          >
            Start Your Application
          </Link>

          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6 rounded-2xl border border-white/10 bg-[#131B2E] p-6">
            {METRICS.map((m) => (
              <Metric key={m.label} {...m} />
            ))}
          </div>
        </div>
      </header>

      {/* 2. About Section */}
      <section id="about" className="bg-[var(--surface)] px-10 py-20 text-center">
        <h2 className="mb-6 text-4xl font-bold text-[var(--heading)]">About the Bootcamp</h2>
        <p className="mx-auto max-w-4xl text-lg text-[var(--body)]">
          We bridge the gap between classroom theory and real-world software engineering.
          Through hands-on projects, daily attendance tracking, and professional mentorship,
          we ensure every student stays on track to success.
        </p>
      </section>

      {/* 3. Tracks Section */}
      <section id="tracks" className="bg-[var(--bg)] px-10 py-20">
        <h2 className="mb-4 text-center text-4xl font-bold text-[var(--heading)]">Bootcamp Tracks</h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--body)]">
          Choose a path that fits your goals. Every track combines guided lessons, hands-on
          projects, and mentor feedback.
        </p>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {TRACKS.map((track) => (
            <div
              key={track.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ${track.gradient}`}>
                {track.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-[var(--heading)]">{track.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--body)]">{track.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Mentors Section */}
      <section id="mentors" className="bg-[var(--surface)] px-10 py-20">
        <h2 className="mb-4 text-center text-4xl font-bold text-[var(--heading)]">Meet Your Mentors</h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--body)]">
          Every track is guided by experienced mentors who review your work, run attendance,
          and keep you accountable throughout the program.
        </p>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {MENTORS.map((mentor) => (
            <div
              key={mentor.name}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="btn-cta mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                {mentor.name.charAt(0)}
              </div>
              <h3 className="mb-1 text-lg font-bold text-[var(--heading)]">{mentor.name}</h3>
              <p className="mb-3 text-sm font-semibold text-[var(--accent-solid)]">{mentor.focus}</p>
              <p className="text-sm leading-relaxed text-[var(--body)]">{mentor.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section id="faq" className="mx-auto max-w-3xl px-10 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold text-[var(--heading)]">Common Questions</h2>
        <div className="space-y-6">
          {[
            ['Is this bootcamp free?', 'Yes, this is an ASTU MSJ community initiative for all eligible students.'],
            ['What are the requirements?', 'A laptop, a stable internet connection, and a passion for learning!'],
            ['Do I need prior coding experience?', 'No — tracks are structured to take you from fundamentals to real projects, with mentor support along the way.'],
          ].map(([q, a]) => (
            <details key={q} className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <summary className="text-lg font-bold text-[var(--heading)]">{q}</summary>
              <p className="mt-4 text-[var(--body)]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 6. Contact / Footer */}
      <footer id="contact" className="border-t border-[var(--border)] bg-[var(--surface)] px-10 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-[var(--heading)]">Contact Us</h2>
        <p className="mb-6 text-[var(--body)]">
          Have questions? Reach out to us at{' '}
          <a
            href="mailto:astumsjbootcamp2026@gmail.com"
            className="font-semibold text-[var(--accent-solid)] underline transition hover:opacity-80"
          >
            astumsjbootcamp2026@gmail.com
          </a>
        </p>
        <div className="text-sm text-[var(--muted)]">© 2026 ASTU MSJ Summer Bootcamp. All Rights Reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
