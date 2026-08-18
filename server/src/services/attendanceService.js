const Attendance=require("../modules/attendance/attendanceModel");
const User=require("../modules/users/userModel");
async function canManage(user,studentId){ if(user.role==='admin') return true; if(user.role==='student') return String(user._id)===String(studentId); return !!(await User.exists({_id:studentId,role:'student',mentor:user._id,status:'approved',isActive:true})); }
async function summary(studentId,from,to){ const q={student:studentId}; if(from||to) q.date={...(from?{$gte:new Date(from)}:{}),...(to?{$lte:new Date(to)}:{})}; const records=await Attendance.find(q).sort({date:-1}); const counts={Present:0,Absent:0,Late:0,Excused:0}; records.forEach(r=>{counts[r.status]=(counts[r.status]||0)+1;}); const applicable=records.length; return {total:records.length,applicableSessions:applicable,counts,attendancePercentage:applicable?Number((counts.Present/applicable*100).toFixed(2)):0}; }
module.exports={canManage,summary};
