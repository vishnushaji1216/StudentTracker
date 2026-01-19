import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import Syllabus from "../models/syllabus.model.js";
import Assignment from "../models/assignment.model.js";
import Announcement from "../models/announcement.model.js";
import Submission from"../models/submission.model.js";
import Quiz from "../models/quiz.model.js";

// --- 1. GET TEACHER'S CLASSES & PROFILE ---
export const getTeacherProfile = async (req, res) => {
  try {
    // Assuming req.user.id is set by your auth middleware
    const teacher = await Teacher.findById(req.user.id).select('name teacherCode'); 
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

export const getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // 1. Fetch Teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // 2. Identify Classes
    const primaryClass = teacher.classTeachership; 
    const assignedClasses = teacher.assignments; 
    const subjectClassNames = assignedClasses.map(a => a.class);
    const allClassNames = [...new Set([primaryClass, ...subjectClassNames].filter(Boolean))];

    // 3. Stats Aggregation (Same as before)
    const studentStats = await Student.aggregate([
      { $match: { className: { $in: allClassNames } } },
      { $group: { _id: "$className", count: { $sum: 1 }, avgScore: { $avg: "$stats.avgScore" } } }
    ]);

    const getStats = (className) => {
      const stat = studentStats.find(s => s._id === className);
      return { count: stat ? stat.count : 0, avg: stat && stat.avgScore ? Math.round(stat.avgScore) + "%" : "0%" };
    };

    // 4. Build Class Cards
    const classesData = await Promise.all(assignedClasses.map(async (assign) => {
      const syllabusDoc = await Syllabus.findOne({ teacher: teacherId, className: assign.class, subject: assign.subject });
      const currentChapter = syllabusDoc?.chapters.find(ch => ch.isCurrent);

      return {
        id: assign.class,
        name: `Class ${assign.class}`,
        subject: assign.subject,
        isClassTeacher: (assign.class === primaryClass),
        students: getStats(assign.class).count,
        avg: getStats(assign.class).avg,
        topic: currentChapter ? `Ch ${currentChapter.chapterNo}: ${currentChapter.title}` : "No Active Topic",
        notesStatus: currentChapter ? currentChapter.notesStatus : "Pending",
        quizStatus: currentChapter ? currentChapter.quizStatus : "Pending",
      };
    }));

    // 5. Total Students
    const totalStudents = studentStats.reduce((acc, curr) => acc + curr.count, 0);

    // --- SEND RESPONSE ---
    res.status(200).json({
      // ADDED: Profile Data for DailyTaskScreen
      profile: {
        name: teacher.name,
        teacherCode: teacher.teacherCode,
        classTeachership: teacher.classTeachership
      },
      summary: {
        totalStudents,
        totalClasses: allClassNames.length
      },
      classes: classesData
    });

  } catch (error) {
    console.error("Get Classes Error:", error);
    res.status(500).json({ message: "Server error fetching classes" });
  }
};

// --- 2. CREATE A NEW TASK (ASSIGNMENT) ---
export const createAssignment = async (req, res) => {
  try {
    const { className, subject, title, description, type, dueDate, totalMarks, targetType, rollStart, rollEnd } = req.body;
    const teacherId = req.user.id;

    if (!className || !subject || !title) {
      return res.status(400).json({ message: "Class, Subject, and Title are required" });
    }

    const newAssignment = new Assignment({
      teacher: teacherId,
      className,
      subject,
      title,
      description,
      type: type || 'homework',
      dueDate,
      totalMarks: totalMarks || 100,
      targetType: targetType || 'all',
      rollRange: targetType === 'range' ? { start: Number(rollStart), end: Number(rollEnd) } : null,
      status: 'Active'
    });

    await newAssignment.save();

    res.status(201).json({ 
      message: "Assignment created successfully", 
      assignment: newAssignment 
    });

  } catch (error) {
    console.error("Create Assignment Error:", error);
    res.status(500).json({ message: "Failed to create assignment" });
  }
};

// --- 3. GET ASSIGNMENTS HISTORY ---
export const getAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const assignments = await Assignment.find({ teacher: teacherId, status: { $ne: 'Draft' }}).sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// --- 4. DELETE ASSIGNMENT ---
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this task" });
    }

    await assignment.deleteOne();
    res.status(200).json({ message: "Assignment deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
};

// --- 5. POST A NOTICE ---
export const postNotice = async (req, res) => {
  try {
    const { title, message, target, targetClass, isUrgent } = req.body;
    const teacherId = req.user.id;
    
    const teacher = await Teacher.findById(teacherId);

    if (!title || !message || !target) {
      return res.status(400).json({ message: "Title, Message, and Target are required" });
    }

    const newAnnouncement = new Announcement({
      sender: { 
        role: 'teacher', 
        id: teacherId.toString(), // <--- FIX 1: Ensure String
        name: teacher.name 
      },
      targetAudience: target, 
      targetClass: targetClass, 
      title,
      message,
      isUrgent: isUrgent || false
    });

    await newAnnouncement.save();

    res.status(201).json({ 
      message: "Notice posted successfully", 
      notice: newAnnouncement 
    });

  } catch (error) {
    console.error("Post Notice Error:", error);
    res.status(500).json({ message: "Failed to post notice" });
  }
};

// --- 6. GET NOTICE BOARD ---
export const getNotices = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Fetch notices
    const notices = await Announcement.find({
      $or: [
        { 'sender.id': teacherId.toString() }, // <--- FIX 2: Ensure String for Query
        { targetAudience: 'Teachers' },
        { targetAudience: 'Everyone' }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(notices);
  } catch (error) {
    console.error("Get Notices Error:", error);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

// --- 7. DELETE NOTICE ---
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Announcement.findById(id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Security: Only the teacher who sent it can delete it
    // Admin notices cannot be deleted by teachers
    if (notice.sender.id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this notice" });
    }

    await notice.deleteOne();
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Delete Notice Error:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};

// --- 8. GET STUDENT DIRECTORY ---
export const getDirectory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) return res.status(404).json({ message: "Teacher not found!" });

    const primaryClass = teacher.classTeachership;
    // Ensure assignments exists to prevent crash if undefined
    const assignedClasses = teacher.assignments ? teacher.assignments.map(a => a.class) : [];

    const allClassNames = [...new Set([primaryClass, ...assignedClasses].filter(Boolean))];

    // FIX: Changed 'classname' to 'className' to match your Model
    const students = await Student.find({ className: { $in: allClassNames } })
      .select('-password')
      .sort({ className: 1, rollNo: 1 });
    
    res.status(200).json(students);
  } catch (error) {
    console.error("Directory error: ", error);
    res.status(500).json({ message: "Failed to fetch student directory" });
  }
};

// --- 9. GET CLASS DETAILS (Roster + Active Topic) ---
export const getClassDetail = async (req, res) => {
  try {
    const { classId, subject } = req.params; // We need both to find the right syllabus
    const teacherId = req.user.id;

    // A. Fetch Student Roster for this specific class
    const students = await Student.find({ className: classId })
      .select('name rollNo stats')
      .sort({ rollNo: 1 });

    // B. Fetch Syllabus to get "Current Topic" status
    let syllabus = await Syllabus.findOne({ teacher: teacherId, className: classId, subject });
    
    // If no syllabus exists, return a default/empty structure
    let currentChapter = {
      title: "No Active Topic",
      chapterNo: 0,
      notesStatus: 'Pending',
      quizStatus: 'Pending',
      isCompleted: false
    };

    if (syllabus) {
      const active = syllabus.chapters.find(c => c.isCurrent);
      if (active) currentChapter = active;
    }

    res.status(200).json({
      roster: students,
      topic: currentChapter
    });

  } catch (error) {
    console.error("Class Detail Error:", error);
    res.status(500).json({ message: "Failed to load class details" });
  }
};

// --- 10. UPDATE CLASS STATUS (Toggles) ---
export const updateClassStatus = async (req, res) => {
  try {
    const { classId, subject } = req.params;
    // Added 'chapterNo' to the destructured body
    const { chapterNo, chapterTitle, notesStatus, quizStatus, isCompleted } = req.body;
    const teacherId = req.user.id;

    const syllabus = await Syllabus.findOne({ teacher: teacherId, className: classId, subject });

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    const activeIndex = syllabus.chapters.findIndex(c => c.isCurrent);

    if (activeIndex === -1) {
       return res.status(404).json({ message: "No active chapter selected" });
    }

    // --- UPDATE LOGIC ---
    if (chapterNo) syllabus.chapters[activeIndex].chapterNo = Number(chapterNo); // <--- NEW
    if (chapterTitle) syllabus.chapters[activeIndex].title = chapterTitle;
    
    syllabus.chapters[activeIndex].notesStatus = notesStatus ? 'Done' : 'Pending';
    syllabus.chapters[activeIndex].quizStatus = quizStatus ? 'Done' : 'Pending';
    syllabus.chapters[activeIndex].isCompleted = isCompleted;

    await syllabus.save();

    res.status(200).json({ message: "Status updated", chapter: syllabus.chapters[activeIndex] });

  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

export const getQuizDashboard = async (req,res) => {
  try {
    const teacherId = req.user.id;

    const quizzes = await Assignment.find({ teacher: teacherId, type: 'quiz'})
    .populate('quizId', 'totalMarks questions')
    .sort({ createdAt: -1});

    const dashboardData = await Promise.all(quizzes.map(async(q) => {
      const submittedCount = await Submission.countDocuments({ assignment: q._id });

      let computedStatus = q.status;
      const now = new Date();

      if (q.status === 'Active' && q.dueDate && now > q.dueDate) {
          computedStatus = 'Completed';

          if(q.status !== 'Completed'){
            q.status = 'Completed';
            await q.save();
          }
      }

      return {
        _id: q._id,
        title: q.title,
        className: q.className,
        subject: q.subject,
        status: computedStatus,
        scheduledAt: q.dueDate,
        duration: q.duration,
        questionCount: q.quizId ? q.quizId.questions.length : 0,
        submittedCount: submittedCount,
      };
    }));

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error("Quiz Dashboard Error: ",error)
    res.status(500).json({ message:"Failed to load quiz dashboard"});
  }
};

export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      className,
      subject,
      releaseType,
      scheduleDate,
      scheduleTime,
      duration,
      passingScore,
      questions
    } = req.body;

    const teacherId = req.user.id;

    // A. VALIDATION
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        message: "Quiz must have at least one question."
      });
    }

    // B. CREATE CONTENT
    const calculatedTotal = questions.reduce(
      (sum, q) => sum + (Number(q.marks) || 1),
      0
    );

    const newQuiz = new Quiz({
      teacher: teacherId,
      title: `${title} [${className}]`,
      questions,
      totalMarks: calculatedTotal
    });

    const savedQuiz = await newQuiz.save();

    // C. CALCULATE TIMINGS
    let startAt = new Date();

    if (releaseType === "Later" && scheduleDate && scheduleTime) {
      const parsedDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (!isNaN(parsedDate.getTime())) {
        startAt = parsedDate;
      }
    }

    const safeDuration = Number(duration) || 10;
    const endAt = new Date(startAt.getTime() + safeDuration * 60000);

    // D. CREATE EVENT
    const newAssignment = new Assignment({
      teacher: teacherId,
      quizId: savedQuiz._id,
      className,
      subject: subject || "General",
      title,
      type: "quiz",
      status: req.body.isDraft? 'Draft' : (releaseType === "Now" ? "Active" : "Scheduled"),
      scheduledAt: startAt,
      dueDate: endAt,
      duration: safeDuration,
      passingScore: Number(passingScore) || 40,
      totalMarks: calculatedTotal
    });

    await newAssignment.save();

    res.status(201).json({
      message: "Quiz created successfully",
      quizId: newAssignment._id,
      status: newAssignment.status
    });
  } catch (error) {
    console.error("Create Quiz Error:", error);
    res.status(500).json({
      message: "Failed to create quiz"
    });
  }
};

export const getQuizDetail = async (req,res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id).populate('quizId');
    if (!assignment) return res.status(404).json({ message: "Quiz not found!"});

    const submission = await Submission.find({ assignment: id })
    .populate('student', 'name rollNo')
    .sort({ obtainedMarks: -1 });

    res.json({
      ...assignment.toObject(),
      questions: assignment.quizId ? assignment.quizId.questions : [],
      submissions: submission
    });

  } catch (error) {
    console.error("Get Detail Error: ", error)
    res.status(500).json({ message: "Server error" });
  }
};

export const updateQuiz = async (req,res) => {
  try {
    const { id } = req.params;
    const { title, duration, passingScore, questions, status } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(id, {
      title, 
      duration,
      passingScore,
      questions,
      status,
    }, { new:true});

    if (assignment.quizId && questions) {
      const newTotal = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

      await Quiz.findByIdAndUpdate(assignment.quizId, {
        questions: questions,
        totalMarks: newTotal
      });

      assignment.totalMarks = newTotal;
      await assignment.save();
    }

    res.json({ message: "updated Successfully", assignment });

  } catch (error) {
    console.error("Update Error: ", error)
    res.status(500).json({ message: "update failed"});
  }
}

export const submitGradebook = async (req,res) => {
  try {
    const { className, subject, examTitle, totalMarks, studentMarks } = req.body;

    const examEntry = await Assignment.create({
      teacher: req.user.id, 
      title: examTitle,
      subject: subject,
      className: className,
      type: 'exam', 
      totalMarks: Number(totalMarks),
      status: 'Completed', 
      dueDate: new Date()
    });

    const submissions = studentMarks.map(item => ({
      student: item.studentId,
      teacher: req.user.id,
      assignment: examEntry._id,
      type: 'exam', // Lowercase
      status: 'Graded',
      obtainedMarks: item.marks,
      totalMarks: Number(totalMarks),
      submittedAt: new Date()
    }));

    await Submission.insertMany(submissions);

    res.status(201).json({ message: "Grades published successfully" });

  } catch (error) {
    console.error("Gradebook Error:", error);
    res.status(500).json({ message: "Failed to publish grades" });
  }
}

export const getTeacherStudents = async (req, res) => {
  try {
    const { className } = req.query;
    // Fetch students belonging to this class
    const students = await Student.find({ className }).select("name rollNo _id");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getTeacherSubjects = async (req, res) => {
  try {
    const { className } = req.query;
    const teacherId = req.user.id;
    
    // Find teacher and look at their assignments/classes
    const teacher = await Teacher.findById(teacherId);
    
    // Filter assignments where class matches
    const subjects = teacher.assignments
      .filter(a => a.class === className)
      .map(a => a.subject);
      
    // Remove duplicates
    const uniqueSubjects = [...new Set(subjects)];
    
    res.json(uniqueSubjects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};