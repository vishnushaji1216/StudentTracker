import Student from "../models/student.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Quiz from "../models/quiz.model.js"; 
import Teacher from "../models/teacher.model.js";
import Announcement from "../models/announcement.model.js";
import fs from 'fs';
import { uploadFileToSupabase } from "../services/supabase.js";

// --- DASHBOARD & PROFILE (Kept largely the same) ---

export const getStudentDashboard = async (req, res) => {
    try {
      const studentId = req.user.id;
      const now = new Date();
      
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      const siblingCount = await Student.countDocuments({ 
          mobile: student.mobile, 
          _id: { $ne: studentId } 
      });
  
      const allAssignments = await Assignment.find({ 
        className: student.className,
        status: { $in: ['Scheduled', 'Active'] } ,
        dueDate: { $gte: now}
      }).sort({ dueDate: 1 });
  
      const mySubmissions = await Submission.find({ student: studentId });
      const submittedAssignmentIds = mySubmissions.map(s => s.assignment?.toString());
  
      const pendingTasks = allAssignments.filter(a => 
        !submittedAssignmentIds.includes(a._id.toString())
      );
  
      const dailyMission = pendingTasks.length > 0 ? pendingTasks[0] : null;
  
      const recentFeedback = await Submission.find({ 
        student: studentId, 
        status: 'Graded' 
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assignment', 'title subject');
  
      res.json({
        student: {
          name: student.name,
          className: student.className,
          rollNo: student.rollNo,
          initials: student.name.substring(0, 2).toUpperCase()
        },
        hasSiblings: siblingCount > 0,
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
          endsIn: "Due " + new Date(t.dueDate).toLocaleDateString()
        })),
        feedback: recentFeedback
      });
  
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
};

export const getStudentProfile = async (req, res) => {
    try {
      const studentId = req.user.id;
      const currentStudent = await Student.findById(studentId);
  
      const siblings = await Student.find({
        mobile: currentStudent.mobile,
        _id: { $ne: studentId }
      }).select('name className rollNo profilePic');
  
      const teachers = await Teacher.find({
        $or: [
          { classTeachership: currentStudent.className }, 
          { 'assignments.class': currentStudent.className } 
        ]
      }).select('name mobile classTeachership assignments');
  
      const myTeachers = teachers.map(t => ({
        id: t._id,
        name: t.name,
        role: t.classTeachership === currentStudent.className ? "Class Teacher" : "Subject Teacher",
        subject: t.assignments.find(a => a.class === currentStudent.className)?.subject || "General",
        mobile: t.mobile 
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

// backend/src/controllers/student.controller.js
// import Student from "../models/student.model.js";
// import Submission from "../models/submission.model.js";

export const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log(`\n🔍 [APP DEBUG] Fetching Stats for Student: ${studentId}`);

    // 1. Get Student Info
    const student = await Student.findById(studentId);
    if (!student) {
      console.log("❌ Student not found in DB");
      return res.status(404).json({ message: "Student not found" });
    }
    console.log(`✅ Student Identified: ${student.name} (${student.className})`);

    // 2. DEBUG: Raw submission count (all statuses)
    const rawCount = await Submission.countDocuments({ student: studentId });
    console.log(`📊 Total Submissions (All Statuses): ${rawCount}`);

    // 3. Fetch Student's Graded Submissions
    const filter = { student: studentId, status: "graded" };
    console.log("🛠️ Filter used:", filter);

    const mySubmissions = await Submission.find(filter)
      .populate("assignment", "title subject")
      .populate("quiz", "title")
      .sort({ submittedAt: -1 });

    console.log(`📉 Graded Submissions Found: ${mySubmissions.length}`);

    if (mySubmissions.length === 0) {
      console.log("⚠️ No graded submissions found. Returning empty stats.");
      return res.json({
        overall: 0,
        classAvg: 0,
        graphData: [],
        subjectPerformance: [],
        recentHistory: []
      });
    }

    // Log sample submission
    const sample = mySubmissions[0];
    console.log("📝 Sample Submission:", {
      id: sample._id,
      type: sample.type,
      subject: sample.subject,
      obtainedMarks: sample.obtainedMarks,
      totalMarks: sample.totalMarks,
      assignmentPopulated: !!sample.assignment,
      quizPopulated: !!sample.quiz
    });

    // --- A. Calculate Student Stats ---
    let totalObtained = 0;
    let totalPossible = 0;
    const subjectMap = {};
    const graphDataPoints = [];

    // Graph data (last 5, chronological)
    const recentForGraph = mySubmissions.slice(0, 5).reverse();

    recentForGraph.forEach(sub => {
      const obtained = sub.obtainedMarks || 0;
      const total = sub.totalMarks || 100;

      let displayTitle =
        sub.assignment?.title ||
        sub.quiz?.title ||
        "Task";

      if (sub.subject) {
        displayTitle = `${sub.subject}: ${displayTitle}`;
      }

      graphDataPoints.push({
        label: displayTitle.substring(0, 10),
        score: total > 0 ? Math.round((obtained / total) * 100) : 0
      });
    });

    // Subject performance + overall
    mySubmissions.forEach(sub => {
      const obtained = sub.obtainedMarks || 0;
      const total = sub.totalMarks || 100;

      totalObtained += obtained;
      totalPossible += total;

      let subjName =
        sub.subject ||
        (sub.assignment ? sub.assignment.subject : "General");

      if (sub.type === "quiz" && !sub.subject) subjName = "Quiz";

      if (!subjectMap[subjName]) {
        subjectMap[subjName] = { obtained: 0, total: 0 };
      }

      subjectMap[subjName].obtained += obtained;
      subjectMap[subjName].total += total;
    });

    const overallAvg =
      totalPossible > 0
        ? Math.round((totalObtained / totalPossible) * 100)
        : 0;

    console.log("📈 Overall Avg:", overallAvg);
    console.log("📚 Subject Map:", subjectMap);

    // --- B. Class Average ---
    const classStats = await Submission.aggregate([
      { $match: { status: "graded" } },
      {
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "assignmentDetails"
        }
      },
      { $unwind: "$assignmentDetails" },
      { $match: { "assignmentDetails.className": student.className } },
      {
        $group: {
          _id: null,
          totalObtained: { $sum: "$obtainedMarks" },
          totalPossible: { $sum: "$totalMarks" }
        }
      }
    ]);

    let classAvg = 0;
    if (classStats.length > 0 && classStats[0].totalPossible > 0) {
      classAvg = Math.round(
        (classStats[0].totalObtained / classStats[0].totalPossible) * 100
      );
    }

    console.log("🏫 Class Avg:", classAvg);

    // --- C. Subject Cards ---
    const subjectPerformance = Object.keys(subjectMap).map(subj => {
      const data = subjectMap[subj];
      const percent =
        data.total > 0
          ? Math.round((data.obtained / data.total) * 100)
          : 0;

      let grade = "F";
      if (percent >= 90) grade = "A+";
      else if (percent >= 80) grade = "A";
      else if (percent >= 70) grade = "B";
      else if (percent >= 50) grade = "C";

      return {
        subject: subj,
        score: percent + "%",
        grade: `GRADE ${grade}`
      };
    });

    // --- D. Recent History ---
    const recentHistory = mySubmissions.slice(0, 5).map(sub => {
      const obtained = sub.obtainedMarks || 0;
      const total = sub.totalMarks || 100;

      let title = "Task";
      let subj = sub.subject || "General";

      if (sub.type === "quiz" && sub.quiz) {
        title = sub.quiz.title;
        if (!sub.subject) subj = "Quiz";
      } else if (sub.assignment) {
        title = sub.assignment.title;
        if (!sub.subject) subj = sub.assignment.subject;
      }

      return {
        id: sub._id,
        date: new Date(
          sub.submittedAt || sub.updatedAt
        ).toLocaleDateString(),
        title: `${subj}: ${title}`,
        score: `${obtained}/${total}`,
        isHigh: total > 0 && obtained / total >= 0.7
      };
    });

    res.json({
      overall: overallAvg,
      classAvg,
      graphData: graphDataPoints,
      subjectPerformance,
      recentHistory
    });

  } catch (error) {
    console.error("❌ Stats Error:", error);
    res.status(500).json({ message: "Failed to load stats" });
  }
};


// --- FILE UPLOAD (HOMEWORK) ---

export const submitAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { assignmentId, type } = req.body;
    const studentId = req.user.id;
    const file = req.file;

    console.log(`📂 Processing ${type} submission for Student ${studentId}`);

    const fileBuffer = fs.readFileSync(file.path);
    const fileExt = file.originalname.split('.').pop();
    const uniqueFileName = `${studentId}_${Date.now()}.${fileExt}`;
    const folderName = type === 'audio' ? 'submissions/audio' : 'submissions/handwriting';

    const publicUrl = await uploadFileToSupabase(
      fileBuffer,
      uniqueFileName,
      file.mimetype,
      folderName
    );

    fs.unlinkSync(file.path);

    // Fetch assignment to set totalMarks snapshot
    const assignment = await Assignment.findById(assignmentId);
    const maxMarks = assignment ? assignment.totalMarks : 5;

    let submission = await Submission.findOne({ 
      student: studentId, 
      assignment: assignmentId 
    });

    if (submission) {
      submission.fileUrl = publicUrl;
      submission.status = 'submitted'; // consistent lowercase
      submission.submittedAt = Date.now();
      await submission.save();
    } else {
      submission = await Submission.create({
        student: studentId,
        assignment: assignmentId,
        type: type, 
        fileUrl: publicUrl,
        status: 'submitted',
        totalMarks: maxMarks, // <--- Set Snapshot
        submittedAt: Date.now()
      });
    }

    res.status(201).json({ message: "Assignment submitted successfully!", submission });

  } catch (error) {
    console.error("❌ Submission Controller Error:", error);
    if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ message: "Server error during submission" });
  }
};

// --- NOTICES ---

export const getStudentNotices = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const notices = await Announcement.find({
      $or: [
        { targetAudience: 'Everyone' },
        { targetAudience: 'Parents' }, 
        { targetAudience: 'Class', targetClass: student.className }
      ]
    }).sort({ createdAt: -1 }).lean();

    const formattedNotices = notices.map(note => {
        const isSchool = note.sender.role === 'admin'; 
        return {
            id: note._id,
            type: isSchool ? 'school' : 'class',
            priority: note.isUrgent ? 'urgent' : 'normal',
            sender: note.sender.name || (isSchool ? "Admin Office" : "Class Teacher"),
            role: isSchool ? "Administration" : "Teacher",
            title: note.title,
            message: note.message,
            date: new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                  ' • ' + 
                  new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}),
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

// --- NEW: QUIZ CONTROLLERS ---

export const getAvailableQuizzes = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date(); // Current Server Time
    
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 1. Fetch Assignments for this class
    const assignments = await Assignment.find({ 
      className: student.className,
      type: "quiz",
      status: { $ne: "Draft" } 
    }).sort({ scheduledAt: -1 });

    // 2. Get Student's submissions
    const mySubmissions = await Submission.find({ student: studentId, type: 'quiz' });

    const quizzes = assignments.map(assign => {
      const submission = mySubmissions.find(s => 
        (s.quiz && s.quiz.toString() === assign.quizId?.toString()) || 
        (s.assignment && s.assignment.toString() === assign._id.toString())
      );
      
      const isTaken = !!submission;
      const isStarted = now >= new Date(assign.scheduledAt);
      const isExpired = now > new Date(assign.dueDate);

      // --- AUTOMATED STATUS LOGIC ---
      let uiStatus = "Upcoming";
      if (isTaken) {
        uiStatus = "Completed";
      } else if (isExpired) {
        uiStatus = "Expired"; // Automation: Tags as expired after dueDate
      } else if (isStarted) {
        uiStatus = "Live";
      }

      return {
        id: assign.quizId,
        assignmentId: assign._id,
        title: assign.title,
        subject: assign.subject || "General",
        duration: `${assign.duration} Mins`,
        status: uiStatus, // Now dynamic: Upcoming, Live, Completed, or Expired
        score: isTaken ? submission.obtainedMarks : null,
        totalMarks: assign.totalMarks,
        endTime: assign.dueDate,
        startTime: assign.scheduledAt
      };
    });

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
};

// 2. GET QUIZ PLAYER DATA (SECURE)
export const getQuizForStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const assignment = await Assignment.findOne({ quizId: id });
    if (!assignment) return res.status(404).json({ message: "Assignment details not found" });

    if (now > new Date(assignment.dueDate)) {
      return res.status(403).json({ message: "This quiz has expired and can no longer be taken." });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const isLocked = now < new Date(assignment.scheduledAt);

    const sanitizedQuestions = isLocked ? [] : quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks
    }));

    res.json({
      id: quiz._id,
      title: quiz.title,
      questions: sanitizedQuestions,
      totalMarks: quiz.totalMarks,
      duration: assignment.duration, 
      startTime: assignment.scheduledAt, 
      isLocked: isLocked 
    });

  } catch (error) {
    console.error("Quiz Load Error:", error);
    res.status(500).json({ message: "Error loading quiz" });
  }
};

// 3. SUBMIT QUIZ (GRADING ENGINE)
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, responses } = req.body;
    const studentId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    let correctCount = 0;

    console.log(`\n--- GRADING QUIZ: ${quiz.title} ---`);

    const gradedResponses = responses.map(r => {
      const question = quiz.questions[r.questionIndex];
      if (!question) return { ...r, isCorrect: false };

      // FIX 2: Strict Index Comparison
      // We expect frontend to send the Index (0, 1, 2)
      const dbIndex = Number(question.correctAnswer);
      const studentIndex = Number(r.selectedOption); 

      // Compare Indicies
      const isCorrect = dbIndex === studentIndex;

      console.log(`Q${r.questionIndex + 1}: DB Index [${dbIndex}] vs Student Index [${studentIndex}] -> ${isCorrect ? "CORRECT" : "WRONG"}`);

      if (isCorrect) {
        score += (Number(question.marks) || 1);
        correctCount++;
      }

      return {
        questionIndex: r.questionIndex,
        selectedOption: r.selectedOption, 
        correctAnswer: question.correctAnswer, 
        isCorrect
      };
    });

    console.log(`FINAL SCORE: ${score}/${quiz.totalMarks}`);

    await Submission.create({
      student: studentId,
      teacher: quiz.teacher,
      quiz: quizId,
      type: 'quiz',
      status: 'Graded',
      obtainedMarks: score,
      totalMarks: quiz.totalMarks,
      quizResponses: gradedResponses,
      submittedAt: Date.now()
    });

    res.status(201).json({ 
      message: "Quiz submitted!", 
      score, 
      total: quiz.totalMarks,
      correctCount,
      totalQuestions: quiz.questions.length,
      gradedResponses 
    });

  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ message: "Submission failed", error: error.message });
  }
};                        