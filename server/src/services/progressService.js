const Progress=require("../modules/progress/progressModel");
const User=require("../modules/users/userModel");
async function canManage(user,studentId){ return user.role==='admin'||(user.role==='mentor'&&await User.exists({_id:studentId,role:'student',mentor:user._id,status:'approved',isActive:true})); }
function summarize(records){ const total=records.length, completed=records.filter(r=>r.status==='Completed').length, needsImprovement=records.filter(r=>r.status==='Needs Improvement').length; return {total,completed,needsImprovement,percentage:total?Number((completed/total*100).toFixed(2)):0,atRisk:needsImprovement>0|| (total>0 && completed/total<0.5)}; }
module.exports={canManage,summarize};
