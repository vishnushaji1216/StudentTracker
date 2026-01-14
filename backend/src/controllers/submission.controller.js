import Submission from "../models/submission.model.js";
import Student from "../models/student.model.js";
import Teacher from "../models/teacher.model.js";
import { deleteFileFromSupabase, uploadFileToSupabase } from "../services/supabase.js";
import sharp from "sharp";

//  1. Upload file 
export const logHandwritingReview = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId, rating, tags, feedback } = req.body; 

    if (!req.file) return res.status(400).json({ message: "Photo is required" });

    // --- COMPRESSION STEP ---
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true }) // Resize to max width 1024px
      .jpeg({ quality: 70 }) // Compress quality to 70%
      .toBuffer();
    // ------------------------

    const fileName = `hw_${studentId}_${Date.now()}.jpg`;
    const publicUrl = await uploadFileToSupabase(compressedBuffer, fileName, 'image/jpeg', 'handwriting');

    const newSubmission = new Submission({
      student: studentId,
      teacher: teacherId,
      type: 'Handwriting',
      status: 'Graded',
      fileUrl: publicUrl,
      obtainedMarks: Number(rating),
      feedback: feedback || "",
      tags: tags ? JSON.parse(tags) : [],
      submittedAt: new Date()
    });

    await newSubmission.save();
    res.status(201).json({ message: "Logged successfully", data: newSubmission });

  } catch (error) {
    console.error("Log Error:", error);
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
          submissionId: sub ? sub._id : null,
          fileUrl: sub ? sub.fileUrl : null,
          feedback: sub ? sub.feedback : null,
          name: student.name,
          roll: student.rollNo || 'N/A',
          className: student.className,
          initials: student.name.substring(0, 2).toUpperCase(),
          color: sub ? '#16a34a' : '#64748b',
          bg: sub ? '#f0fdf4' : '#f1f5f9',
          status: sub ? 'logged' : 'pending',
          rating: sub ? sub.obtainedMarks : 0,
        };
      });
  
      res.json(queue);
  
    } catch (error) {
      console.error("Queue Error:", error);
      res.status(500).json({ message: "Failed to fetch queue" });
    }
};

export const deleteHandwritingReview = async (req, res) => {
  try {
    // 1. EXTRACT ID (Ensure variable name matches Route)
    const { submissionId } = req.params;

    // Safety Check: Did we get an ID?
    if (!submissionId) {
        console.error("❌ Delete Error: submissionId is undefined in req.params");
        return res.status(400).json({ message: "Missing submission ID" });
    }

    console.log(`🗑️ Deleting Submission: ${submissionId}`);

    // 2. Find the submission first
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
    }

    // 3. Delete Image from Supabase (if exists)
    if (submission.fileUrl) {
        await deleteFileFromSupabase(submission.fileUrl);
    }

    // 4. Delete Record from MongoDB
    await Submission.findByIdAndDelete(submissionId);

    res.json({ message: "Submission deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Failed to delete submission" });
  }
};