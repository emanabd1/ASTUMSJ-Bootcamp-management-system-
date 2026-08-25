import { Link } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences';

const TRACKS = [
  {
    title: 'Web Development',
    description:
      'Learn to build full-stack applications with HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB — the same stack this platform is built on.',
    icon: '🌐',
  },
  {
    title: 'Competitive Programming',
    description:
      'Sharpen algorithmic thinking and problem-solving through structured practice sheets, timed contests, and curated Codeforces/LeetCode challenges.',
    icon: '🧮',
  },
  {
    title: 'Mobile Development',
    description:
      'Explore building cross-platform mobile apps, from UI fundamentals to connecting with real backend APIs.',
    icon: '📱',
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

const LandingPage = () => {
  const { preferences, updatePreferences, t } = usePreferences();
  return (
    <div className="bg-[#fdf6e3] min-h-screen font-sans text-[#2c1a11]">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 bg-[#2c1a11] text-[#fdf6e3] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ASTU MSJ Logo" className="w-10 h-10 rounded-full object-cover border-2 border-[#d8b493]" />
          <span className="font-bold text-xl tracking-tight">ASTU MSJ</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium">
          <a href="#about" className="hover:text-[#d8b493]">{t('about')}</a>
          <a href="#tracks" className="hover:text-[#d8b493]">{t('tracks')}</a>
          <a href="#mentors" className="hover:text-[#d8b493]">{t('mentors')}</a>
          <a href="#faq" className="hover:text-[#d8b493]">{t('faq')}</a>
          <Link to="/alumni" className="hover:text-[#d8b493]">{t('alumni')}</Link>
        </div>
        <div className="flex gap-4">
          <label className="sr-only" htmlFor="landing-language">{t('language')}</label>
          <select id="landing-language" value={preferences.language} onChange={(event) => updatePreferences({ language: event.target.value })} className="max-w-24 rounded-lg border border-[#80644e] bg-[#2c1a11] px-2 py-2 text-xs text-[#fdf6e3] outline-none">
            <option value="en">English</option><option value="am">አማርኛ</option><option value="om">Oromiffa</option><option value="so">Af-Soomaali</option><option value="ar">العربية</option>
          </select>
          <Link to="/login" className="px-4 py-2 hover:text-[#d8b493]">{t('login')}</Link>
          <Link to="/signup" className="bg-[#d8b493] text-[#2c1a11] px-5 py-2 rounded-lg font-bold hover:bg-[#c8a98c]">{t('join')}</Link>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <header className="py-24 px-6 text-center">
        <h1 className="text-6xl font-extrabold mb-6">Step Bold, <span className="text-[#d8b493]">Stay Iconic</span></h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
          The ASTU MSJ Summer Bootcamp is designed to transform beginners into full-stack developers. 
          Join a community of builders and start your journey today.
          <p> Driven by Faith, Empowered by Knowledge. </p>
        </p>
        <Link to="/signup" className="bg-[#2c1a11] text-[#fdf6e3] px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-transform">
          Start Your Application
        </Link>
      </header>

      {/* 2. About Section */}
      <section id="about" className="bg-[#ede0d4] py-20 px-10 text-center">
        <h2 className="text-4xl font-bold mb-6">About the Bootcamp</h2>
        <p className="max-w-4xl mx-auto text-lg text-gray-800">
          We bridge the gap between classroom theory and real-world software engineering. 
          Through hands-on projects, daily attendance tracking, and professional mentorship, 
          we ensure every student stays on track to success.
        </p>
      </section>

      {/* 3. Tracks Section */}
      <section id="tracks" className="py-20 px-10">
        <h2 className="text-4xl font-bold text-center mb-4">Bootcamp Tracks</h2>
        <p className="max-w-2xl mx-auto text-center text-gray-700 mb-12">
          Choose a path that fits your goals. Every track combines guided lessons, hands-on
          projects, and mentor feedback.
        </p>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {TRACKS.map((track) => (
            <div
              key={track.title}
              className="bg-white rounded-2xl shadow-sm p-8 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-5xl mb-4">{track.icon}</div>
              <h3 className="text-xl font-bold mb-3">{track.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{track.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Mentors Section */}
      <section id="mentors" className="bg-[#ede0d4] py-20 px-10">
        <h2 className="text-4xl font-bold text-center mb-4">Meet Your Mentors</h2>
        <p className="max-w-2xl mx-auto text-center text-gray-700 mb-12">
          Every track is guided by experienced mentors who review your work, run attendance,
          and keep you accountable throughout the program.
        </p>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {MENTORS.map((mentor) => (
            <div
              key={mentor.name}
              className="bg-white rounded-2xl shadow-sm p-8 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#d8b493] flex items-center justify-center text-2xl font-bold text-[#2c1a11]">
                {mentor.name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold mb-1">{mentor.name}</h3>
              <p className="text-sm text-amber-700 font-semibold mb-3">{mentor.focus}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{mentor.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section id="faq" className="py-20 px-10 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Common Questions</h2>
        <div className="space-y-6">
          <details className="bg-white p-6 rounded-xl shadow-sm cursor-pointer">
            <summary className="font-bold text-lg">Is this bootcamp free?</summary>
            <p className="mt-4 text-gray-600">Yes, this is an ASTU MSJ community initiative for all eligible students.</p>
          </details>
          <details className="bg-white p-6 rounded-xl shadow-sm cursor-pointer">
            <summary className="font-bold text-lg">What are the requirements?</summary>
            <p className="mt-4 text-gray-600">A laptop, a stable internet connection, and a passion for learning!</p>
          </details>
        </div>
      </section>

      {/* 6. Contact Section */}
      <footer id="contact" className="bg-[#ede0d4] py-16 px-10 text-center border-t border-[#d8b493]">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="text-gray-700 mb-6">
  Have questions? Reach out to us at{" "}
  <a 
    href="mailto:astumsjbootcamp2026@gmail.com" 
    className="text-amber-700 underline hover:text-amber-800 transition"
  >
    astumsjbootcamp2026@gmail.com
  </a>
</p>
        <div className="text-sm text-gray-500">© 2026 ASTU MSJ Summer Bootcamp. All Rights Reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;