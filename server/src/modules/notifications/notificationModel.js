const mongoose=require('mongoose');
const notificationSchema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},title:{type:String,required:true},message:{type:String,required:true},type:{type:String,default:'info'},link:{type:String,default:''},read:{type:Boolean,default:false},meta:{type:Object,default:{}}},{timestamps:true});
notificationSchema.index({user:1,read:1,createdAt:-1});
module.exports=mongoose.model('Notification',notificationSchema);
