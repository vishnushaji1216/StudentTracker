import Submission from "../models/submission.model.js";
import Student from "../models/student.model.js";
import Teacher from "../models/teacher.model.js";
import { uploadFileToSupabase } from "../services/supabase.js";

//  1. Upload file 
export const logHandwritingReview = async (req,res) => {
    try {
        const teacherId = req.user.id;
        const { studentId, rating, tags, feedback } = req.body;

        if(!req.file) return res.status(400).join({ message: "Photo is required" });

        const fileName = `hw_${studentId}_${Date.now()}.jpg`;
        const publicUrl = await uploadFileToSupabase(req.file.buffer, fileName, req.file.mimetype, 'handwriting');
        
        const newSubmission = new Submission({
            student: studentId,
      teacher: teacherId,
      type: 'Handwriting',
      fileUrl: publicUrl,
      obtainedMarks: Number(rating),
      feedback: feedback || "",
      tags: tags ? JSON.parse(tags) : [],
      status: 'Graded',
      submittedAt: new Date()
    });

    await newSubmission.save();
    res.status(201).json({ message: "logged Successfully", data: newSubmission});
        
    } catch (error) {
        console.error("Log error: ",error);
        res.status(500).json({ message: "Failed to log handwriting" }); 
    }
};

export const getHandwritingQueue = async (req, res) => {
    try {
      const teacherId = req.user.id;
      console.log(`🔍 Debugging Queue for Teacher: ${teacherId}`);
  
      // A. Fetch Teacher Profile
      const teacher = await Teacher.findById(teacherId); 
      
      if (!teacher) {
          return res.status(404).json({ message: "Teacher not found" });
      }
  
      // B. Determine Target Class
      // USE THE CORRECT FIELD FROM YOUR SCHEMA: 'classTeachership'
      const targetClass = teacher.classTeachership;
  
      console.log("✅ Teacher Found:", teacher.name);
      console.log("🎯 Class Teachership:", targetClass);
  
      if (!targetClass) {
          console.log("⚠️ Teacher has no classTeachership assigned.");
          return res.json([]); 
      }
  
      // C. Fetch ONLY students in that class
      const students = await Student.find({ 
          className: targetClass 
      }).select('name rollNo className');
  
      console.log(`📚 Found ${students.length} students in ${targetClass}`);
  
      // D. Fetch submissions for this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
  
      const recentSubmissions = await Submission.find({
        type: 'Handwriting',
        submittedAt: { $gte: startOfWeek },
        student: { $in: students.map(s => s._id) }
      });
  
      // E. Merge Data
      const queue = students.map(student => {
        const sub = recentSubmissions.find(s => s.student.toString() === student._id.toString());
        
        return {
          id: student._id,
          name: student.name,
          roll: student.rollNo || 'N/A',
          className: student.className,
          initials: student.name.substring(0, 2).toUpperCase(),
          color: sub ? '#16a34a' : '#64748b',
          bg: sub ? '#f0fdf4' : '#f1f5f9',
          status: sub ? 'logged' : 'pending',
          rating: sub ? sub.obtainedMarks : 0
        };
      });
  
      res.json(queue);
  
    } catch (error) {
      console.error("Queue Error:", error);
      res.status(500).json({ message: "Failed to fetch queue" });
    }
};