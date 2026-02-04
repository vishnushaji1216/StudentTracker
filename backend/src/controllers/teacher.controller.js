import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import Syllabus from "../models/syllabus.model.js";
import Assignment from "../models/assignment.model.js";
import Announcement from "../models/announcement.model.js";
import Submission from "../models/submission.model.js"; 
import Quiz from "../models/quiz.model.js";
import sharp from "sharp";

// --- 1. GET TEACHER'S CLASSES & PROFILE ---
export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).select('name teacherCode classTeachership');
    
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
    
    // Get unique list of classes for student counting
    const subjectClassNames = assignedClasses.map(a => a.class);
    const allClassNames = [...new Set([primaryClass, ...subjectClassNames].filter(Boolean))];

    // 3. Aggregate Student Counts (Keep this generic per class)
    const classCounts = await Student.aggregate([
      { $match: { className: { $in: allClassNames } } },
      { $group: { _id: "$className", count: { $sum: 1 } } }
    ]);

    const getStudentCount = (className) => {
      const stat = classCounts.find(s => s._id === className);
      return stat ? stat.count : 0;
    };

    const classesData = await Promise.all(assignedClasses.map(async (assign) => {
      // A. Syllabus Status
      const syllabusDoc = await Syllabus.findOne({ teacher: teacherId, className: assign.class, subject: assign.subject });
      const currentChapter = syllabusDoc?.chapters.find(ch => ch.isCurrent);

      const assignments = await Assignment.find({ 
        teacher: teacherId,
        className: assign.class,
        subject: assign.subject,
        status: { $in: ['Active', 'Completed'] } 
      }).select('_id totalMarks');

      const assignmentIds = assignments.map(a => a._id);

      const submissions = await Submission.find({
        assignment: { $in: assignmentIds },
        status: 'Graded'
      }).select('obtainedMarks totalMarks assignment');

      let totalObtained = 0;
      let totalPossible = 0;

      submissions.forEach(sub => {
        totalObtained += sub.obtainedMarks;
        const parentAssign = assignments.find(a => a._id.toString() === sub.assignment.toString());
        const maxMarks = sub.totalMarks || parentAssign?.totalMarks || 100;
        
        totalPossible += maxMarks;
      });

      // Calculate weighted average
      const subjectAvg = totalPossible > 0 
        ? Math.round((totalObtained / totalPossible) * 100) 
        : 0;

      return {
        id: assign.class,
        name: `Class ${assign.class}`,
        subject: assign.subject,
        isClassTeacher: (assign.class === primaryClass),
        students: getStudentCount(assign.class),
        avg: subjectAvg + "%", // <--- Returns subject-specific average
        topic: currentChapter ? `Ch ${currentChapter.chapterNo}: ${currentChapter.title}` : "No Active Topic",
        notesStatus: currentChapter ? currentChapter.notesStatus : "Pending",
        quizStatus: currentChapter ? currentChapter.quizStatus : "Pending",
      };
    }));

    const totalStudents = classCounts.reduce((acc, curr) => acc + curr.count, 0);

    // --- SEND RESPONSE ---
    res.status(200).json({
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

// --- 2. GET STUDENT DIRECTORY (UNIFIED) ---
export const getDirectory = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { className } = req.query; // Check if filtering is requested

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found!" });

    // Get all valid classes for this teacher
    const primaryClass = teacher.classTeachership;
    const assignedClasses = teacher.assignments ? teacher.assignments.map(a => a.class) : [];
    const allClassNames = [...new Set([primaryClass, ...assignedClasses].filter(Boolean))];

    let filterClasses = allClassNames;

    // IF specific class is requested (e.g. for Gradebook)
    if (className) {
        if (allClassNames.includes(className)) {
            filterClasses = [className];
        } else {
            return res.status(403).json({ message: "Unauthorized for this class" });
        }
    }

    // Fetch students belonging to the target class(es)
    const students = await Student.find({ className: { $in: filterClasses } })
      .select('-password')
      .sort({ className: 1, rollNo: 1 });
    
    res.status(200).json(students);
  } catch (error) {
    console.error("Directory error: ", error);
    res.status(500).json({ message: "Failed to fetch student directory" });
  }
};

// --- 3. GET TEACHER SUBJECTS (For Dropdown) ---
export const getTeacherSubjects = async (req, res) => {
  try {
    const { className } = req.query;
    const teacherId = req.user.id;
    
    const teacher = await Teacher.findById(teacherId);
    
    const subjects = teacher.assignments
      .filter(a => a.class === className)
      .map(a => a.subject);
      
    const uniqueSubjects = [...new Set(subjects)];
    res.json(uniqueSubjects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

// --- 4. CREATE ASSIGNMENT/EXAM ---
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
      totalMarks: totalMarks || 20,
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

// --- 5. GRADEBOOK SUBMIT ---
export const submitGradebook = async (req, res) => {
  try {
    const { className, subject, examTitle, totalMarks, studentMarks } = req.body;

    console.log("📝 Gradebook Payload:", { className, subject, count: studentMarks.length });

    if (!studentMarks || studentMarks.length === 0) {
        return res.status(400).json({ message: "No student marks provided" });
    }

    // 1. Create a "Ghost" Assignment (Container for the exam)
    const examEntry = await Assignment.create({
      teacher: req.user.id,
      title: examTitle,
      subject: subject,
      className: className,
      type: 'exam', 
      isOffline: true,
      totalMarks: Number(totalMarks),
      status: 'Completed', 
      dueDate: new Date()
    });

    const submissions = studentMarks.map(item => ({
      student: item.studentId, 
      teacher: req.user.id,
      assignment: examEntry._id,      
      subject: subject, 
      type: 'exam',     
      status: 'graded', 
      obtainedMarks: Number(item.marks), 
      totalMarks: Number(totalMarks),
      
      submittedAt: new Date()
    }));

    const result = await Submission.insertMany(submissions);
    
    console.log(`✅ Saved ${result.length} marks for ${subject}`);

    res.status(201).json({ message: "Grades published successfully", count: result.length });

  } catch (error) {
    console.error("❌ Gradebook Error:", error);
    res.status(500).json({ message: "Failed to publish grades", error: error.message });
  }
};

// --- 6. DASHBOARD STATS ---
export const getTeacherDashboardStats = async (req, res) => {
  try {
    console.log("\n🔍 [TEACHER APP DEBUG] Fetching Dashboard Stats");

    const teacherId = req.user.id;
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      console.log("❌ Teacher not found");
      return res.status(404).json({ message: "Teacher not found" });
    }

    const className =
      teacher.classTeachership ||
      (teacher.assignments?.[0] ? teacher.assignments[0].class : null);

    console.log("🏫 Class Identified:", className);

    if (!className) {
      console.log("⚠️ No class assigned to teacher");
      return res.status(200).json({
        className: "N/A",
        classPerformance: { currentAvg: 0, trend: 0, history: [] },
        pendingTasks: { audio: 0, handwriting: 0, total: 0 }
      });
    }

    // --------------------------------------------------
    // 🔎 DEBUG 1: Check subject field existence
    // --------------------------------------------------
    const debugSubjects = await Submission.aggregate([
      { $match: { status: { $in: ["graded", "Graded"] } } },
      { $group: { _id: "$subject", count: { $sum: 1 } } }
    ]);

    console.log("📊 Subjects found in submissions:", debugSubjects);

    if (debugSubjects.length === 0) {
      console.log("⚠️ No subject field found in submissions");
    }

    // --------------------------------------------------
    // ORIGINAL LOGIC STARTS HERE
    // --------------------------------------------------

    const assignments = await Assignment.find({
      className,
      type: { $in: ["exam", "quiz"] },
      status: { $in: ["Completed", "Active"] }
    }).select("title type createdAt totalMarks");

    const quizzes = await Quiz.find({ teacher: teacherId }).select(
      "title totalMarks createdAt"
    );

    let allEvents = [
      ...assignments.map(a => ({ ...a.toObject(), category: "assignment" })),
      ...quizzes.map(q => ({ ...q.toObject(), category: "quiz" }))
    ];

    allEvents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let totalObtainedGlobal = 0;
    let totalPossibleGlobal = 0;
    let eventStats = [];

    for (const event of allEvents) {
      const query = { status: { $in: ["graded", "Graded"] } };

      if (event.category === "assignment") query.assignment = event._id;
      else query.quiz = event._id;

      const submissions = await Submission.find(query).select(
        "obtainedMarks totalMarks subject"
      );

      console.log(
        `📝 ${event.title} → Submissions Found:`,
        submissions.length
      );

      if (submissions.length > 0) {
        let eventObtained = 0;
        let eventTotal = 0;

        submissions.forEach(s => {
          eventObtained += s.obtainedMarks || 0;
          eventTotal += s.totalMarks || event.totalMarks || 100;
        });

        const eventAvg =
          eventTotal > 0 ? (eventObtained / eventTotal) * 100 : 0;

        eventStats.push({
          id: event._id,
          label: event.title,
          score: Math.round(eventAvg),
          date: event.createdAt
        });

        totalObtainedGlobal += eventObtained;
        totalPossibleGlobal += eventTotal;
      }
    }

    const globalAverage =
      totalPossibleGlobal > 0
        ? Math.round((totalObtainedGlobal / totalPossibleGlobal) * 100)
        : 0;

    console.log("📈 Global Average:", globalAverage);

    const graphData = eventStats.slice(-3); // Last 3 events

    console.log("📊 Graph Data (Last 3 Events):", graphData);

    let trend = 0;
    if (eventStats.length >= 2) {
      const latest = eventStats[eventStats.length - 1].score;
      const previous = eventStats[eventStats.length - 2].score;
      trend = latest - previous;
    }

    console.log("📉 Performance Trend:", trend);

    // --------------------------------------------------
    // Pending Tasks
    // --------------------------------------------------
    const pendingAudio = await Submission.countDocuments({
      teacher: teacherId,
      type: "audio",
      status: "Submitted"
    });

    const pendingHandwriting = await Submission.countDocuments({
      teacher: teacherId,
      type: "handwriting",
      status: "Submitted"
    });

    console.log("⏳ Pending Tasks:", {
      audio: pendingAudio,
      handwriting: pendingHandwriting
    });

    res.json({
      className,
      classPerformance: {
        currentAvg: globalAverage,
        trend,
        history: graphData
      },
      pendingTasks: {
        audio: pendingAudio,
        handwriting: pendingHandwriting,
        total: pendingAudio + pendingHandwriting
      }
    });

  } catch (error) {
    console.error("❌ Teacher Dashboard Stats Error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

// --- 7. OTHER HELPERS ---
export const getAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const assignments = await Assignment.find({ teacher: teacherId, status: { $ne: 'Draft' }}).sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.teacher.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await assignment.deleteOne();
    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete assignment" });
  }
};

export const postNotice = async (req, res) => {
  try {
    const { title, message, target, targetClass, isUrgent } = req.body;
    const teacherId = req.user.id;
    const teacher = await Teacher.findById(teacherId);

    const daysToLive = isUrgent ? 14 : 7;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysToLive);

    const newAnnouncement = new Announcement({
      sender: { role: 'teacher', id: teacherId.toString(), name: teacher.name },
      targetAudience: target, 
      targetClass, 
      title, 
      message, 
      isUrgent: isUrgent || false,
      expiresAt: expirationDate
    });

    await newAnnouncement.save();
    res.status(201).json({ message: "Notice posted successfully", notice: newAnnouncement });
  } catch (error) {
    res.status(500).json({ message: "Failed to post notice" });
  }
};

export const getNotices = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const notices = await Announcement.find({
      $or: [
        { 'sender.id': teacherId.toString() },
        { targetAudience: 'Teachers' },
        { targetAudience: 'Everyone' }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Announcement.findById(id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    if (notice.sender.id !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await notice.deleteOne();
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete notice" });
  }
};

export const getClassDetail = async (req, res) => {
  try {
    const { classId, subject } = req.params;
    const teacherId = req.user.id;

    const students = await Student.find({ className: classId }).select('name rollNo stats').sort({ rollNo: 1 });
    let syllabus = await Syllabus.findOne({ teacher: teacherId, className: classId, subject });
    
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

    res.status(200).json({ roster: students, topic: currentChapter });
  } catch (error) {
    res.status(500).json({ message: "Failed to load class details" });
  }
};

export const updateClassStatus = async (req, res) => {
  try {
    const { classId, subject } = req.params;
    const { chapterNo, chapterTitle, notesStatus, quizStatus, isCompleted } = req.body;
    const teacherId = req.user.id;

    const syllabus = await Syllabus.findOne({ teacher: teacherId, className: classId, subject });
    if (!syllabus) return res.status(404).json({ message: "Syllabus not found" });

    const activeIndex = syllabus.chapters.findIndex(c => c.isCurrent);
    if (activeIndex === -1) return res.status(404).json({ message: "No active chapter" });

    if (chapterNo) syllabus.chapters[activeIndex].chapterNo = Number(chapterNo);
    if (chapterTitle) syllabus.chapters[activeIndex].title = chapterTitle;
    syllabus.chapters[activeIndex].notesStatus = notesStatus ? 'Done' : 'Pending';
    syllabus.chapters[activeIndex].quizStatus = quizStatus ? 'Done' : 'Pending';
    syllabus.chapters[activeIndex].isCompleted = isCompleted;

    await syllabus.save();
    res.status(200).json({ message: "Status updated", chapter: syllabus.chapters[activeIndex] });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// --- QUIZ FUNCTIONS ---
export const getQuizDashboard = async (req, res) => {
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
    res.status(500).json({ message:"Failed to load quiz dashboard"});
  }
};

export const createQuiz = async (req, res) => {
  try {
    const { title, className, subject, releaseType, scheduleDate, scheduleTime, duration, passingScore, questions, isDraft } = req.body;
    const teacherId = req.user.id;

    if (!questions || questions.length === 0) return res.status(400).json({ message: "Quiz must have at least one question." });

    const calculatedTotal = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

    const newQuiz = new Quiz({
      teacher: teacherId,
      title: `${title} [${className}]`,
      questions,
      totalMarks: calculatedTotal
    });

    const savedQuiz = await newQuiz.save();

    let startAt = new Date();
    if (releaseType === "Later" && scheduleDate && scheduleTime) {
      const parsedDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (!isNaN(parsedDate.getTime())) startAt = parsedDate;
    }

    const safeDuration = Number(duration) || 10;
    const endAt = new Date(startAt.getTime() + safeDuration * 60000);

    const newAssignment = new Assignment({
      teacher: teacherId,
      quizId: savedQuiz._id,
      className,
      subject: subject || "General",
      title,
      type: "quiz",
      status: isDraft ? 'Draft' : (releaseType === "Now" ? "Active" : "Scheduled"),
      scheduledAt: startAt,
      dueDate: endAt,
      duration: safeDuration,
      passingScore: Number(passingScore) || 40,
      totalMarks: calculatedTotal
    });

    await newAssignment.save();

    res.status(201).json({ message: "Quiz created successfully", quizId: newAssignment._id, status: newAssignment.status });
  } catch (error) {
    res.status(500).json({ message: "Failed to create quiz" });
  }
};

export const getQuizDetail = async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, passingScore, questions, status, scheduledAt } = req.body;

    let updateData = { title, duration, passingScore, status };

    if (scheduledAt) {
      const startAt = new Date(scheduledAt);
      const safeDuration = Number(duration) || 10;
      const endAt = new Date(startAt.getTime() + safeDuration * 60000);
      updateData.scheduledAt = startAt;
      updateData.dueDate = endAt;
  }

  const assignment = await Assignment.findByIdAndUpdate(id, updateData, { new: true });

    if (assignment.quizId && questions) {
      const newTotal = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
      await Quiz.findByIdAndUpdate(assignment.quizId, {
        questions: questions,
        totalMarks: newTotal
      });
      assignment.totalMarks = newTotal;
      await assignment.save();
    }

    res.json({ message: "Updated Successfully", assignment });
  } catch (error) {
    res.status(500).json({ message: "Update failed"});
  }
};

export const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    console.log(`\n🔍 [DEBUG] Generating Student Report + Ranking for: ${studentId}`);

    // --------------------------------------------------
    // 1. FETCH STUDENT
    // --------------------------------------------------
    const student = await Student.findById(studentId);
    if (!student) {
      console.log("❌ Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    // --------------------------------------------------
    // 2. FETCH TEACHER (PERMISSION CHECK)
    // --------------------------------------------------
    const teacher = await Teacher.findById(teacherId);
    const isClassTeacher = teacher.classTeachership === student.className;

    console.log(`👤 Teacher: ${teacher.name} | Class Teacher? ${isClassTeacher}`);

    // --------------------------------------------------
    // 3. 🔥 RANKING ENGINE (NEW)
    // --------------------------------------------------
    console.log("🏁 Calculating class ranking...");

    const classRanking = await Submission.aggregate([
      { $match: { status: "graded" } },

      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "st"
        }
      },
      { $unwind: "$st" },

      { $match: { "st.className": student.className } },

      {
        $group: {
          _id: "$student",
          avgScore: {
            $avg: {
              $multiply: [
                { $cond: [{ $eq: ["$totalMarks", 0] }, 0, { $divide: ["$obtainedMarks", "$totalMarks"] }] },
                100
              ]
            }
          }
        }
      },

      { $sort: { avgScore: -1 } }
    ]);

    console.log(`📊 Ranked Students Found: ${classRanking.length}`);

    const myRankIndex = classRanking.findIndex(
      r => r._id.toString() === studentId
    );

    const currentRank = myRankIndex !== -1 ? myRankIndex + 1 : "-";

    const totalStudents = await Student.countDocuments({
      className: student.className
    });

    const myAvgData = classRanking.find(
      r => r._id.toString() === studentId
    );
    const myAvg = myAvgData ? Math.round(myAvgData.avgScore) : 0;

    const classAvg =
      classRanking.length > 0
        ? Math.round(
            classRanking.reduce((acc, curr) => acc + curr.avgScore, 0) /
              classRanking.length
          )
        : 0;

    console.log(
      `🏆 Rank #${currentRank}/${totalStudents} | My Avg: ${myAvg}% | Class Avg: ${classAvg}%`
    );

    // --------------------------------------------------
    // 4. FETCH SYLLABUS (SUBJECTS)
    // --------------------------------------------------
    const allSyllabus = await Syllabus.find({
      className: student.className
    }).populate("teacher", "name");

    const visibleSubjects = allSyllabus;
    console.log(`📚 Visible Subjects: ${visibleSubjects.length}`);

    if (visibleSubjects.length === 0) {
      console.log("⚠️ No syllabus found for this class");
      return res.status(200).json({
        student,
        ranking: {
          currentRank,
          totalStudents,
          studentAvg: myAvg,
          classAvg,
          isAboveAvg: myAvg >= classAvg
        },
        subjects: []
      });
    }

    // --------------------------------------------------
    // 5. FETCH ALL GRADED SUBMISSIONS (FIXED QUERY)
    // --------------------------------------------------
    const allGradedSubs = await Submission.find({
      student: studentId,
      status: "graded"
    })
      .populate("assignment", "title subject type totalMarks")
      .populate("quiz", "title")
      .sort({ submittedAt: -1 });

    console.log(`📊 Total Graded Submissions: ${allGradedSubs.length}`);

    if (allGradedSubs.length > 0) {
      console.log(
        "📝 Sample Submission Subject:",
        allGradedSubs[0].subject || "Undefined"
      );
    }

    // --------------------------------------------------
    // 6. MAP SUBJECT REPORT CARDS
    // --------------------------------------------------
    const reportCards = await Promise.all(
      visibleSubjects.map(async doc => {
        const subjectName = doc.subject;

        const subGrades = allGradedSubs.filter(
          s =>
            s.subject === subjectName ||
            (s.assignment && s.assignment.subject === subjectName)
        );

        const latestExam = subGrades.find(s =>
          ["exam", "quiz"].includes(s.type)
        );

        let examTitle = "No Exams";
        let examScore = null;
        let examTotal = null;

        if (latestExam) {
          examTitle =
            latestExam.assignment?.title ||
            latestExam.quiz?.title ||
            "Test";
          examScore = latestExam.obtainedMarks;
          examTotal = latestExam.totalMarks;
        }

        const pendingCount = await Submission.countDocuments({
          student: studentId,
          subject: subjectName,
          status: { $in: ["pending", "submitted", "in-progress"] }
        });

        return {
          id: doc._id || subjectName.toLowerCase(),
          name: subjectName,
          teacher: doc.teacher?.name || "Unknown",
          initials: subjectName.substring(0, 2).toUpperCase(),

          notebook: pendingCount === 0 ? "Checked" : "Pending",

          examName: examTitle,
          examScore,
          examTotal,
          isExamDone: !!latestExam,

          chapter:
            doc.chapters.find(c => c.isCurrent)?.title ||
            "No Active Chapter",

          color: pendingCount === 0 ? "#16a34a" : "#f97316"
        };
      })
    );

    console.log("✅ Student Report + Ranking Generated");

    // --------------------------------------------------
    // 7. RESPONSE
    // --------------------------------------------------
    res.status(200).json({
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        className: student.className,
        mobile: student.mobile,
        avatar:
          student.profilePic ||
          `https://ui-avatars.com/api/?name=${student.name}&background=eef2ff&color=4f46e5`
      },
      isClassTeacher,
      ranking: {
        currentRank,
        totalStudents,
        studentAvg: myAvg,
        classAvg,
        isAboveAvg: myAvg >= classAvg
      },
      subjects: reportCards
    });

  } catch (error) {
    console.error("❌ Student Report Error:", error);
    res.status(500).json({ message: "Failed to generate student report" });
  }
};

export const getClassSubjects = async (req, res) => {
  try {
    const { className } = req.query;

    if (!className) {
      return res.status(400).json({ message: "Class name is required" });
    }

    const teachers = await Teacher.find({ 
      "assignments.class": className 
    });

    const subjectsSet = new Set();

    teachers.forEach(teacher => {
      // A teacher might teach multiple classes, so we must filter the assignments array
      teacher.assignments.forEach(assign => {
        if (assign.class === className && assign.subject) {
          subjectsSet.add(assign.subject);
        }
      });
    });

    const subjects = Array.from(subjectsSet).sort();

    if (subjects.length === 0) {
        return res.json(["Mathematics", "Science", "English", "Social Science", "Hindi", "Computer", "Marathi", "GK"]);
    }

    res.json(subjects);

  } catch (error) {
    console.error("Error fetching class subjects:", error);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};