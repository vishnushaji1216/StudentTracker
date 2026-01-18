import Student from "../models/student.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Syllabus from "../models/syllabus.model.js";
import Teacher from "../models/teacher.model.js";
import fs from 'fs';
import { uploadFileToSupabase } from "../services/supabase.js";
import Announcement from "../models/announcement.model.js";

export const getStudentDashboard = async (req, res) => {
    try {
      const studentId = req.user.id;
      const now = new Date();
      
      // 1. Fetch Student Details
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      // 2. Check for Siblings (For the UI Dropdown)
      const siblingCount = await Student.countDocuments({ 
          mobile: student.mobile, 
          _id: { $ne: studentId } 
      });
  
      // 3. Fetch All Active Assignments for this Class
      const allAssignments = await Assignment.find({ 
        className: student.className,
        status: { $in: ['Scheduled', 'Active'] } ,
        dueDate: { $gte: now}
      }).sort({ dueDate: 1 });
  
      // 4. Filter Pending Tasks (Not yet submitted)
      const mySubmissions = await Submission.find({ student: studentId });
      const submittedAssignmentIds = mySubmissions.map(s => s.assignment?.toString());
  
      const pendingTasks = allAssignments.filter(a => 
        !submittedAssignmentIds.includes(a._id.toString())
      );
  
      // 5. Determine "Daily Mission" (The most urgent pending task)
      const dailyMission = pendingTasks.length > 0 ? pendingTasks[0] : null;
  
      // 6. Fetch Recent Feedback (Last 2 graded items)
      const recentFeedback = await Submission.find({ 
        student: studentId, 
        status: 'Graded' 
      })
      .sort({ updatedAt: -1 })
      .limit(5) // Fetch a few, frontend will filter by date
      .populate('assignment', 'title subject');
  
      res.json({
        student: {
          name: student.name,
          className: student.className,
          rollNo: student.rollNo,
          initials: student.name.substring(0, 2).toUpperCase()
        },
        hasSiblings: siblingCount > 0, // <--- New Flag
        dailyMission: dailyMission ? {
          id: dailyMission._id,
          type: dailyMission.type,
          title: dailyMission.title,
          subject: dailyMission.subject,
          deadline: new Date(dailyMission.dueDate).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}),
        } : null,
        pendingCount: pendingTasks.length,
        pendingList: pendingTasks.slice(0, 3).map(t => ({
          id: t._id,
          title: t.title,
          type: t.type,
          endsIn: "Due " + new Date(t.dueDate).toLocaleDateString() // simplified logic
        })),
        feedback: recentFeedback
      });
  
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
};

export const getStudentStats = async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);
  
      // 1. Fetch All Graded Submissions
      const submissions = await Submission.find({ 
        student: studentId, 
        status: 'Graded' 
      }).populate('assignment', 'title totalMarks subject');
  
      if (submissions.length === 0) {
        return res.json({ 
          overall: 0, 
          graphData: [], 
          subjectPerformance: [] 
        });
      }
  
      // 2. Calculate Overall Average
      let totalObtained = 0;
      let totalPossible = 0;
      
      // 3. Subject-wise aggregation
      const subjectMap = {}; // { 'Math': { obtained: 50, total: 100 } }
  
      const graphData = submissions.map(sub => {
        const obtained = sub.obtainedMarks || 0;
        const total = sub.assignment?.totalMarks || 100; // Default to 100 if missing
        const subject = sub.assignment?.subject || 'General';
  
        // Global Totals
        totalObtained += obtained;
        totalPossible += total;
  
        // Subject Totals
        if (!subjectMap[subject]) subjectMap[subject] = { obtained: 0, total: 0 };
        subjectMap[subject].obtained += obtained;
        subjectMap[subject].total += total;
  
        // Graph Point (Percentage)
        return {
          label: sub.assignment?.title.substring(0, 10) + "...", // Shorten title
          score: Math.round((obtained / total) * 100)
        };
      });
  
      // 4. Format Subject Data for Cards
      const subjectPerformance = Object.keys(subjectMap).map(subj => {
        const data = subjectMap[subj];
        const percent = Math.round((data.obtained / data.total) * 100);
        let grade = 'F';
        if (percent >= 90) grade = 'A+';
        else if (percent >= 80) grade = 'A';
        else if (percent >= 70) grade = 'B';
        else if (percent >= 50) grade = 'C';
  
        return {
          subject: subj,
          score: percent + "%",
          grade: `GRADE ${grade}`
        };
      });
  
      const overallAvg = Math.round((totalObtained / totalPossible) * 100);
  
      res.json({
        overall: overallAvg + "%",
        graphData: graphData.slice(-5), // Last 5 tests for the graph
        subjectPerformance
      });
  
    } catch (error) {
      console.error("Stats Error:", error);
      res.status(500).json({ message: "Failed to load stats" });
    }
};

export const getStudentProfile = async (req, res) => {
    try {
      const studentId = req.user.id;
      const currentStudent = await Student.findById(studentId);
  
      // Find siblings: Students with SAME mobile but DIFFERENT ID
      const siblings = await Student.find({
        mobile: currentStudent.mobile,
        _id: { $ne: studentId }
      }).select('name className rollNo profilePic');
  
      // Find My Teachers (Based on Class Assignments)
      // Logic: Find all assignments for this class, extract unique Teachers
      const classAssignments = await Assignment.find({ className: currentStudent.className })
        .populate('teacher', 'name mobile profilePic')
        .distinct('teacher'); // Get unique teacher IDs
  
      // Note: .distinct() returns IDs. We need to fetch details.
      // Better approach:
      const teachers = await Teacher.find({
        $or: [
          { classTeachership: currentStudent.className }, // Class Teacher
          { 'assignments.class': currentStudent.className } // Subject Teachers
        ]
      }).select('name mobile classTeachership assignments');
  
      // Format Teachers
      const myTeachers = teachers.map(t => ({
        id: t._id,
        name: t.name,
        role: t.classTeachership === currentStudent.className ? "Class Teacher" : "Subject Teacher",
        subject: t.assignments.find(a => a.class === currentStudent.className)?.subject || "General",
        mobile: t.mobile // For WhatsApp link
      }));
  
      res.json({
        profile: currentStudent,
        siblings,
        teachers: myTeachers
      });
  
    } catch (error) {
      console.error("Profile Error:", error);
      res.status(500).json({ message: "Failed to load profile" });
    }
};

export const submitAssignment = async (req, res) => {
  try {
    // 1. Check if file exists (Multer should have caught it, but double check)
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { assignmentId, type } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    console.log(`📂 Processing ${type} submission for Student ${studentId}`);

    // 2. Prepare for Supabase
    // Read file from the 'uploads' folder
    const fileBuffer = fs.readFileSync(file.path);
    
    // Create a clean filename: "studentId_timestamp.ext"
    const fileExt = file.originalname.split('.').pop();
    const uniqueFileName = `${studentId}_${Date.now()}.${fileExt}`;
    
    // Decide folder based on type
    const folderName = type === 'audio' ? 'submissions/audio' : 'submissions/handwriting';

    // 3. Upload using your Helper
    const publicUrl = await uploadFileToSupabase(
      fileBuffer,
      uniqueFileName,
      file.mimetype,
      folderName
    );

    // 4. Clean up local temp file
    fs.unlinkSync(file.path);

    // 5. Save/Update Submission in MongoDB
    let submission = await Submission.findOne({ 
      student: studentId, 
      assignment: assignmentId 
    });

    if (submission) {
      // Update existing submission (Re-submission)
      submission.fileUrl = publicUrl;
      submission.status = 'Submitted'; // Reset status if it was graded
      submission.submittedAt = Date.now();
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        student: studentId,
        assignment: assignmentId,
        type: type, // 'audio' or 'handwriting'
        fileUrl: publicUrl,
        status: 'Submitted',
        submittedAt: Date.now()
      });
    }

    res.status(201).json({ 
      message: "Assignment submitted successfully!", 
      submission 
    });

  } catch (error) {
    console.error("❌ Submission Controller Error:", error);
    
    // Cleanup: If file exists but upload failed, delete it
    if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    
    res.status(500).json({ message: "Server error during submission" });
  }
};

export const getStudentNotices = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // 1. Get Student Info to find their Class
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 2. Query the Announcement Model
    const notices = await Announcement.find({
      $or: [
        { targetAudience: 'Everyone' }, // Global School News
        { targetAudience: 'Parents' },  // Visible to Student/Parent login
        { 
          targetAudience: 'Class', 
          targetClass: student.className // Specific Class News (e.g., "9-A")
        }
      ]
    })
    .sort({ createdAt: -1 }) // Newest first
    .lean();

    // 3. Format data to match what the App UI expects
    const formattedNotices = notices.map(note => {
        // Determine "School" vs "Class" type for the Tabs
        // Admin = School Tab, Teacher = Class Tab
        const isSchool = note.sender.role === 'admin'; 

        return {
            id: note._id,
            type: isSchool ? 'school' : 'class', // For the 'School'/'Class' filter tabs
            priority: note.isUrgent ? 'urgent' : 'normal', // Map boolean to string
            
            sender: note.sender.name || (isSchool ? "Admin Office" : "Class Teacher"),
            role: isSchool ? "Administration" : "Teacher",
            
            title: note.title,
            message: note.message,
            date: new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                  ' • ' + 
                  new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}),
            
            // UI Styling Helpers
            icon: isSchool ? 'school' : 'chalkboard-teacher',
            iconColor: isSchool ? '#ef4444' : '#4f46e5',
            bgIcon: isSchool ? '#fef2f2' : '#eef2ff'
        };
    });

    res.json(formattedNotices);

  } catch (error) {
    console.error("Announcement Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};