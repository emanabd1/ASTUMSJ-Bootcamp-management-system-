import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const field = "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2.5 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";
const card = "rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6";

function emptyGoal() {
  return { text: "", completed: false };
}

export default function DailyDisciplinePage() {
  const [discipline, setDiscipline] = useState(null);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, todayCompleted: false });
  const [goals, setGoals] = useState([emptyGoal()]);
  const [focusRating, setFocusRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/discipline/today");
      const record = response.data.discipline;
      setDiscipline(record || null);
      setStreak(response.data.streak || {});
      setGoals(record?.goals?.length ? record.goals.map((goal) => ({ text: goal.text, completed: Boolean(goal.completed) })) : [emptyGoal()]);
      setFocusRating(record?.focusRating || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load your daily discipline plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateGoal = (index, value) => {
    setGoals((current) => current.map((goal, goalIndex) => goalIndex === index ? { ...goal, text: value } : goal));
  };

  const toggleGoal = (index) => {
    if (discipline?.eveningCheckout) return;
    setGoals((current) => current.map((goal, goalIndex) => goalIndex === index ? { ...goal, completed: !goal.completed } : goal));
  };

  const addGoal = () => {
    if (goals.length < 3) setGoals((current) => [...current, emptyGoal()]);
  };

  const removeGoal = (index) => {
    if (goals.length <= 1 || discipline?.eveningCheckout) return;
    setGoals((current) => current.filter((_, goalIndex) => goalIndex !== index));
  };

  const saveMorningGoals = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const cleanedGoals = goals.map((goal) => ({ text: goal.text.trim(), completed: false }));
    if (cleanedGoals.some((goal) => !goal.text)) {
      setError("Please fill in every goal before saving.");
      return;
    }

    try {
      setSaving(true);
      const response = await axiosInstance.post("/discipline/morning", { goals: cleanedGoals });
      setDiscipline(response.data.discipline);
      setGoals(response.data.discipline.goals.map((goal) => ({ text: goal.text, completed: Boolean(goal.completed) })));
      setMessage("Morning goals saved. Come back tonight for your accountability checkout.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save your goals.");
    } finally {
      setSaving(false);
    }
  };

  const submitCheckout = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!discipline) {
      setError("Set your morning goals before checking out.");
      return;
    }
    if (!focusRating) {
      setError("Choose your evening focus rating from 1 to 5.");
      return;
    }

    try {
      setCheckingOut(true);
      const response = await axiosInstance.post("/discipline/checkout", {
        focusRating,
        goals,
      });
      setDiscipline(response.data.discipline);
      setStreak(response.data.streak || {});
      setGoals(response.data.discipline.goals.map((goal) => ({ text: goal.text, completed: Boolean(goal.completed) })));
      setMessage(response.data.message || "Evening checkout complete!");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not complete your evening checkout.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <p className="text-[#a39081]">Loading your daily discipline...</p>;
  if (error && !discipline && !goals.length) return <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">{error}</p>;

  const checkedOut = Boolean(discipline?.eveningCheckout);
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const atRisk = !checkedOut && streak.currentStreak > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#c89b7b]">Student experience</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#f5efe6]">Daily Discipline</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a39081]">
            Commit to 1–3 coding goals in the morning, then close the day with an honest accountability checkout.
          </p>
        </div>
        <div className="min-w-40 rounded-2xl border border-[#c89b7b]/50 bg-[#2d231d] p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#a39081]">Current streak</p>
          <p className="mt-1 text-4xl font-extrabold text-[#d8b493]">{streak.currentStreak || 0}</p>
          <p className="text-xs text-[#c89b7b]">day{streak.currentStreak === 1 ? "" : "s"} 🔥</p>
        </div>
      </header>

      {message && <p className="rounded-xl border border-emerald-900 bg-[#1e1713] p-4 text-sm text-emerald-300">{message}</p>}
      {error && <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-sm text-rose-300">{error}</p>}

      {atRisk && !checkedOut && (
        <div className="rounded-2xl border border-amber-800 bg-[#2d231d] p-4 text-sm text-amber-200">
          🔥 Your {streak.currentStreak}-day streak is at risk. Complete tonight's checkout to protect it.
        </div>
      )}

      <section className={card}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#c89b7b]">Morning</p>
            <h2 className="mt-1 text-xl font-bold text-[#f5efe6]">Goal Commitment</h2>
            <p className="mt-1 text-sm text-[#a39081]">Choose 1–3 specific coding targets for today.</p>
          </div>
          <span className="rounded-full border border-[#4a3b32] px-3 py-1 text-[10px] uppercase tracking-widest text-[#a39081]">{goals.length}/3 goals</span>
        </div>

        <form onSubmit={saveMorningGoals} className="space-y-3">
          {goals.map((goal, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={field}
                disabled={checkedOut}
                maxLength={200}
                placeholder={`Coding goal ${index + 1}`}
                value={goal.text}
                onChange={(event) => updateGoal(index, event.target.value)}
              />
              {!checkedOut && goals.length > 1 && (
                <button type="button" onClick={() => removeGoal(index)} className="rounded-xl border border-[#4a3b32] px-3 text-[#a39081] hover:text-rose-300" aria-label={`Remove goal ${index + 1}`}>
                  ×
                </button>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            {!checkedOut && goals.length < 3 && (
              <button type="button" onClick={addGoal} className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-bold text-[#d8b493] hover:border-[#c89b7b]">
                + Add goal
              </button>
            )}
            {!checkedOut && (
              <button disabled={saving} className="rounded-xl bg-[#c89b7b] px-5 py-2 text-xs font-bold text-[#1e1713] disabled:opacity-50">
                {saving ? "Saving..." : discipline ? "Update Today's Goals" : "Save Today's Goals"}
              </button>
            )}
          </div>
        </form>
      </section>

      <section className={card}>
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-[#c89b7b]">Evening</p>
          <h2 className="mt-1 text-xl font-bold text-[#f5efe6]">Accountability Checkout</h2>
          <p className="mt-1 text-sm text-[#a39081]">Tick what you actually completed and rate your focus honestly.</p>
        </div>

        <div className="space-y-3">
          {goals.map((goal, index) => (
            <label key={index} className={`flex cursor-pointer items-center gap-3 rounded-xl border border-[#4a3b32] p-4 transition ${checkedOut ? "cursor-default opacity-80" : "hover:border-[#c89b7b]"}`}>
              <input
                type="checkbox"
                checked={goal.completed}
                disabled={checkedOut || !discipline}
                onChange={() => toggleGoal(index)}
                className="h-4 w-4 accent-[#c89b7b]"
              />
              <span className={goal.completed ? "text-[#d8b493] line-through" : "text-[#f5efe6]"}>{goal.text || `Coding goal ${index + 1}`}</span>
            </label>
          ))}
        </div>

        <form onSubmit={submitCheckout} className="mt-7 border-t border-[#4a3b32] pt-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold text-[#f5efe6]">How focused were you today?</p>
              <p className="mt-1 text-xs text-[#a39081]">1 = very unfocused · 5 = deeply focused</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    disabled={checkedOut || !discipline}
                    onClick={() => setFocusRating(rating)}
                    className={`h-10 w-10 rounded-xl border text-sm font-bold transition ${focusRating === rating ? "border-[#c89b7b] bg-[#c89b7b] text-[#1e1713]" : "border-[#4a3b32] text-[#a39081] hover:border-[#c89b7b]"}`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-[#a39081]">Completed goals</p>
              <p className="text-2xl font-bold text-[#d8b493]">{completedGoals}/{goals.length}</p>
            </div>
          </div>

          <div className="mt-6">
            {checkedOut ? (
              <div className="rounded-xl border border-emerald-900 bg-[#182018] p-4 text-sm text-emerald-300">
                ✓ Evening checkout submitted. Today's discipline is complete and your streak is protected.
              </div>
            ) : (
              <button disabled={!discipline || checkingOut} className="rounded-xl bg-[#c89b7b] px-6 py-3 text-xs font-bold text-[#1e1713] disabled:cursor-not-allowed disabled:opacity-50">
                {checkingOut ? "Submitting..." : "Complete Evening Checkout"}
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <p className="text-xs uppercase tracking-widest text-[#a39081]">Longest streak</p>
          <p className="mt-2 text-3xl font-extrabold text-[#f5efe6]">{streak.longestStreak || 0}</p>
          <p className="mt-1 text-xs text-[#a39081]">Your best discipline run.</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-widest text-[#a39081]">Reset rule</p>
          <p className="mt-2 text-sm font-bold text-[#f5efe6]">Miss an evening checkout → streak resets to 0.</p>
          <p className="mt-1 text-xs text-[#a39081]">The next successful checkout starts a new 1-day streak.</p>
        </div>
      </section>
    </div>
  );
}
