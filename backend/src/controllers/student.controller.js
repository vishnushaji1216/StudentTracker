import Student from "../models/student.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Syllabus from "../models/syllabus.model.js";
import Teacher from "../models/teacher.model.js";

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