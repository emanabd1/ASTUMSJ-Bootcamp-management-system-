import { Link } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences';

const TRACKS = [
  {
    title: 'Web Development',
    description:
             'Learn how to design, develop, and deploy modern web applications from the ground up. Students will start with HTML and CSS, then progress to JavaScript, React, Node.js, Express, and MongoDB. Through practical projects, students will build responsive user interfaces, create REST APIs, work with databases, use Git and GitHub, and develop real-world full-stack applications with guidance and feedback from mentors.',
    icon: '🌐',
  },
  {
    title: 'Competitive Programming',
    description:
              'Develop strong problem-solving and algorithmic thinking skills through structured competitive programming practice. Students will learn data structures, algorithms, complexity analysis, searching, sorting, recursion, dynamic programming, and graph-based problems. Regular coding challenges, practice contests, and problems from platforms such as Codeforces and LeetCode will help students improve their speed, accuracy, logical thinking, and programming skills.',
    icon: '🧮',
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
];

const LandingPage = () => {
  const { preferences, updatePreferences, t } = usePreferences();

  return (
    <div className="bg-[#f4f8ff] min-h-screen font-sans text-[#071a33]">

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 bg-[#061426] text-white sticky top-0 z-50">

        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="ASTU MSJ Logo"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#ffffff]"
          />

          <span className="font-bold text-xl tracking-tight">
            ASTU MSJ
          </span>
        </div>

        <div className="hidden md:flex gap-8 font-medium">
          <a href="#about" className="hover:text-[#b9d7ff]">
            {t('about')}
          </a>

          <a href="#tracks" className="hover:text-[#b9d7ff]">
            {t('tracks')}
          </a>

          <a href="#mentors" className="hover:text-[#b9d7ff]">
            {t('mentors')}
          </a>

          <a href="#faq" className="hover:text-[#b9d7ff]">
            {t('faq')}
          </a>

          <Link to="/alumni" className="hover:text-[#b9d7ff]">
            {t('alumni')}
          </Link>
        </div>

        <div className="flex gap-4 items-center">

          <label
            className="sr-only"
            htmlFor="landing-language"
          >
            {t('language')}
          </label>

          <select
            id="landing-language"
            value={preferences.language}
            onChange={(event) =>
              updatePreferences({
                language: event.target.value,
              })
            }
            className="max-w-24 rounded-lg border border-[#54708f] bg-[#061426] px-2 py-2 text-xs text-white outline-none"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
            <option value="om">Oromiffa</option>
            <option value="so">Af-Soomaali</option>
            <option value="ar">العربية</option>
          </select>

          <Link
            to="/login"
            className="px-4 py-2 hover:text-[#b9d7ff]"
          >
            {t('login')}
          </Link>

          <Link
            to="/signup"
            className="bg-white text-[#061426] px-5 py-2 rounded-lg font-bold hover:bg-[#dcecff]"
          >
            {t('join')}
          </Link>

        </div>
      </nav>


      {/* Hero Section */}
      <header className="py-24 px-6 text-center bg-[#f4f8ff]">

        <h1 className="text-6xl font-extrabold mb-6 text-[#071a33]">
          Step Bold,{' '}
          <span className="text-[#315f91]">
            Stay Iconic
          </span>
        </h1>

        <p className="text-xl text-[#40566f] max-w-3xl mx-auto mb-10 leading-relaxed">
          The ASTU MSJ Summer Bootcamp is designed to transform
          beginners into full-stack developers. Join a community
          of builders and start your journey today.
        </p>

        <p className="text-[#315f91] font-semibold mb-8">
          Driven by Faith, Empowered by Knowledge.
        </p>

        <Link
          to="/signup"
          className="bg-[#061426] text-white px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-transform"
        >
          Start Your Application
        </Link>

      </header>


      {/* About Section */}
      <section
        id="about"
        className="bg-[#dcecff] py-20 px-10 text-center"
      >

        <h2 className="text-4xl font-bold mb-6 text-[#071a33]">
          About the Bootcamp
        </h2>

        <p className="max-w-4xl mx-auto text-lg text-[#304a66]">
           The ASTU MSJ Summer Bootcamp is a practical learning program
           designed to help muslim university students develop valuable technology and
           problem-solving skills beyond the classroom. The bootcamp
           provides a structured environment where students can learn,
           practice, collaborate, and build real projects with the support
           of experienced mentors.
        </p>

      </section>


      {/* Tracks Section */}
      <section
        id="tracks"
        className="py-20 px-10 bg-[#f4f8ff]"
      >

        <h2 className="text-4xl font-bold text-center mb-4 text-[#071a33]">
          Bootcamp Tracks
        </h2>

        <p className="max-w-2xl mx-auto text-center text-[#40566f] mb-12">
          Choose a path that fits your goals. Every track combines
          guided lessons, hands-on projects, and mentor feedback.
        </p>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">

          {TRACKS.map((track) => (
            <div
              key={track.title}
              className="bg-white border border-[#b9d7ff] rounded-2xl shadow-sm p-8 text-center hover:shadow-lg transition-shadow"
            >

              <div className="text-5xl mb-4">
                {track.icon}
              </div>

              <h3 className="text-xl font-bold mb-3 text-[#071a33]">
                {track.title}
              </h3>

              <p className="text-[#40566f] text-sm leading-relaxed">
                {track.description}
              </p>

            </div>
          ))}

        </div>

      </section>


      {/* Mentors Section */}
      <section
        id="mentors"
        className="bg-[#dcecff] py-20 px-10"
      >

        <h2 className="text-4xl font-bold text-center mb-4 text-[#071a33]">
          Meet Your Mentors
        </h2>

        <p className="max-w-2xl mx-auto text-center text-[#40566f] mb-12">
          Every track is guided by experienced mentors who review
          your work, run attendance, and keep you accountable
          throughout the program.
        </p>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">

          {MENTORS.map((mentor) => (
            <div
              key={mentor.name}
              className="bg-white border border-[#b9d7ff] rounded-2xl shadow-sm p-8 text-center hover:shadow-lg transition-shadow"
            >

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#061426] flex items-center justify-center text-2xl font-bold text-white">
                {mentor.name.charAt(0)}
              </div>

              <h3 className="text-lg font-bold mb-1 text-[#071a33]">
                {mentor.name}
              </h3>

              <p className="text-sm text-[#315f91] font-semibold mb-3">
                {mentor.focus}
              </p>

              <p className="text-[#40566f] text-sm leading-relaxed">
                {mentor.bio}
              </p>

            </div>
          ))}

        </div>

      </section>


      {/* FAQ Section */}
      <section
        id="faq"
        className="py-20 px-10 max-w-3xl mx-auto bg-[#f4f8ff]"
      >

        <h2 className="text-4xl font-bold text-center mb-12 text-[#071a33]">
          Common Questions
        </h2>

        <div className="space-y-6">

          <details className="bg-white border border-[#b9d7ff] p-6 rounded-xl shadow-sm cursor-pointer">
            <summary className="font-bold text-lg text-[#071a33]">
              Is this bootcamp free?
            </summary>

            <p className="mt-4 text-[#40566f]">
              Yes, this is an ASTU MSJ community initiative for all
              eligible students.
            </p>
          </details>

          <details className="bg-white border border-[#b9d7ff] p-6 rounded-xl shadow-sm cursor-pointer">
            <summary className="font-bold text-lg text-[#071a33]">
              What are the requirements?
            </summary>

            <p className="mt-4 text-[#40566f]">
              A laptop, a stable internet connection, and a passion
              for learning!
            </p>
          </details>

        </div>

      </section>


      {/* Footer */}
      <footer
        id="contact"
        className="bg-[#061426] py-16 px-10 text-center border-t border-[#315f91] text-white"
      >

        <h2 className="text-3xl font-bold mb-4">
          Contact Us
        </h2>

        <p className="text-[#dcecff] mb-6">

          Have questions? Reach out to us at{' '}

         <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=astumsjbootcamp2026@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1d4ed8] underline hover:text-[#0b1f3a]"
          >
            astumsjbootcamp2026@gmail.com
         </a>

        </p>

        <div className="text-sm text-[#9bb4cf]">
          © 2026 ASTU MSJ Summer Bootcamp. All Rights Reserved.
        </div>

      </footer>

    </div>
  );
};

export default LandingPage;