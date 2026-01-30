import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import Announcement from "../models/announcement.model.js";
import Submission from "../models/submission.model.js";
import Syllabus from "../models/syllabus.model.js";
import Assignment from "../models/assignment.model.js"
import Fee from "../models/fee.model.js";
import bcrypt from "bcryptjs";

// Helper function to generate the password
const generateDefaultPassword = (name, mobile) => {
  // 1. Remove spaces from name
  // 2. Take first 4 characters and make them Uppercase
  const namePart = name.replace(/\s/g, '').substring(0, 4).toUpperCase();
  // 3. Take last 2 digits of mobile
  const mobilePart = mobile.slice(-2);
  
  return namePart + mobilePart; // e.g., "ARJU45"
};

export const onboardUser = async (req, res) => {
  try {
    const { role, name, mobile, className, grNumber, rollNo, assignments, classTeachership } = req.body;

    // 1. Validation: Check if user exists
    // Included grNumber in the $or check for students as it must be unique
    const existingUser = role === "teacher" 
      ? await Teacher.findOne({ mobile }) 
      : await Student.findOne({ $or: [{ rollNo, className }, { mobile }, { grNumber }] });

    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this Mobile, GR Number, or Roll No in this class already exists" 
      });
    }

    // 2. Generate the password
    const plainPassword = generateDefaultPassword(name, mobile);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Create User based on role
    let newUser;
    if (role === "teacher") {
      newUser = await Teacher.create({
        name,
        mobile,
        password: hashedPassword,
        teacherCode: `T-${Date.now().toString().slice(-4)}`,
        classTeachership,
        assignments
      });
    } else if (role === "student") {
      newUser = await Student.create({
        name,
        mobile,
        password: hashedPassword,
        rollNo,
        className, 
        grNumber // Included new GR Number field
      });
    }

    // 4. Return success
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      generatedPassword: plainPassword,
      user: {
        id: newUser._id,
        name: newUser.name,
        role: role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const onboardBulkUsers = async (req, res) => {
  try {
    const { users } = req.body; // Expects array: [{ role, name, mobile, className, rollNo, grNumber }]

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "No users provided" });
    }

    const studentsToInsert = [];
    const errors = [];

    // Process loop
    for (const [index, user] of users.entries()) {
      try {
        // Validation: Ensure grNumber is present for bulk students
        if (user.role === 'student' && !user.grNumber) {
          throw new Error("GR Number is required for student registration");
        }

        const plainPassword = generateDefaultPassword(user.name, user.mobile);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        if (user.role === 'student') {
          studentsToInsert.push({
            name: user.name,
            mobile: user.mobile,
            password: hashedPassword,
            className: user.className,
            rollNo: user.rollNo,
            grNumber: user.grNumber, // Included in bulk object
            role: 'student'
          });
        }
      } catch (err) {
        errors.push({ row: index + 1, error: err.message });
      }
    }

    // Bulk Insert
    let insertedCount = 0;
    if (studentsToInsert.length > 0) {
      try {
        const result = await Student.insertMany(studentsToInsert, { ordered: false });
        insertedCount = result.length;
      } catch (e) {
        insertedCount = e.insertedDocs ? e.insertedDocs.length : 0;
        
        // Detailed error reporting for duplicates
        if (e.writeErrors) {
          e.writeErrors.forEach(err => {
            let detail = "Duplicate entry";
            if (err.errmsg.includes('rollNo')) detail = 'Roll No exists';
            else if (err.errmsg.includes('mobile')) detail = 'Mobile exists';
            else if (err.errmsg.includes('grNumber')) detail = 'GR Number exists';

            errors.push({ 
              msg: `Registration failed`, 
              detail: detail 
            });
          });
        }
      }
    }

    res.status(201).json({
      message: "Bulk Import Processed",
      summary: {
        totalReceived: users.length,
        successfullyAdded: insertedCount,
        failed: errors.length
      },
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error("Bulk Error:", error);
    res.status(500).json({ message: "Server error during bulk import", error: error.message });
  }
};

export const getTeacherRegistry = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { teacherCode: { $regex: search, $options: "i" } }
        ]
      };
    }

    const teachers = await Teacher.find(query);

    const formattedTeachers = teachers.map(t => {
      // Logic to find Main Subject (the one that appears most in assignments)
      const subjectCounts = {};
      t.assignments.forEach(a => {
        subjectCounts[a.subject] = (subjectCounts[a.subject] || 0) + 1;
      });
      const mainSubject = Object.keys(subjectCounts).reduce((a, b) => 
        subjectCounts[a] > subjectCounts[b] ? a : b, "N/A"
      );

      return {
        _id: t._id,
        name: t.name,
        teacherCode: t.teacherCode,
        profilePic: t.profilePic,
        roleDisplay: t.classTeachership ? `CLASS TEACHER: ${t.classTeachership}` : "SUBJECT TEACHER",
        mainSubject: mainSubject,
        avgPerformance: "82%", // Dummy value until Marks model is linked
        isClassTeacher: !!t.classTeachership
      };
    });

    res.status(200).json(formattedTeachers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teachers", error: err.message });
  }
};

export const getStudentRegistry = async (req, res) => {
  try {
    const { className, search } = req.query;
    let query = {};

    // Only fetch if a class is selected (as per your requirement)
    if (className) {
      query.className = className;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } }
      ];
    }

    // If no class selected and no search, we return empty list or specific message
    // if (!className && !search) {
    //   return res.status(200).json([]);
    // }

    const students = await Student.find(query);

    const formattedStudents = students.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      parentMobile: s.mobile,
      profilePic: s.profilePic,
      performance: "75%", // Dummy value
      className: s.className
    }));

    res.status(200).json(formattedStudents);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
};

export const sendBroadcast = async (req, res) => {
  try {
    const { target, subject, message, isUrgent } = req.body;

    if (!target || !subject || !message) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if Announcement model is loaded
    if (!Announcement) {
      throw new Error("Announcement Model is not loaded! Check imports.");
    }

    const newAnnouncement = new Announcement({
      targetAudience: target,
      title: subject,
      message,
      isUrgent: isUrgent || false,
      sender: { role: 'admin', id: req.user?.id } // Safe access to ID
    });

    await newAnnouncement.save();

    res.status(201).json({ 
      message: "Broadcast sent successfully", 
      data: newAnnouncement 
    });

  } catch (error) {
    res.status(500).json({ message: "Server error sending broadcast", error: error.message });
  }
};

export const getBroadcastHistory = async (req, res) => {
  try {
    // Admin sees EVERYTHING (Global Feed) to moderate
    const history = await Announcement.find({})
      .sort({ createdAt: -1 })
      .limit(50); // Increased limit

    res.status(200).json(history);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ message: "Could not fetch history" });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Announcement.findById(id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Admin has super-power to delete ANY notice (Admin's or Teacher's)
    await notice.deleteOne();
    
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};

const mapStarsToGrade = (stars) => {
  if (!stars) return 'B'; // Default if not set
  if (stars >= 5) return 'A';
  if (stars >= 4) return 'B';
  if (stars >= 3) return 'C';
  if (stars >= 2) return 'D';
  return 'E';
};

// --- MERGED & UPDATED CONTROLLER ---
export const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch Student Identity & Fees
    // We use .populate('fees') to get the Fee status immediately
    const student = await Student.findById(id).populate('fees');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2. Identify Class Teacher
    // Find the teacher whose 'classTeachership' matches the student's class
    const classTeacher = await Teacher.findOne({ classTeachership: student.className })
      .select('name mobile profilePic');

    // 3. Calculate Academic Stats (Student Avg vs Class Avg)
    
    // A. Student's Average
    const studentSubmissions = await Submission.find({ student: id, status: 'Graded' });
    let totalObtained = 0;
    let totalPossible = 0;
    
    studentSubmissions.forEach(sub => {
      totalObtained += sub.obtainedMarks || 0;
      totalPossible += sub.totalMarks || 100;
    });
    
    const studentAvg = totalPossible > 0 
      ? Math.round((totalObtained / totalPossible) * 100) 
      : 0;

    // B. Class Average (Aggregation)
    // Aggregates all submissions for ALL students in this class to find a benchmark
    const classStats = await Student.aggregate([
      { $match: { className: student.className } },
      {
        $lookup: {
          from: "submissions",
          localField: "_id",
          foreignField: "student",
          as: "grades"
        }
      },
      { $unwind: "$grades" },
      { $match: { "grades.status": "Graded" } },
      {
        $group: {
          _id: null,
          totalObtained: { $sum: "$grades.obtainedMarks" },
          totalMarks: { $sum: "$grades.totalMarks" }
        }
      },
      {
        $project: {
          classAvg: { 
            $cond: [
              { $eq: ["$totalMarks", 0] }, 
              0, 
              { $multiply: [{ $divide: ["$totalObtained", "$totalMarks"] }, 100] }
            ]
          }
        }
      }
    ]);

    const classAvg = classStats.length > 0 ? Math.round(classStats[0].classAvg) : 0;

    // 4. Subject Breakdown (For the UI Accordion)
    // Fetch Syllabus to determine which subjects the student actually has
    const syllabusList = await Syllabus.find({ className: student.className }).populate('teacher', 'name');

    // Iterate over subjects to build detailed report cards
    const subjectData = await Promise.all(syllabusList.map(async (doc) => {
      const subjectName = doc.subject;
      
      // Check Notebook Status (Pending Homeworks)
      const homeworks = await Assignment.find({ 
        className: student.className, 
        subject: subjectName, 
        type: 'homework'
      }).select('_id');
      
      const pendingCount = await Submission.countDocuments({
        student: id,
        assignment: { $in: homeworks.map(h => h._id) },
        status: { $in: ['Pending', 'Submitted'] } // Submitted but not Graded = Pending Check
      });

      // Fetch Latest Exam Score
      const latestExamSub = await Submission.findOne({
        student: id,
        status: 'Graded'
      })
      .populate({
        path: 'assignment',
        match: { subject: subjectName, type: { $in: ['exam', 'quiz'] } }
      })
      .sort({ submittedAt: -1 });

      const validExam = latestExamSub?.assignment ? latestExamSub : null;

      return {
        id: subjectName.toLowerCase(),
        name: subjectName,
        teacher: doc.teacher?.name || "Unknown",
        initials: subjectName.substring(0, 2).toUpperCase(),
        color: doc.color || '#4f46e5',
        bgColor: '#eef2ff',
        
        // Subject Metrics
        score: studentAvg, // (Refinement: In V2, calculate subject-specific avg here)
        avg: classAvg, 
        
        chapter: doc.chapters.find(c => c.isCurrent)?.title || "No Active Chapter",
        notebook: pendingCount === 0 ? "Checked" : "Pending",
        
        examName: validExam ? validExam.assignment.title : "No Exams",
        examScore: validExam ? validExam.obtainedMarks : null,
        examTotal: validExam ? validExam.totalMarks : null,
        isExamDone: !!validExam,
        isWeak: studentAvg < classAvg 
      };
    }));

    // 5. Return the Unified Data Structure
    res.status(200).json({
      identity: {
        id: student._id,
        name: student.name,
        className: student.className,
        rollNo: student.rollNo,
        grNumber: student.grNumber || "N/A",
        mobile: student.mobile,
        profilePic: student.profilePic,
        initials: student.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
      },
      metrics: {
        avgScore: studentAvg + "%",
        writingGrade: mapStarsToGrade(student.stats?.writingStars),
        feeStatus: (student.fees && student.fees.some(f => f.status === 'Overdue')) ? 'Overdue' : 'Clear'
      },
      chart: {
        studentAvg,
        classAvg,
        trend: studentAvg >= classAvg ? 'Performing above average' : 'Needs attention'
      },
      classTeacher: classTeacher ? {
        name: classTeacher.name,
        mobile: classTeacher.mobile,
        pic: classTeacher.profilePic
      } : null,
      subjects: subjectData
    });

  } catch (error) {
    console.error("Student Detail Error:", error);
    res.status(500).json({ message: "Server error fetching student details" });
  }
};

// --- UPDATE STUDENT PROFILE (For the Edit Button) ---
export const updateStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, className, rollNo } = req.body;
    
    const updated = await Student.findByIdAndUpdate(
      id, 
      { name, mobile, className, rollNo },
      { new: true }
    );
    
    res.status(200).json({ message: "Profile updated", student: updated });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const getTeacherDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).select('-password');
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher", error: error.message });
  }
};

// --- UPDATE TEACHER PROFILE ---
export const updateTeacherProfile = async (req, res) => {
  try {
    const { id } = req.params;
    // Updates Name, Mobile, Class Teachership, and Assignments
    const { name, mobile, classTeachership, assignments } = req.body;
    
    const updated = await Teacher.findByIdAndUpdate(
      id, 
      { name, mobile, classTeachership, assignments },
      { new: true }
    );
    
    res.status(200).json({ message: "Teacher updated", teacher: updated });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

