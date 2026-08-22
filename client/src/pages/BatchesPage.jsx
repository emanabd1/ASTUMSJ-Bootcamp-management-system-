import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const field = 'w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none';

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [edit, setEdit] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [b, u, m] = await Promise.all([
        axiosInstance.get('/batches'),
        axiosInstance.get('/users?role=student&status=approved'),
        axiosInstance.get('/users/mentors'),
      ]);
      setBatches(b.data.batches || []);
      setStudents(u.data.users || []);
      setMentors(m.data.mentors || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Could not load batches.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (edit) await axiosInstance.patch(`/batches/${edit._id}`, form);
      else await axiosInstance.post('/batches', form);
      setForm({ name: '', description: '', startDate: '', endDate: '' });
      setEdit(null);
      setMessage('Batch saved.');
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Could not save batch.');
    }
  };

  const manage = async (b) => {
    setEdit(b);
    setForm({
      name: b.name,
      description: b.description || '',
      startDate: b.startDate?.slice(0, 10),
      endDate: b.endDate?.slice(0, 10),
    });
    
    // Safely extract IDs whether populated or raw strings
    setSelectedStudents(
      (b.students || []).map((x) => (typeof x === 'string' ? x : x?._id || x))
    );
    setSelectedMentors(
      (b.mentors || []).map((x) => (typeof x === 'string' ? x : x?._id || x))
    );
  };

  const saveAssignments = async (b) => {
    try {
      // Matches the backend routes for mentors and students update
      await axiosInstance.patch(`/batches/${b._id}/mentors`, { mentorIds: selectedMentors });
      await axiosInstance.patch(`/batches/${b._id}/students`, { studentIds: selectedStudents });
      setMessage('Batch enrollment and mentors updated.');
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Could not update batch.');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this batch?')) return;
    try {
      await axiosInstance.delete(`/batches/${id}`);
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Batches</h1>
          <p className="text-xs text-[#a39081]">Create cohorts, assign mentors and enroll students.</p>
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {message}
        </p>
      )}

      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5 md:grid-cols-4">
        <input className={field} placeholder="Batch name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={field} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className={field} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
        <input className={field} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        <button type="submit" className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] md:col-span-4 cursor-pointer">
          {edit ? 'Update Batch' : 'Create Batch'}
        </button>
      </form>

      <div className="grid gap-4">
        {batches.map((b) => (
          <section key={b._id} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{b.name}</h2>
                <p className="text-xs text-[#a39081]">
                  {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()} · {b.students?.length || 0} students · {b.mentors?.length || 0} mentors
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => manage(b)} className="rounded-lg bg-[#c89b7b] px-3 py-2 text-xs font-bold text-[#1e1713] cursor-pointer">
                  Manage
                </button>
                <button type="button" onClick={() => remove(b._id)} className="rounded-lg bg-rose-700/70 px-3 py-2 text-xs cursor-pointer text-white">
                  Delete
                </button>
              </div>
            </div>

            {edit?._id === b._id && (
              <div className="mt-5 grid gap-5 border-t border-[#4a3b32] pt-5 md:grid-cols-2">
                <div>
                  <h3 className="font-bold">Assign Mentors</h3>
                  <div className="mt-3 space-y-2 max-h-48 overflow-auto">
                    {mentors.map((m) => (
                      <label key={m._id} className="flex gap-2 rounded-xl border border-[#4a3b32] p-3 text-sm cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selectedMentors.includes(m._id)}
                          onChange={(e) =>
                            setSelectedMentors(
                              e.target.checked ? [...selectedMentors, m._id] : selectedMentors.filter((id) => id !== m._id)
                            )
                          }
                        />
                        <span>{m.fullName}</span> <span className="text-[#a39081] text-xs">{m.email}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold">Enroll Students</h3>
                  <div className="mt-3 space-y-2 max-h-48 overflow-auto">
                    {students.map((st) => (
                      <label key={st._id} className="flex gap-2 rounded-xl border border-[#4a3b32] p-3 text-sm cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(st._id)}
                          onChange={(e) =>
                            setSelectedStudents(
                              e.target.checked ? [...selectedStudents, st._id] : selectedStudents.filter((id) => id !== st._id)
                            )
                          }
                        />
                        <span>{st.fullName}</span> <span className="text-[#a39081] text-xs">{st.department || ''}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={() => saveAssignments(b)}
                    className="w-full rounded-xl bg-[#c89b7b] px-4 py-3 text-xs font-bold text-[#1e1713] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Save Enrollment
                  </button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}