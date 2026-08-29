import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

/* ---------- shared style tokens (match app's Warm Stone & Rust palette) ---------- */
const field =
  'w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none';
const panel = 'rounded-2xl border border-[#4a3b32] bg-[#1e1713]';

const STATUS_STYLES = {
  upcoming: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  completed: 'bg-[#4a3b32]/40 text-[#a39081] border-[#4a3b32]',
};

/* deterministic color per person so the "community board" feels alive but stable */
const AVATAR_HUES = ['#c89b7b', '#8fb8a8', '#c78ba0', '#8aa6c8', '#c9a44c', '#a08bc7'];
const hueFor = (id = '') => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % AVATAR_HUES.length;
  return AVATAR_HUES[h];
};
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

function Avatar({ person, size = 8 }) {
  const px = size === 8 ? 'h-8 w-8 text-[11px]' : 'h-6 w-6 text-[10px]';
  return (
    <div
      title={person.fullName}
      className={`flex ${px} shrink-0 items-center justify-center rounded-full border-2 border-[#1e1713] font-bold text-[#1e1713]`}
      style={{ backgroundColor: hueFor(person._id) }}
    >
      {initials(person.fullName)}
    </div>
  );
}

/* ---------- tiny inline icons (no icon library in this project) ---------- */
const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const IconClose = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconPencil = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
  </svg>
);
const IconUsers = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCap = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="m22 10-10-5L2 10l10 5 10-5Z" />
    <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
  </svg>
);
const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IconAlert = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconChevron = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const IconCalendar = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const emptyGroupForm = { name: '', description: '', status: 'upcoming', batchYearId: '' };
const emptyYearForm = { name: '', description: '', startDate: '', endDate: '', status: 'upcoming' };

export default function BatchesPage() {
  const [batchYears, setBatchYears] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text }

  const [groupSearch, setGroupSearch] = useState('');
  const [openYears, setOpenYears] = useState(() => new Set());

  const [yearsPanelOpen, setYearsPanelOpen] = useState(false);
  const [creatingYear, setCreatingYear] = useState(false);
  const [yearForm, setYearForm] = useState(emptyYearForm);
  const [editingYear, setEditingYear] = useState(null);

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [creatingGroupBusy, setCreatingGroupBusy] = useState(false);

  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupForm, setEditGroupForm] = useState(emptyGroupForm);

  const [roster, setRoster] = useState(null);
  const [rosterMentorIds, setRosterMentorIds] = useState([]);
  const [rosterStudentIds, setRosterStudentIds] = useState([]);
  const [rosterTab, setRosterTab] = useState('mentors');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterBusy, setRosterBusy] = useState(false);
  const [batchRoster, setBatchRoster] = useState(null);
  const [batchRosterMentorIds, setBatchRosterMentorIds] = useState([]);
  const [batchRosterStudentIds, setBatchRosterStudentIds] = useState([]);
  const [batchRosterTab, setBatchRosterTab] = useState('mentors');
  const [batchRosterSearch, setBatchRosterSearch] = useState('');
  const [batchRosterBusy, setBatchRosterBusy] = useState(false);

  const flash = (type, text) => {
    setMessage({ type, text });
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setMessage(null), 4500);
  };

  const load = async () => {
    try {
      const [y, b, u, m] = await Promise.all([
        axiosInstance.get('/batch-years', { params: { _t: Date.now() } }),
        axiosInstance.get('/batches', { params: { _t: Date.now() } }),
        axiosInstance.get('/users?role=student&status=approved'),
        axiosInstance.get('/users/mentors'),
      ]);
      setBatchYears(y.data.batchYears || []);
      setGroups(b.data.batches || []);
      setStudents(u.data.users || []);
      setMentors(m.data.mentors || []);
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not load batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* how many groups each mentor already covers — the "community load" signal */
  const mentorLoad = useMemo(() => {
    const map = {};
    for (const g of groups) {
      for (const m of g.mentors || []) {
        const id = typeof m === 'string' ? m : m?._id;
        if (id) map[id] = (map[id] || 0) + 1;
      }
    }
    return map;
  }, [groups]);

  /* which group a student currently belongs to */
  const studentHomeGroup = useMemo(() => {
    const map = {};
    for (const g of groups) {
      for (const s of g.students || []) {
        const id = typeof s === 'string' ? s : s?._id;
        if (id) map[id] = g;
      }
    }
    return map;
  }, [groups]);

  const visibleGroups = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase())),
    [groups, groupSearch],
  );

  /* bucket groups by their parent batch year, plus an "Ungrouped" bucket */
  const groupsByYear = useMemo(() => {
    const map = new Map();
    for (const g of visibleGroups) {
      const key = g.batchYear?._id || g.batchYear || 'ungrouped';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(g);
    }
    return map;
  }, [visibleGroups]);

  const toggleYearOpen = (id) =>
    setOpenYears((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ---------- batch year (rare, top-level) ---------- */
  const submitYear = async (e) => {
    e.preventDefault();
    try {
      if (editingYear) {
        const response = await axiosInstance.patch(`/batch-years/${editingYear._id}`, yearForm);
        setBatchYears((current) => current.map((batchYear) => batchYear._id === editingYear._id ? response.data.batchYear : batchYear));
        flash('success', 'Batch updated.');
      } else {
        await axiosInstance.post('/batch-years', yearForm);
        flash('success', `“${yearForm.name}” batch created. Add groups to it below.`);
      }
      setYearForm(emptyYearForm);
      setCreatingYear(false);
      setEditingYear(null);
      if (!editingYear) await load();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not save the batch.');
    }
  };
  const openEditYear = (y) => {
    setEditingYear(y);
    setCreatingYear(true);
    setYearForm({
      name: y.name,
      description: y.description || '',
      startDate: y.startDate?.slice(0, 10) || '',
      endDate: y.endDate?.slice(0, 10) || '',
      status: y.status || 'upcoming',
    });
  };
  const cancelYearForm = () => {
    setCreatingYear(false);
    setEditingYear(null);
    setYearForm(emptyYearForm);
  };
  const removeYear = async (y) => {
    if (!confirm(`Delete the “${y.name}” batch?`)) return;
    try {
      await axiosInstance.delete(`/batch-years/${y._id}`);
      flash('success', 'Batch deleted.');
      load();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Delete failed.');
    }
  };

  /* ---------- group create ---------- */
  const openCreateGroup = (batchYearId = '') => {
    setGroupForm({ ...emptyGroupForm, batchYearId: batchYearId || batchYears[0]?._id || '' });
    setCreatingGroup(true);
  };
  const submitCreateGroup = async (e) => {
    e.preventDefault();
    setCreatingGroupBusy(true);
    try {
      await axiosInstance.post('/batches', groupForm);
      setGroupForm(emptyGroupForm);
      setCreatingGroup(false);
      flash('success', `“${groupForm.name}” group created. Add mentors and students from its card.`);
      load();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not create the group.');
    } finally {
      setCreatingGroupBusy(false);
    }
  };

  /* ---------- group edit ---------- */
  const openEditGroup = (g) => {
    setEditingGroup(g);
    setEditGroupForm({
      name: g.name,
      description: g.description || '',
      status: g.status || 'upcoming',
      batchYearId: g.batchYear?._id || g.batchYear || '',
    });
  };
  const submitEditGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.patch(`/batches/${editingGroup._id}`, editGroupForm);
      setGroups((current) => current.map((group) => group._id === editingGroup._id ? response.data.batch : group));
      flash('success', 'Group updated.');
      setEditingGroup(null);
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not update the group.');
    }
  };
  const removeGroup = async (g) => {
    if (!confirm(`Delete “${g.name}”? Its mentors and students will be unassigned.`)) return;
    try {
      await axiosInstance.delete(`/batches/${g._id}`);
      flash('success', 'Group deleted.');
      load();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Delete failed.');
    }
  };

  /* ---------- roster modal ---------- */
  const openRoster = (g) => {
    setRoster(g);
    setRosterTab('mentors');
    setRosterSearch('');
    setRosterMentorIds((g.mentors || []).map((x) => (typeof x === 'string' ? x : x?._id || x)));
    setRosterStudentIds((g.students || []).map((x) => (typeof x === 'string' ? x : x?._id || x)));
  };
  const closeRoster = () => setRoster(null);

  const openBatchRoster = (batchYear) => {
    setBatchRoster(batchYear);
    setBatchRosterTab('mentors');
    setBatchRosterSearch('');
    setBatchRosterMentorIds((batchYear.mentors || []).map((user) => typeof user === 'string' ? user : user._id));
    setBatchRosterStudentIds((batchYear.students || []).map((user) => typeof user === 'string' ? user : user._id));
  };

  const closeBatchRoster = () => setBatchRoster(null);
  const toggleBatchMentor = (id) => setBatchRosterMentorIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleBatchStudent = (id) => setBatchRosterStudentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const saveBatchRoster = async () => {
    setBatchRosterBusy(true);
    try {
      const response = await axiosInstance.patch(`/batch-years/${batchRoster._id}/roster`, { mentorIds: batchRosterMentorIds, studentIds: batchRosterStudentIds });
      setBatchYears((current) => current.map((batchYear) => batchYear._id === batchRoster._id ? response.data.batchYear : batchYear));
      flash('success', `Roster saved for “${batchRoster.name}”.`);
      closeBatchRoster();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not save the batch roster.');
    } finally {
      setBatchRosterBusy(false);
    }
  };

  const rosterDirty = useMemo(() => {
    if (!roster) return false;
    const before = new Set((roster.mentors || []).map((x) => (typeof x === 'string' ? x : x?._id || x)));
    const beforeS = new Set((roster.students || []).map((x) => (typeof x === 'string' ? x : x?._id || x)));
    const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
    return !sameSet(before, new Set(rosterMentorIds)) || !sameSet(beforeS, new Set(rosterStudentIds));
  }, [roster, rosterMentorIds, rosterStudentIds]);

  const toggleMentor = (id) =>
    setRosterMentorIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const toggleStudent = (id) =>
    setRosterStudentIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const saveRoster = async () => {
    setRosterBusy(true);
    try {
      await axiosInstance.patch(`/batches/${roster._id}/mentors`, { mentorIds: rosterMentorIds });
      await axiosInstance.patch(`/batches/${roster._id}/students`, { studentIds: rosterStudentIds });
      flash('success', `Roster saved for “${roster.name}”.`);
      closeRoster();
      load();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not save the roster.');
    } finally {
      setRosterBusy(false);
    }
  };

  const q = rosterSearch.trim().toLowerCase();
  const mentorCandidates = mentors.filter(
    (m) => !rosterMentorIds.includes(m._id) && `${m.fullName} ${m.email}`.toLowerCase().includes(q),
  );
  const studentCandidates = students.filter(
    (s) => !rosterStudentIds.includes(s._id) && `${s.fullName} ${s.email}`.toLowerCase().includes(q) && (!roster?.batchYear?.students || roster.batchYear.students.some((member) => (typeof member === 'string' ? member : member?._id) === s._id)),
  );
  const selectedMentors = rosterMentorIds.map((id) => mentors.find((m) => m._id === id)).filter(Boolean);
  const selectedStudents = rosterStudentIds.map((id) => students.find((s) => s._id === id)).filter(Boolean);
  const parentBatch = batchYears.find((batchYear) => (batchYear._id === (roster?.batchYear?._id || roster?.batchYear)));
  const parentMentorIds = new Set((parentBatch?.mentors || []).map((user) => typeof user === 'string' ? user : user._id));
  const parentStudentIds = new Set((parentBatch?.students || []).map((user) => typeof user === 'string' ? user : user._id));
  const filteredMentorCandidates = mentorCandidates.filter((mentor) => parentMentorIds.has(mentor._id));
  const filteredStudentCandidates = studentCandidates.filter((student) => parentStudentIds.has(student._id));

  const dateRange = (y) =>
    y ? `${new Date(y.startDate).toLocaleDateString()} → ${new Date(y.endDate).toLocaleDateString()}` : '';

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#f5efe6]">Batches &amp; Groups</h1>
          <p className="text-xs text-[#a39081]">
            A batch is the yearly cohort — you'll rarely touch it. Groups are the mentoring circles
            inside a batch, where several mentors can share a set of students.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setYearsPanelOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
          >
            <IconCalendar className="h-3.5 w-3.5" />
            Manage Batches
          </button>
          <button
            type="button"
            onClick={() => (creatingGroup ? setCreatingGroup(false) : openCreateGroup())}
            disabled={batchYears.length === 0}
            title={batchYears.length === 0 ? 'Create a batch first' : undefined}
            className="flex items-center gap-1.5 rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <IconPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {creatingGroup ? 'Close' : 'New Group'}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`rounded-xl border p-3 text-sm ${
            message.type === 'error'
              ? 'border-rose-700/40 bg-rose-950/30 text-rose-300'
              : 'border-emerald-700/40 bg-emerald-950/30 text-emerald-300'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* ---------- rarely-used batch (year) management strip ---------- */}
      {yearsPanelOpen && (
        <section className={`${panel} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#f5efe6]">Batches</h2>
              <p className="text-[11px] text-[#a39081]">The yearly containers groups live inside. Usually one or two exist at a time.</p>
            </div>
            {!creatingYear && (
              <button
                type="button"
                onClick={() => setCreatingYear(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#c89b7b] px-3 py-1.5 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer"
              >
                <IconPlus className="h-3 w-3" /> New Batch
              </button>
            )}
          </div>

          {creatingYear && (
            <form onSubmit={submitYear} className="mt-4 grid gap-3 rounded-xl border border-[#4a3b32] p-4 md:grid-cols-4">
              <input
                className={field}
                placeholder="Batch name (e.g. 2026 Batch)"
                value={yearForm.name}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                required
              />
              <input
                className={field}
                placeholder="Description (optional)"
                value={yearForm.description}
                onChange={(e) => setYearForm({ ...yearForm, description: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={yearForm.startDate}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                required
              />
              <input
                className={field}
                type="date"
                value={yearForm.endDate}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                required
              />
              <div className="flex gap-2 md:col-span-4">
                <button className="flex-1 rounded-xl bg-[#c89b7b] py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer">
                  {editingYear ? 'Save Changes' : 'Create Batch'}
                </button>
                <button
                  type="button"
                  onClick={cancelYearForm}
                  className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 space-y-2">
            {batchYears.length === 0 ? (
              <p className="text-xs text-[#a39081]">No batches yet — create one above to start adding groups.</p>
            ) : (
              batchYears.map((y) => (
                <div key={y._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#4a3b32] p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm text-[#f5efe6]">{y.name}</b>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[y.status] || STATUS_STYLES.upcoming}`}>
                        {y.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a39081]">{dateRange(y)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openBatchRoster(y)}
                      className="rounded-lg border border-[#4a3b32] px-2.5 py-1.5 text-[11px] font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                    >
                      Manage Members
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateGroup(y._id)}
                      className="rounded-lg border border-[#4a3b32] px-2.5 py-1.5 text-[11px] font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                    >
                      + Group
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditYear(y)}
                      className="rounded-lg border border-[#4a3b32] p-1.5 text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeYear(y)}
                      className="rounded-lg border border-[#4a3b32] p-1.5 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ---------- group create (no dates — inherited from the chosen batch) ---------- */}
      {creatingGroup && (
        <form onSubmit={submitCreateGroup} className={`${panel} grid gap-3 p-5 md:grid-cols-3`}>
          <input
            className={field}
            placeholder="Group name (e.g. Frontend Circle A)"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            required
          />
          <input
            className={field}
            placeholder="Description (optional)"
            value={groupForm.description}
            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
          />
          <select
            className={field}
            value={groupForm.batchYearId}
            onChange={(e) => setGroupForm({ ...groupForm, batchYearId: e.target.value })}
            required
          >
            <option value="" disabled>
              Choose a batch…
            </option>
            {batchYears.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
          <button
            disabled={creatingGroupBusy}
            className="rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:opacity-50 md:col-span-3 cursor-pointer"
          >
            {creatingGroupBusy ? 'Creating…' : 'Create Group'}
          </button>
          <p className="text-[11px] text-[#a39081] md:col-span-3">
            The group takes its timeframe from the batch you pick. You'll add mentors and students right after, from its card.
          </p>
        </form>
      )}

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a39081]" />
        <input
          value={groupSearch}
          onChange={(e) => setGroupSearch(e.target.value)}
          placeholder="Search groups by name…"
          className={`${field} pl-9`}
        />
      </div>

      {loading ? (
        <div className={`${panel} p-8 text-center text-sm text-[#a39081]`}>Loading…</div>
      ) : groupsByYear.size === 0 ? (
        <div className={`${panel} p-8 text-center text-sm text-[#a39081]`}>
          {groups.length === 0
            ? 'No groups yet. Create a batch, then add a group inside it.'
            : 'No groups match your search.'}
        </div>
      ) : (
        <div className="space-y-4">
          {[...groupsByYear.entries()]
            .sort(([a], [b]) => (a === 'ungrouped' ? 1 : b === 'ungrouped' ? -1 : 0))
            .map(([yearId, yearGroups]) => {
              const y = yearId === 'ungrouped' ? null : batchYears.find((by) => by._id === yearId) || yearGroups[0]?.batchYear;
              const isOpen = openYears.has(yearId) || groupSearch.trim() !== '';
              return (
                <section key={yearId} className={`${panel} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => toggleYearOpen(yearId)}
                    className="flex w-full items-center justify-between gap-3 p-5 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <IconChevron className={`h-4 w-4 text-[#a39081] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-[#f5efe6]">{y ? y.name : 'Ungrouped'}</h2>
                          {y && (
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[y.status] || STATUS_STYLES.upcoming}`}>
                              {y.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#a39081]">
                          {y ? dateRange(y) : "Groups not yet assigned to a batch"} · {yearGroups.length} group
                          {yearGroups.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="grid gap-4 border-t border-[#4a3b32] p-5 md:grid-cols-2">
                      {yearGroups.map((g) => {
                        const groupMentors = (g.mentors || []).filter((m) => typeof m === 'object');
                        const groupStudents = g.students || [];
                        const shown = groupMentors.slice(0, 5);
                        const extra = groupMentors.length - shown.length;
                        return (
                          <div key={g._id} className="rounded-2xl border border-[#4a3b32] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate font-bold text-[#f5efe6]">{g.name}</h3>
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[g.status] || STATUS_STYLES.upcoming}`}>
                                    {g.status}
                                  </span>
                                </div>
                                {g.description && <p className="mt-1 text-xs text-[#a39081]">{g.description}</p>}
                              </div>
                              <div className="flex shrink-0 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditGroup(g)}
                                  title="Edit group"
                                  className="rounded-lg border border-[#4a3b32] p-2 text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                                >
                                  <IconPencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeGroup(g)}
                                  title="Delete group"
                                  className="rounded-lg border border-[#4a3b32] p-2 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                                >
                                  <IconTrash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[#4a3b32] pt-3">
                              <div>
                                <p className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                                  <IconUsers className="h-3 w-3" /> Mentors · {groupMentors.length}
                                </p>
                                {groupMentors.length === 0 ? (
                                  <p className="flex items-center gap-1 text-xs text-amber-400">
                                    <IconAlert className="h-3.5 w-3.5" /> No mentors yet
                                  </p>
                                ) : (
                                  <div className="flex -space-x-2">
                                    {shown.map((m) => (
                                      <Avatar key={m._id} person={m} />
                                    ))}
                                    {extra > 0 && (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1e1713] bg-[#4a3b32] text-[10px] font-bold text-[#f5efe6]">
                                        +{extra}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                                  <IconCap className="h-3 w-3" /> Students · {groupStudents.length}
                                </p>
                                <p className="text-xs text-[#f5efe6]">{groupStudents.length} enrolled</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openRoster(g)}
                              className="mt-3 w-full rounded-xl bg-[#c89b7b] py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer"
                            >
                              Manage Mentors &amp; Students
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      )}

      {/* ---------- edit group modal (no dates — move between batches instead) ---------- */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditingGroup(null)}>
          <form
            onSubmit={submitEditGroup}
            onClick={(e) => e.stopPropagation()}
            className={`${panel} w-full max-w-md space-y-3 p-6`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5efe6]">Edit Group</h2>
              <button type="button" onClick={() => setEditingGroup(null)} className="text-[#a39081] hover:text-[#f5efe6] cursor-pointer">
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            {message?.type === 'error' && <p className="rounded-xl border border-rose-700/40 bg-rose-950/30 p-3 text-sm text-rose-300">{message.text}</p>}
            <input
              className={field}
              placeholder="Group name"
              value={editGroupForm.name}
              onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
              required
            />
            <input
              className={field}
              placeholder="Description"
              value={editGroupForm.description}
              onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
            />
            <select
              className={field}
              value={editGroupForm.batchYearId}
              onChange={(e) => setEditGroupForm({ ...editGroupForm, batchYearId: e.target.value })}
              required
            >
              {batchYears.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
            <select
              className={field}
              value={editGroupForm.status}
              onChange={(e) => setEditGroupForm({ ...editGroupForm, status: e.target.value })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <button className="w-full rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer">
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* ---------- roster modal: the actual multi-mentor assignment UX ---------- */}
      {roster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeRoster}>
          <div onClick={(e) => e.stopPropagation()} className={`${panel} flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden`}>
            <div className="flex items-start justify-between gap-3 border-b border-[#4a3b32] p-5">
              <div>
                <h2 className="text-xl font-bold text-[#f5efe6]">{roster.name}</h2>
                <p className="text-xs text-[#a39081]">Tap a mentor or student below to add them to this group's circle.</p>
              </div>
              <button type="button" onClick={closeRoster} className="text-[#a39081] hover:text-[#f5efe6] cursor-pointer">
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            {message?.type === 'error' && <p className="mx-5 mt-4 rounded-xl border border-rose-700/40 bg-rose-950/30 p-3 text-sm text-rose-300">{message.text}</p>}

            <div className="flex gap-2 border-b border-[#4a3b32] px-5 pt-3">
              {[
                { id: 'mentors', label: `Mentors (${selectedMentors.length})`, Icon: IconUsers },
                { id: 'students', label: `Students (${selectedStudents.length})`, Icon: IconCap },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setRosterTab(id);
                    setRosterSearch('');
                  }}
                  className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-bold cursor-pointer ${
                    rosterTab === id
                      ? 'border border-b-0 border-[#4a3b32] bg-[#16110e] text-[#c89b7b]'
                      : 'text-[#a39081] hover:text-[#f5efe6]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                {(rosterTab === 'mentors' ? selectedMentors : selectedStudents).length === 0 && (
                  <p className="text-xs text-[#a39081]">No {rosterTab} added yet — pick from the list below.</p>
                )}
                {(rosterTab === 'mentors' ? selectedMentors : selectedStudents).map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => (rosterTab === 'mentors' ? toggleMentor(p._id) : toggleStudent(p._id))}
                    className="flex items-center gap-2 rounded-full border border-[#4a3b32] bg-[#16110e] py-1 pl-1 pr-3 text-xs text-[#f5efe6] hover:border-rose-700/60 cursor-pointer"
                  >
                    <Avatar person={p} size={6} />
                    {p.fullName}
                    <IconClose className="h-3 w-3 text-[#a39081]" />
                  </button>
                ))}
              </div>

              <div className="relative mb-3">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a39081]" />
                <input
                  autoFocus
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder={`Search ${rosterTab}…`}
                  className={`${field} pl-9`}
                />
              </div>

              <div className="space-y-1.5">
                {rosterTab === 'mentors' &&
                  (filteredMentorCandidates.length === 0 ? (
                    <p className="p-3 text-center text-xs text-[#a39081]">
                      {q ? 'No mentors match your search.' : 'Every available mentor is already in this group.'}
                    </p>
                  ) : (
                    filteredMentorCandidates.map((m) => {
                      const load = mentorLoad[m._id] || 0;
                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => toggleMentor(m._id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-left text-xs hover:border-[#c89b7b] cursor-pointer"
                        >
                          <Avatar person={m} />
                          <span className="min-w-0 flex-1">
                            <b className="text-[#f5efe6]">{m.fullName}</b>
                            <br />
                            <span className="text-[#a39081]">{m.email}</span>
                          </span>
                          <span className="shrink-0 rounded-full border border-[#4a3b32] px-2 py-1 text-[10px] text-[#a39081]">
                            {load === 0 ? 'Not yet mentoring' : `In ${load} other group${load > 1 ? 's' : ''}`}
                          </span>
                        </button>
                      );
                    })
                  ))}

                {rosterTab === 'students' &&
                  (filteredStudentCandidates.length === 0 ? (
                    <p className="p-3 text-center text-xs text-[#a39081]">
                      {q ? 'No students match your search.' : 'Every available student is already in this group.'}
                    </p>
                  ) : (
                    filteredStudentCandidates.map((s) => {
                      const home = studentHomeGroup[s._id];
                      const elsewhere = home && home._id !== roster._id;
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => toggleStudent(s._id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-left text-xs hover:border-[#c89b7b] cursor-pointer"
                        >
                          <Avatar person={s} />
                          <span className="min-w-0 flex-1">
                            <b className="text-[#f5efe6]">{s.fullName}</b>
                            <br />
                            <span className="text-[#a39081]">{s.department || s.email}</span>
                          </span>
                          {elsewhere && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">
                              <IconAlert className="h-3 w-3" /> Moves from {home.name}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#4a3b32] p-5">
              <p className="text-[11px] text-[#a39081]">{rosterDirty ? 'You have unsaved changes.' : 'No changes to save.'}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeRoster}
                  className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rosterDirty || rosterBusy}
                  onClick={saveRoster}
                  className="flex items-center gap-1.5 rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <IconCheck className="h-3.5 w-3.5" />
                  {rosterBusy ? 'Saving…' : 'Save Roster'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {batchRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeBatchRoster}>
          <div onClick={(e) => e.stopPropagation()} className={`${panel} flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden`}>
            <div className="flex items-start justify-between gap-3 border-b border-[#4a3b32] p-5">
              <div><h2 className="text-xl font-bold text-[#f5efe6]">Manage {batchRoster.name}</h2><p className="text-xs text-[#a39081]">Choose the mentors and students who can be added to groups in this batch.</p></div>
              <button type="button" onClick={closeBatchRoster} className="text-[#a39081] hover:text-[#f5efe6]"><IconClose className="h-5 w-5" /></button>
            </div>
            {message?.type === 'error' && <p className="mx-5 mt-4 rounded-xl border border-rose-700/40 bg-rose-950/30 p-3 text-sm text-rose-300">{message.text}</p>}
            <div className="flex gap-2 border-b border-[#4a3b32] px-5 pt-3">
              {['mentors', 'students'].map((tab) => <button key={tab} type="button" onClick={() => { setBatchRosterTab(tab); setBatchRosterSearch(''); }} className={`rounded-t-lg px-4 py-2 text-xs font-bold ${batchRosterTab === tab ? 'border border-b-0 border-[#4a3b32] bg-[#16110e] text-[#c89b7b]' : 'text-[#a39081]'}`}>{tab === 'mentors' ? `Mentors (${batchRosterMentorIds.length})` : `Students (${batchRosterStudentIds.length})`}</button>)}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <input value={batchRosterSearch} onChange={(e) => setBatchRosterSearch(e.target.value)} placeholder={`Search ${batchRosterTab}…`} className={field} />
              <div className="mt-4 space-y-2">
                {(batchRosterTab === 'mentors' ? mentors : students).filter((person) => `${person.fullName} ${person.email}`.toLowerCase().includes(batchRosterSearch.toLowerCase())).map((person) => {
                  const ids = batchRosterTab === 'mentors' ? batchRosterMentorIds : batchRosterStudentIds;
                  const checked = ids.includes(person._id);
                  return <label key={person._id} className="flex items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-xs"><input type="checkbox" checked={checked} onChange={() => batchRosterTab === 'mentors' ? toggleBatchMentor(person._id) : toggleBatchStudent(person._id)} /><span><b>{person.fullName}</b><br /><span className="text-[#a39081]">{person.email}</span></span></label>;
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#4a3b32] p-5"><button type="button" onClick={closeBatchRoster} className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-bold text-[#a39081]">Cancel</button><button type="button" disabled={batchRosterBusy} onClick={saveBatchRoster} className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] disabled:opacity-50">{batchRosterBusy ? 'Saving…' : 'Save Members'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}