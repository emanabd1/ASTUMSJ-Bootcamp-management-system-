import React, { useState } from 'react';

export default function AdminAttendance() {
  const CLASS_START_TIME = "03:00 PM";
  const CLASS_END_TIME = "05:00 PM";

  const lectures = [
    { id: 'lec1', title: 'CP LECTURE - 1', date: 'TUE, JUN 9' },
    { id: 'lec2', title: 'CP LECTURE - 2', date: 'THU, JUN 11' },
    { id: 'lec3', title: 'CP LECTURE - 3', date: 'MON, JUN 15' },
  ];

  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'Eman Mohammed',
      studentId: 'RU/1234/18',
      attendance: {
        lec1: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec2: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec3: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
      },
    },
    {
      id: 2,
      name: 'Abebe Kebede',
      studentId: 'RU/5678/18',
      attendance: {
        lec1: { start: 'Late', startTime: '15:08', mid: 'Present', end: 'Present' },
        lec2: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec3: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
      },
    },
    {
      id: 3,
      name: 'Ekram Mutelib',
      studentId: 'RU/3456/18',
      attendance: {
        lec1: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec2: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec3: { start: 'Absent', startTime: '', mid: 'Absent', end: 'Absent' },
      },
    },
    {
      id: 4,
      name: 'Chala Bekele',
      studentId: 'RU/9012/18',
      attendance: {
        lec1: { start: 'Excused', startTime: '', mid: 'Excused', end: 'Absent' },
        lec2: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec3: { start: 'Late', startTime: '15:10', mid: 'Absent', end: 'Absent' },
      },
    },
    {
      id: 5,
      name: 'Dawit Yosef',
      studentId: 'RU/4321/18',
      attendance: {
        lec1: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec2: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
        lec3: { start: 'Present', startTime: '', mid: 'Present', end: 'Present' },
      },
    },
  ]);

  const [selectedDate, setSelectedDate] = useState('2026-08-17');

  const isTimeLate = (timeStr) => {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(':').map(Number);

    if ((h === 3 || h === 15) && m > 5) return true;
    if ((h > 3 && h < 12) || h > 15) return true;

    return false;
  };

  const handleStartTimeChange = (studentId, lecId, timeValue) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          const currentLec = student.attendance[lecId] || { start: 'Present', mid: 'Present', end: 'Present' };
          const lateStatus = isTimeLate(timeValue);

          return {
            ...student,
            attendance: {
              ...student.attendance,
              [lecId]: {
                ...currentLec,
                startTime: timeValue,
                start: timeValue ? (lateStatus ? 'Late' : 'Present') : currentLec.start,
              },
            },
          };
        }
        return student;
      })
    );
  };

  const cycleStatus = (currentStatus, checkpoint) => {
    if (checkpoint === 'start') {
      if (currentStatus === 'Present') return 'Late';
      if (currentStatus === 'Late') return 'Excused';
      if (currentStatus === 'Excused') return 'Absent';
      return 'Present';
    } else {
      if (currentStatus === 'Present') return 'Excused';
      if (currentStatus === 'Excused') return 'Absent';
      return 'Present';
    }
  };

  const handleStatusChange = (studentId, lecId, checkpoint) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          const currentLec = student.attendance[lecId] || { start: 'Present', mid: 'Present', end: 'Present' };
          const currentVal = currentLec[checkpoint] || 'Present';
          const nextVal = cycleStatus(currentVal, checkpoint);

          return {
            ...student,
            attendance: {
              ...student.attendance,
              [lecId]: {
                ...currentLec,
                [checkpoint]: nextVal,
              },
            },
          };
        }
        return student;
      })
    );
  };

  const getGeneralStatus = (lecAtt = {}) => {
    const { start, mid, end } = lecAtt;
    if (start === 'Present' || start === 'Late' || mid === 'Present' || end === 'Present') {
      return 'Present';
    }
    if (start === 'Excused' || mid === 'Excused' || end === 'Excused') {
      return 'Excused';
    }
    return 'Absent';
  };

  const calculateLecturePercentage = (lecAtt = {}) => {
    const general = getGeneralStatus(lecAtt);
    if (general === 'Absent') return 0; // ሙሉ በሙሉ ከቀረ 0%

    let points = 0;

    if (lecAtt.start === 'Present' || lecAtt.start === 'Excused') points += 1;
    else if (lecAtt.start === 'Late') points += 0.5; // ለ Late 50% ነጥብ

    if (lecAtt.mid === 'Present' || lecAtt.mid === 'Excused') points += 1;

    if (lecAtt.end === 'Present' || lecAtt.end === 'Excused') points += 1;

    return Math.round((points / 3) * 100);
  };

  const calculateTotals = (student) => {
    let p = 0, e = 0, ex = 0, a = 0;
    lectures.forEach((lec) => {
      const att = student.attendance[lec.id] || {};
      const general = getGeneralStatus(att);

      if (general === 'Absent') {
        a += 1;
      } else if (general === 'Excused') {
        ex += 1;
      } else {
        p += 1;
        if (att.start === 'Late') e += 1;
      }
    });
    return { p, e, ex, a };
  };

  const getBadgeStyle = (status) => {
    if (status === 'Present') return 'bg-emerald-600 text-white hover:bg-emerald-500';
    if (status === 'Late') return 'bg-amber-600 text-white hover:bg-amber-500';
    if (status === 'Excused') return 'bg-sky-600 text-white hover:bg-sky-500';
    return 'bg-rose-600 text-white hover:bg-rose-500';
  };

  const getPercentageColor = (pct) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 50) return 'text-amber-400';
    if (pct > 0) return 'text-sky-400';
    return 'text-rose-500';
  };

  return (
    <div className="min-h-screen bg-[#0d0c0b] text-white p-4 md:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#2a2420] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              ASTUMSJ Summer Bootcamp CP Batch 3
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Class Hours: <span className="text-[#8a5e3f] font-semibold">{CLASS_START_TIME} - {CLASS_END_TIME}</span> | 
              Grace Period: <span className="text-amber-400 font-semibold">3:00 PM - 3:05 PM</span> | 
              <span className="text-rose-400 font-semibold"> Late = 50% Credit</span>
            </p>
          </div>

          <button
            onClick={() => alert('Attendance Saved Successfully!')}
            className="bg-[#8a5e3f] hover:bg-[#734c32] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-md cursor-pointer"
          >
            Save Attendance
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1a1715] p-4 rounded-xl border border-[#2a2420]">
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-400 font-mono">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#12100e] border border-[#3f3832] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8a5e3f]"
            />
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <span className="text-emerald-400 font-bold">P = Attended (&ge;1 Present)</span>
            <span className="text-amber-400 font-bold">E = Late (&gt; 3:05 PM)</span>
            <span className="text-sky-400 font-bold">EX = Excused</span>
            <span className="text-rose-400 font-bold">A = Absent (0%)</span>
          </div>
        </div>

        <div className="bg-[#1a1715] rounded-xl border border-[#2a2420] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead className="bg-[#12100e] text-zinc-300 uppercase tracking-wider border-b border-[#2a2420]">
                <tr className="text-center font-bold text-[11px] border-b border-[#2a2420]">
                  <th rowSpan="3" className="py-3 px-3 border-r border-[#2a2420] w-10">#</th>
                  <th rowSpan="3" className="py-3 px-4 border-r border-[#2a2420] text-left">NAME</th>
                  <th rowSpan="3" className="py-3 px-2 border-r border-[#2a2420] text-emerald-400">P</th>
                  <th rowSpan="3" className="py-3 px-2 border-r border-[#2a2420] text-amber-400">E</th>
                  <th rowSpan="3" className="py-3 px-2 border-r border-[#2a2420] text-sky-400">EX</th>
                  <th rowSpan="3" className="py-3 px-2 border-r border-[#2a2420] text-rose-400">A</th>

                  {lectures.map((lec) => (
                    <th
                      key={lec.id}
                      colSpan="5"
                      className="py-2 px-3 border-r border-[#2a2420] bg-[#251e18] text-[#e0a875]"
                    >
                      {lec.title}
                    </th>
                  ))}
                </tr>

                <tr className="text-center font-bold text-[11px] border-b border-[#2a2420] bg-[#171412]">
                  {lectures.map((lec) => (
                    <th
                      key={lec.id}
                      colSpan="5"
                      className="py-1.5 px-3 border-r border-[#2a2420] text-zinc-300"
                    >
                      {lec.date}
                    </th>
                  ))}
                </tr>

                <tr className="text-center text-[10px] bg-[#12100e] text-zinc-400">
                  {lectures.map((lec) => (
                    <React.Fragment key={lec.id}>
                      <th className="py-1.5 px-2 border-r border-[#2a2420]/50">START (3:00)</th>
                      <th className="py-1.5 px-2 border-r border-[#2a2420]/50">MID (4:00)</th>
                      <th className="py-1.5 px-2 border-r border-[#2a2420]/50">END (5:00)</th>
                      <th className="py-1.5 px-2 border-r border-[#2a2420]/50 bg-[#1a1613] text-[#e0a875] font-bold">GENERAL</th>
                      <th className="py-1.5 px-2 border-r border-[#2a2420] bg-[#161a15] text-emerald-400 font-bold">% SCORE</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2a2420]">
                {students.map((student, index) => {
                  const totals = calculateTotals(student);

                  return (
                    <tr key={student.id} className="hover:bg-[#25211e] transition">
                      <td className="py-3 px-3 font-mono text-zinc-500 border-r border-[#2a2420] text-center">{index + 1}</td>
                      <td className="py-3 px-4 border-r border-[#2a2420] font-bold text-white">
                        {student.name}
                        <div className="text-[10px] font-mono text-zinc-500 font-normal">{student.studentId}</div>
                      </td>
                      <td className="py-3 px-2 border-r border-[#2a2420] text-center font-mono font-bold text-emerald-400">{totals.p}</td>
                      <td className="py-3 px-2 border-r border-[#2a2420] text-center font-mono font-bold text-amber-400">{totals.e}</td>
                      <td className="py-3 px-2 border-r border-[#2a2420] text-center font-mono font-bold text-sky-400">{totals.ex}</td>
                      <td className="py-3 px-2 border-r border-[#2a2420] text-center font-mono font-bold text-rose-400">{totals.a}</td>

                      {lectures.map((lec) => {
                        const att = student.attendance[lec.id] || { start: 'Present', startTime: '', mid: 'Present', end: 'Present' };
                        const generalStatus = getGeneralStatus(att);
                        const percentage = calculateLecturePercentage(att);

                        return (
                          <React.Fragment key={lec.id}>
                            <td className="py-3 px-2 border-r border-[#2a2420]/50 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, lec.id, 'start')}
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${getBadgeStyle(att.start)}`}
                                >
                                  {att.start}
                                </button>
                                <input
                                  type="time"
                                  value={att.startTime || ''}
                                  onChange={(e) => handleStartTimeChange(student.id, lec.id, e.target.value)}
                                  className="bg-[#12100e] border border-[#3f3832] rounded px-1 text-[9px] text-zinc-400 focus:outline-none focus:border-[#8a5e3f]"
                                />
                              </div>
                            </td>

                            <td className="py-3 px-2 border-r border-[#2a2420]/50 text-center">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, lec.id, 'mid')}
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${getBadgeStyle(att.mid)}`}
                              >
                                {att.mid}
                              </button>
                            </td>

                            <td className="py-3 px-2 border-r border-[#2a2420]/50 text-center">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, lec.id, 'end')}
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${getBadgeStyle(att.end)}`}
                              >
                                {att.end}
                              </button>
                            </td>

                            <td className="py-3 px-2 border-r border-[#2a2420]/50 text-center bg-[#14110f]">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${getBadgeStyle(generalStatus)}`}>
                                {generalStatus}
                              </span>
                            </td>

                            <td className="py-3 px-2 border-r border-[#2a2420] text-center bg-[#121512] font-mono font-bold">
                              <span className={`text-[11px] ${getPercentageColor(percentage)}`}>
                                {percentage}%
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}