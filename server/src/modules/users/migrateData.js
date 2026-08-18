const mongoose=require('mongoose');require('dotenv').config();
const User=require('./userModel');const Batch=require('../batches/batchModel');const Assignment=require('../assignments/assignmentModel');
(async()=>{try{await mongoose.connect(process.env.MONGO_URI);let batchesFixed=0,assignmentsFixed=0;
const batches=await Batch.find();for(const b of batches){const validStudents=await User.find({_id:{$in:b.students},role:'student'}).select('_id');b.students=validStudents.map(x=>x._id);await User.updateMany({batch:b._id,role:'student'},{$set:{batch:b._id}});await b.save();}
for(const a of await Assignment.find({batch:{$type:'string'}})){const b=batches.find(x=>x.name===a.batch);if(b){a.batch=b._id;await a.save();assignmentsFixed++;}}
for(const u of await User.find({role:'student',batch:{$ne:null}})){const b=await Batch.findById(u.batch).select('_id');if(!b){u.batch=null;await u.save();batchesFixed++;}}
console.log(`Migration complete. invalid user batches cleared: ${batchesFixed}; assignment batch references converted: ${assignmentsFixed}.`);await mongoose.disconnect();}catch(e){console.error('Migration failed:',e);process.exit(1)}})();
