const mongoose = require('mongoose');
const batchSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,unique:true},
  description:{type:String,trim:true,default:''},
  startDate:{type:Date,required:true},
  endDate:{type:Date,required:true},
  mentors:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  students:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  status:{type:String,enum:['upcoming','active','completed'],default:'upcoming'}
},{timestamps:true});
batchSchema.index({status:1,startDate:1});
module.exports=mongoose.model('Batch',batchSchema);
