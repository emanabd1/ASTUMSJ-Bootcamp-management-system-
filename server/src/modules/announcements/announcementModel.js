const mongoose=require('mongoose');
const schema=new mongoose.Schema({title:{type:String,required:true,trim:true},content:{type:String,required:true,trim:true},targetAudience:{type:String,enum:['all','students','mentors','batch'],default:'all'},batch:{type:mongoose.Schema.Types.ObjectId,ref:'Batch',default:null},publishDate:{type:Date,default:Date.now},author:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}},{timestamps:true});
schema.index({publishDate:-1});
module.exports=mongoose.model('Announcement',schema);
