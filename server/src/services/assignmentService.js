const User=require("../modules/users/userModel");
async function eligibleStudents(user,batchId,requestedIds=[]){ const q={role:'student',status:'approved',isActive:true}; if(batchId) q.batch=batchId; if(user.role==='mentor') q.mentor=user._id; if(requestedIds.length) q._id={$in:requestedIds}; return User.find(q).select('_id fullName email batch mentor'); }
function validateDeadline(value,allowPast=false){ const d=new Date(value); if(Number.isNaN(d.getTime())) return {ok:false,message:'Deadline must be a valid date.'}; if(!allowPast&&d<=new Date()) return {ok:false,message:'Deadline must be in the future.'}; return {ok:true,date:d}; }
module.exports={eligibleStudents,validateDeadline};
