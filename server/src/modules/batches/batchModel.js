const mongoose = require('mongoose');
// NOTE: this model is what the admin UI now calls a "Group" (a mentoring
// circle of mentors + students). It still registers as the "Batch" Mongoose
// model/collection because sessions, assignments, announcements and access
// control all already reference it by that name via `ref: "Batch"` - only
// the UI-facing vocabulary changed. The yearly container the UI calls
// "Batch" now lives in the separate, lightweight `BatchYear` model.
const batchSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,unique:true},
  description:{type:String,trim:true,default:''},
  // Dates are inherited from the parent BatchYear on creation and kept in
  // sync when the parent's dates change, so groups no longer ask for dates.
  startDate:{type:Date},
  endDate:{type:Date},
  batchYear:{type:mongoose.Schema.Types.ObjectId,ref:'BatchYear',default:null},
  mentors:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  students:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  status:{type:String,enum:['upcoming','active','completed'],default:'upcoming'}
},{timestamps:true});
batchSchema.index({status:1,startDate:1});
batchSchema.index({batchYear:1});
module.exports=mongoose.model('Batch',batchSchema);