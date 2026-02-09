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
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    // ------------------------

    const fileName = `hw_${studentId}_${Date.now()}.jpg`;
    const publicUrl = await uploadFileToSupabase(compressedBuffer, fileName, 'image/jpeg', 'handwriting');

    // CHECK: Does this student already have a handwriting submission?
    const existingSubmission = await Submission.findOne({
      student: studentId,
      type: { $regex: /^handwriting$/i }
    }).sort({ submittedAt: -1 }); // Get the most recent one

    if (existingSubmission) {
      // UPDATE existing submission
      existingSubmission.teacher = teacherId;
      existingSubmission.status = 'Graded';
      existingSubmission.fileUrl = publicUrl;
      existingSubmission.obtainedMarks = Number(rating);
      existingSubmission.feedback = feedback || "";
      existingSubmission.tags = tags ? JSON.parse(tags) : [];
      existingSubmission.submittedAt = new Date(); // Reset the 7-day timer

      await existingSubmission.save();
      
      res.status(200).json({ 
        message: "Updated successfully", 
        data: existingSubmission 
      });

    } else {
      // CREATE new submission (first time review for this student)
      const newSubmission = new Submission({
        student: studentId,
        teacher: teacherId,
        type: 'handwriting',
        status: 'graded',
        subject: 'General', // You can make this dynamic
        totalMarks: 5,
        fileUrl: publicUrl,
        obtainedMarks: Number(rating),
        feedback: feedback || "",
        tags: tags ? JSON.parse(tags) : [],
        submittedAt: new Date()
      });

      await newSubmission.save();
      
      res.status(201).json({ 
        message: "Logged successfully", 
        data: newSubmission 
      });
    }

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
  
      // D. Fetch handwriting submissions for these students
      const submissions = await Submission.find({
        type: { $regex: /^handwriting$/i },
        student: { $in: students.map(s => s._id) }
      }).sort({ submittedAt: -1 });

      // E. Create a map for quick lookup (one submission per student - the latest)
      const submissionMap = {};
      submissions.forEach(sub => {
        const studentId = sub.student.toString();
        if (!submissionMap[studentId]) {
          submissionMap[studentId] = sub;
        }
      });
  
      // F. Merge Data
      const queue = students.map(student => {
        const sub = submissionMap[student._id.toString()];
        
        // Determine status based on submission
        let status = 'pending';
        let color = '#64748b';
        let bg = '#f1f5f9';
        
        if (sub) {
          if (sub.status === 'Graded' || sub.status === 'graded') {
            status = 'logged';
            color = '#16a34a';
            bg = '#f0fdf4';
          } else if (sub.status === 'Pending' || sub.status === 'pending') {
            status = 'pending';
            color = '#ef4444';
            bg = '#fef2f2';
          }
        }
        
        return {
          id: student._id,
          submissionId: sub ? sub._id : null,
          fileUrl: sub ? sub.fileUrl : null,
          feedback: sub ? sub.feedback : null,
          name: student.name,
          roll: student.rollNo || 'N/A',
          className: student.className,
          initials: student.name.substring(0, 2).toUpperCase(),
          color: color,
          bg: bg,
          status: status,
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
    const { submissionId } = req.params;

    if (!submissionId) {
        console.error("❌ Delete Error: submissionId is undefined in req.params");
        return res.status(400).json({ message: "Missing submission ID" });
    }

    console.log(`🗑️ Deleting/Resetting Submission: ${submissionId}`);

    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
    }

    // OPTION 1: Reset to pending (keep the record, but mark as needs review)
    // This is better for tracking history
    submission.status = 'pending';
    submission.obtainedMarks = 0;
    submission.feedback = '';
    submission.tags = [];
    // Keep the fileUrl so you can still see old photo if needed
    
    await submission.save();

    res.json({ message: "Submission reset to pending" });

    // OPTION 2: Complete deletion (uncomment if you prefer this)
    /*
    if (submission.fileUrl) {
        await deleteFileFromSupabase(submission.fileUrl);
    }
    await Submission.findByIdAndDelete(submissionId);
    res.json({ message: "Submission deleted successfully" });
    */

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Failed to delete submission" });
  }
};

export const getAudioQueue = async (req,res) => {
  try {
    const teacherId = req.user.id;

    const myAssignments = await Assignment.find({ teacher: teacherId }).select('_id title');
    const myAssignmentIds = myAssignments.map(a => a._id);

    const submissions = await Submission.find({
      type: 'audio', 
      status: 'submitted', // submitted = pending review
      assignment: { $in: myAssignmentIds }
    })
    .populate('student', 'name rollNo profilePic') 
    .populate('assignment', 'title') 
    .sort({ submittedAt: 1 }); 

    const queue = submissions.map(sub => {
      if (!sub.student || !sub.assignment) return null;

      return {
        id: sub.student._id,
        submissionId: sub._id,
        name: sub.student.name,
        initials: sub.student.name.substring(0, 2).toUpperCase(),
        rollNo: sub.student.rollNo,
        title: sub.assignment.title,
        fileUrl: sub.fileUrl,
        submittedAt: sub.submittedAt,
        
        // UI Helpers
        avatarColor: '#e0e7ff',
        textColor: '#4f46e5',
        status: 'pending'
      };
    }).filter(Boolean);

    res.json(queue);

  } catch (error) {
    console.error("Audio Queue Error:", error);
    res.status(500).json({ message: "Failed to fetch audio queue" });
  }
};

export const logAudioReview = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { submissionId, rating, tags, feedback } = req.body;

    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.obtainedMarks = Number(rating); 
    submission.tags = tags || []; 
    submission.feedback = feedback || "";
    submission.teacher = teacherId; 
    submission.status = 'graded'; 
    
    await submission.save();

    res.status(200).json({ message: "Audio graded successfully", submission });

  } catch (error) {
    console.error("Log Audio Error:", error);
    res.status(500).json({ message: "Failed to grade audio" });
  }
};