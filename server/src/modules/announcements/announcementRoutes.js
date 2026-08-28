const express = require("express");
const Announcement = require("./announcementModel");
const Notification = require("../notifications/notificationModel");
const User = require("../users/userModel");
const Batch = require("../batches/batchModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");
const { recipientsFor } = require("../../services/announcementService");
const router = express.Router();
router.use(protect);

const audienceValues = ["all", "students", "mentors", "batch"];



router.get("/", async (req,res,next)=>{
  try {
    const now = new Date();
    let query;
    if (req.user.role === "admin") query = {};
    else if (req.user.role === "mentor") {
      const mentorBatches = await Batch.find({ mentors: req.user._id }).select("_id");
      query = { publishDate: { $lte: now }, $or: [{ targetAudience: "all", targetRole: { $in: ["all", "mentors", null] } }, { targetAudience: "mentors" }, { author: req.user._id }, { targetAudience: "batch", batch: { $in: mentorBatches.map(b=>b._id) }, targetRole: { $in: ["all", "mentors", null] } }] };
    } else {
      const adminIds = await User.find({ role: "admin" }).select("_id");
      query = { publishDate: { $lte: now }, $or: [{ targetAudience: "all", targetRole: { $in: ["all", "students", null] } }, { targetAudience: "students", author: { $in: adminIds.map((admin) => admin._id) } }, { targetAudience: "batch", batch: req.user.batch, targetRole: { $in: ["all", "students", null] }, author: { $in: adminIds.map((admin) => admin._id) } }, { author: req.user.mentor, targetAudience: "students", targetRole: "students" }, { author: req.user.mentor, targetAudience: "batch", batch: req.user.batch, targetRole: { $in: ["all", "students", null] } }] };
    }
    const items = await Announcement.find(query).populate("author","fullName role").populate("batch","name").sort({publishDate:-1}).limit(100);
    res.json({success:true,announcements:items});
  } catch(e){next(e);}
});

router.post("/", authorize("admin","mentor"), body({title:{required:true,maxLength:200},content:{required:true,maxLength:10000}}), async(req,res,next)=>{
  try {
    const { title, content, targetAudience="all", targetRole="all", batch=null, publishDate=null } = req.body;
    if(!title?.trim()||!content?.trim()) return res.status(400).json({success:false,message:"Title and content are required."});
    if(!audienceValues.includes(targetAudience) || !["all", "students", "mentors"].includes(targetRole)) return res.status(400).json({success:false,message:"Invalid announcement audience."});
    if(targetAudience === "batch" || batch) {
      if(!batch) return res.status(400).json({success:false,message:"Batch is required for a batch announcement."});
      if(!await Batch.exists({_id:batch})) return res.status(404).json({success:false,message:"Batch not found."});
    }
    if(req.user.role === "mentor" && targetRole !== "students") return res.status(403).json({success:false,message:"Mentors can only announce to their assigned students."});
    const scope = batch ? "batch" : targetAudience === "batch" ? "batch" : targetAudience;
    const a=await Announcement.create({title:title.trim(),content:content.trim(),targetAudience:scope,targetRole,batch:batch||null,publishDate:publishDate?new Date(publishDate):new Date(),author:req.user._id});
    const recipients=await recipientsFor(req.user,scope,batch,targetRole);
    if(recipients.length) await Notification.insertMany(recipients.map(r=>({user:r._id,title:"New announcement",message:a.title,type:"announcement",link:"/notifications",meta:{announcementId:String(a._id)}})));
    const populated=await Announcement.findById(a._id).populate("author","fullName role").populate("batch","name");
    res.status(201).json({success:true,announcement:populated,recipientCount:recipients.length});
  }catch(e){next(e);}
});

router.patch("/:id", authorize("admin","mentor"), async(req,res,next)=>{
  try {
    const a=await Announcement.findById(req.params.id); if(!a)return res.status(404).json({success:false,message:"Announcement not found."});
    if(req.user.role==='mentor'&&String(a.author)!==String(req.user._id))return res.status(403).json({success:false,message:"You can only edit your announcements."});
    if(req.body.title!==undefined){if(!String(req.body.title).trim())return res.status(400).json({success:false,message:"Title cannot be empty."});a.title=String(req.body.title).trim();}
    if(req.body.content!==undefined){if(!String(req.body.content).trim())return res.status(400).json({success:false,message:"Content cannot be empty."});a.content=String(req.body.content).trim();}
      if(req.body.targetAudience!==undefined)a.targetAudience=req.body.targetAudience;
      if(req.body.targetRole!==undefined){if(!["all","students","mentors"].includes(req.body.targetRole))return res.status(400).json({success:false,message:"Invalid announcement role."});a.targetRole=req.body.targetRole;}
    if(req.body.batch!==undefined)a.batch=req.body.batch||null;
    if(req.body.publishDate!==undefined){const d=new Date(req.body.publishDate);if(Number.isNaN(d.getTime()))return res.status(400).json({success:false,message:"Invalid publish date."});a.publishDate=d;}
    if(!audienceValues.includes(a.targetAudience))return res.status(400).json({success:false,message:"Invalid target audience."});
      if(req.user.role==='mentor'&&!["students","batch"].includes(a.targetAudience))return res.status(403).json({success:false,message:"Mentors can only announce to their assigned students."});
      if(req.user.role==='mentor'&&a.targetRole&&a.targetRole!=="students")return res.status(403).json({success:false,message:"Mentors can only announce to students."});
    if(a.targetAudience==='batch'&&(!a.batch||!await Batch.exists({_id:a.batch})))return res.status(400).json({success:false,message:"A valid batch is required."});
    await a.save();
    await Notification.deleteMany({type:"announcement","meta.announcementId":String(a._id)});
    const recipients=await recipientsFor(req.user,a.targetAudience,a.batch,a.targetRole || (a.targetAudience === "students" ? "students" : a.targetAudience === "mentors" ? "mentors" : "all"));
    if(recipients.length) await Notification.insertMany(recipients.map(r=>({user:r._id,title:"Announcement updated",message:a.title,type:"announcement",link:"/notifications",meta:{announcementId:String(a._id)}})));
    const populated=await Announcement.findById(a._id).populate("author","fullName role").populate("batch","name");
    res.json({success:true,announcement:populated,recipientCount:recipients.length});
  }catch(e){next(e);}
});

router.delete("/:id", authorize("admin","mentor"), async(req,res,next)=>{try{const a=await Announcement.findById(req.params.id);if(!a)return res.status(404).json({success:false,message:"Announcement not found."});if(req.user.role==='mentor'&&String(a.author)!==String(req.user._id))return res.status(403).json({success:false,message:"You can only delete your announcements."});await a.deleteOne();res.json({success:true,message:"Announcement deleted."});}catch(e){next(e);}});
module.exports=router;
